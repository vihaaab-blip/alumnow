"use server";

import { randomBytes } from "node:crypto";
import { hash, compare } from "bcrypt-ts";
import { AuthError } from "next-auth";
import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema, signupAlumniSchema } from "@/lib/validation";
import { sendEmail, emailTemplates } from "@/lib/email";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types";

export async function signup(input: unknown): Promise<ApiResponse<{ redirectTo: string }>> {
  try { const parsed = signupSchema.parse(input); const email = parsed.email.trim().toLowerCase(); const existing = await prisma.user.findUnique({ where: { email } }); if (existing) return { success: false, error: "An account with this email already exists." }; const passwordHash = await hash(parsed.password, 12); await prisma.user.create({ data: { email, passwordHash, phone: parsed.phone, role: "student", emailVerifiedAt: new Date(), studentProfile: { create: { fullName: parsed.fullName, dateOfBirth: parsed.dateOfBirth instanceof Date ? parsed.dateOfBirth : null, currentGrade: parsed.currentGrade, school: parsed.school } } } }); return { success: true, data: { redirectTo: "/dashboard" } }; } catch (error) { if (error instanceof Error && "flatten" in error) return { success: false, error: "Please check your details." }; return { success: false, error: "Something went wrong. Please try again." }; }
}

export async function login(input: { email: string; password: string }): Promise<ApiResponse<{ redirectTo: string }>> {
  try {
    const parsed = loginSchema.parse(input);
    const email = parsed.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email }, select: { role: true, passwordHash: true } });
    if (!user?.passwordHash) return { success: false, error: "Invalid email or password." };
    const valid = await compare(parsed.password, user.passwordHash);
    if (!valid) return { success: false, error: "Invalid email or password." };
    const redirectTo = user.role === "alumnus" ? "/alumni/dashboard" : user.role === "admin" ? "/admin" : "/dashboard";
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
}): Promise<ApiResponse<{ redirectTo: string }>> {
  try {
    const parsed = signupAlumniSchema.safeParse(input);
    if (!parsed.success) {
      console.error("signupAlumni validation error:", parsed.error.issues);
      return { success: false, error: "Please check your details." };
    }
    const { data } = parsed;
    const email = data.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { success: false, error: "An account with this email already exists." };
    const passwordHash = await hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email, passwordHash, phone: data.phone, role: "alumnus", emailVerifiedAt: new Date(),
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
            verificationStatus: "pending",
            isVerifiedJbcnAlumnus: false,
            sessionTypes: { create: data.sessionTypes.map((st) => ({ type: st.type, pricePaise: st.pricePaise, maxParticipants: st.maxParticipants ?? 1, descriptionOneLiner: st.descriptionOneLiner })) },
          },
        },
      },
    });
    try {
      await sendEmail(emailTemplates.signupVerification(email, data.fullName), user.id);
    } catch (error) {
      console.warn("signupAlumni notification failed", error);
    }
    return { success: true, data: { redirectTo: "/alumni/dashboard" } };
  } catch (error) {
    console.error("signupAlumni failed", error);
    return { success: false, error: "Could not submit application. Please try again." };
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
