import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare, hash } from "bcrypt-ts";
import { prisma } from "./prisma";
import { loginSchema } from "./validation";

const isSecure = process.env.NODE_ENV === "production";

function profileNameFromEmail(email: string) {
  return email
    .split("@")[0]!
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || email;
}

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
        createIfMissing: { label: "Create account", type: "text" },
        fullName: { label: "Full name", type: "text" },
        phone: { label: "Phone", type: "text" },
        school: { label: "School", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const email = parsed.data.email.trim().toLowerCase();

        let user = await prisma.user.findUnique({
          where: { email },
          include: {
            studentProfile: { select: { fullName: true } },
            alumniProfile: { select: { fullName: true } },
          },
        });
        if (!user && credentials?.createIfMissing === "student") {
          const passwordHash = await hash(parsed.data.password, 12);
          user = await prisma.user.create({
            data: {
              email,
              passwordHash,
              phone: String(credentials.phone ?? "") || null,
              role: "student",
              emailVerifiedAt: new Date(),
              studentProfile: {
                create: {
                  fullName: String(credentials.fullName ?? "").trim() || profileNameFromEmail(email),
                  currentGrade: "Other",
                  school: String(credentials.school ?? "").trim() || "Not specified",
                },
              },
            },
            include: {
              studentProfile: { select: { fullName: true } },
              alumniProfile: { select: { fullName: true } },
            },
          });
        }
        if (!user?.passwordHash) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.studentProfile?.fullName ?? user.alumniProfile?.fullName ?? user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials" && user?.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, role: true } });
        if (dbUser) {
          (user as any).role = dbUser.role;
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
