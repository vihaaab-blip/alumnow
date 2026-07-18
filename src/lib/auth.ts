import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcrypt-ts";
import { prisma } from "./prisma";
import { loginSchema } from "./validation";

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET ?? "";
const googleConfigured = Boolean(googleClientId && googleClientSecret);

const isSecure = process.env.NODE_ENV === "production";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isSecure,
      },
    },
  },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) throw new Error("Invalid email or password.");

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, include: { studentProfile: true, alumniProfile: true } });
        if (!user?.passwordHash) throw new Error("Invalid email or password.");

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) throw new Error("Invalid email or password.");

        return {
          id: user.id,
          email: user.email,
          name: user.studentProfile?.fullName ?? user.alumniProfile?.fullName ?? user.email,
          role: user.role,
        };
      },
    }),
    ...(googleConfigured ? [
      Google({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      }),
    ] : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        const email = user.email;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) {
          const newUser = await prisma.user.create({
            data: {
              email,
              emailVerifiedAt: new Date(),
              role: "student",
              studentProfile: {
                create: { fullName: user.name ?? email.split("@")[0] ?? email },
              },
            },
          });
          user.id = newUser.id;
          (user as any).role = newUser.role;
        } else {
          user.id = existing.id;
          (user as any).role = existing.role;
          if (!existing.emailVerifiedAt) {
            await prisma.user.update({ where: { id: existing.id }, data: { emailVerifiedAt: new Date() } });
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "student";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "student";
      }
      return session;
    },
  },
});
