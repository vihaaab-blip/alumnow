"use server";

import { randomBytes } from "node:crypto";
import { hash } from "bcrypt-ts";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema, signupAlumniSchema } from "@/lib/validation";
import { sendEmail, emailTemplates } from "@/lib/email";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types";

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
      create: {
        email,
        passwordHash,
        role: "admin",
        emailVerifiedAt: new Date(),
        adminUser: { create: {} },
      },
    });
    return;
  }

  if (email === "alumni1@alumnow.com") {
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: "alumnus", emailVerifiedAt: new Date() },
      create: {
        email,
        passwordHash,
        role: "alumnus",
        emailVerifiedAt: new Date(),
        alumniProfile: {
          create: {
            fullName: "Priya Sharma",
            universityName: "UC Berkeley",
            course: "B.Sc. Computer Science",
            country: "United States",
            graduationYearJbcn: 2021,
            currentStudyLevel: "undergraduate",
            qsRankingTier: "top50",
            bio: "JBCN alum helping students navigate applications and student life.",
            languages: JSON.stringify(["English", "Hindi"]),
            verificationStatus: "approved",
            isVerifiedJbcnAlumnus: true,
            isActive: true,
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
      email,
      passwordHash,
      role: "student",
      phone: "+919876543210",
      emailVerifiedAt: new Date(),
      studentProfile: { create: { fullName: "Aarav Patel", currentGrade: "A2" } },
    },
  });
}

export async function signup(input: unknown): Promise<ApiResponse<{ redirectTo: string }>> {
  try { const parsed = signupSchema.parse(input); const existing = await prisma.user.findUnique({ where: { email: parsed.email } }); if (existing) return { success: false, error: "An account with this email already exists." }; const passwordHash = await hash(parsed.password, 12); const user = await prisma.user.create({ data: { email: parsed.email, passwordHash, phone: parsed.phone, role: "student", emailVerifiedAt: new Date(), studentProfile: { create: { fullName: parsed.fullName, dateOfBirth: parsed.dateOfBirth instanceof Date ? parsed.dateOfBirth : null, currentGrade: parsed.currentGrade, school: parsed.school } } } }); await sendEmail(emailTemplates.signupVerification(parsed.email, parsed.fullName), user.id); await signIn("credentials", { email: parsed.email, password: parsed.password, redirect: false }); return { success: true, data: { redirectTo: "/dashboard" } }; } catch (error) { if (error instanceof Error && "flatten" in error) return { success: false, error: "Please check your details." }; return { success: false, error: "Something went wrong. Please try again." }; }
}

export async function login(input: { email: string; password: string }): Promise<ApiResponse<{ redirectTo: string }>> {
  try {
    const parsed = loginSchema.parse(input);
    await ensureDemoAccount(parsed.email, parsed.password);
    await signIn("credentials", { ...parsed, redirect: false });
    const user = await prisma.user.findUnique({ where: { email: parsed.email }, select: { role: true } });
    const redirectTo = user?.role === "alumnus" ? "/alumni/dashboard" : user?.role === "admin" ? "/admin" : "/dashboard";
    return { success: true, data: { redirectTo } };
  } catch (error) {
    if (error instanceof AuthError) return { success: false, error: "Invalid email or password." };
    return { success: false, error: "Unable to sign in." };
  }
}

export async function signupAlumni(input: {
  fullName: string; email: string; phone: string; password: string;
  universityName: string; course: string; country: string; graduationYearJbcn: number; bio?: string; profilePhotoUrl?: string;
  languages?: string;
  sessionTypes: { type: string; pricePaise: number; maxParticipants?: number; descriptionOneLiner?: string }[];
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
}): Promise<ApiResponse<{ redirectTo: string }>> {
  try {
    const parsed = signupAlumniSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Please check your details." };
    const { data } = parsed;
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { success: false, error: "An account with this email already exists." };
    const passwordHash = await hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email, passwordHash, phone: data.phone, role: "alumnus", emailVerifiedAt: new Date(),
        alumniProfile: {
          create: {
            fullName: data.fullName,
            profilePhotoUrl: data.profilePhotoUrl,
            universityName: data.universityName,
            course: data.course,
            country: data.country,
            graduationYearJbcn: data.graduationYearJbcn,
            bio: data.bio,
            languages: data.languages ? JSON.stringify(data.languages.split(",").map((l: string) => l.trim()).filter(Boolean)) : "[]",
            sessionTypes: { create: data.sessionTypes.map((st) => ({ type: st.type, pricePaise: st.pricePaise, maxParticipants: st.maxParticipants ?? 1, descriptionOneLiner: st.descriptionOneLiner })) },
            availability: { create: data.availability.map((a) => ({ dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime })) },
          },
        },
      },
    });
    await sendEmail(emailTemplates.signupVerification(data.email, data.fullName), user.id);
    await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    return { success: true, data: { redirectTo: "/alumni/dashboard" } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
export async function logout() { await signOut({ redirectTo: "/" }); }

export async function forgotPassword(input: unknown): Promise<ApiResponse<undefined>> {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`forgot:${ip}`, { max: 3, windowMs: 900000 }))
    return { success: false, error: "Too many requests. Try again later." };
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Enter a valid email address." };
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt: new Date(Date.now() + 1800000) } });
    await sendEmail({ to: user.email, subject: "Reset your AlumNow password", body: `Reset link: ${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password?token=${token}`, eventType: "password_reset_requested" }, user.id);
  }
  return { success: true };
}
export async function resetPassword(input: unknown): Promise<ApiResponse<undefined>> { const parsed = resetPasswordSchema.safeParse(input); if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid reset details." }; const token = await prisma.passwordResetToken.findUnique({ where: { token: parsed.data.token } }); if (!token || token.expiresAt < new Date()) return { success: false, error: "This reset link has expired. Request a new one." }; await prisma.$transaction([prisma.user.update({ where: { id: token.userId }, data: { passwordHash: await hash(parsed.data.password, 12) } }), prisma.passwordResetToken.delete({ where: { id: token.id } })]); return { success: true }; }
