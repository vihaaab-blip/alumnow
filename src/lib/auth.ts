import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare, hash } from "bcrypt-ts";
import { prisma } from "./prisma";
import { loginSchema } from "./validation";

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET ?? "";
const googleConfigured = Boolean(googleClientId && googleClientSecret);

const isSecure = process.env.NODE_ENV === "production";

const DEMO_PASSWORD = "password123";
const DEMO_ACCOUNTS = new Set(["student1@alumnow.com", "alumni1@alumnow.com", "admin@alumnow.com"]);

async function ensureDemoAccount(email: string, password: string) {
  if (!DEMO_ACCOUNTS.has(email) || password !== DEMO_PASSWORD) return;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.passwordHash) return;
  const passwordHash = await hash(DEMO_PASSWORD, 12);
  if (email === "admin@alumnow.com") {
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: "admin", emailVerifiedAt: new Date() },
      create: { email, passwordHash, role: "admin", emailVerifiedAt: new Date(), adminUser: { create: {} } },
    });
    return;
  }
  if (email === "alumni1@alumnow.com") {
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: "alumnus", emailVerifiedAt: new Date() },
      create: {
        email, passwordHash, role: "alumnus", emailVerifiedAt: new Date(),
        alumniProfile: {
          create: {
            fullName: "Priya Sharma", universityName: "UC Berkeley", course: "B.Sc. Computer Science",
            country: "United States", graduationYearJbcn: 2021, currentStudyLevel: "undergraduate",
            qsRankingTier: "top50", bio: "JBCN alum helping students navigate applications and student life.",
            languages: JSON.stringify(["English", "Hindi"]), verificationStatus: "approved",
            isVerifiedJbcnAlumnus: true, isActive: true,
          },
        },
      },
    });
    return;
  }
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "student", emailVerifiedAt: new Date() },
    create: {
      email, passwordHash, role: "student", phone: "+919876543210", emailVerifiedAt: new Date(),
      studentProfile: { create: { fullName: "Aarav Patel", currentGrade: "A2" } },
    },
  });
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
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await ensureDemoAccount(parsed.data.email, parsed.data.password);

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.email,
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
      } else if (account?.provider === "credentials" && user?.id) {
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
