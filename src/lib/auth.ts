import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcrypt-ts";
import { prisma } from "./prisma";
import { loginSchema } from "./validation";

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET ?? "";
const googleConfigured = Boolean(googleClientId && googleClientSecret);

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "student";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});
