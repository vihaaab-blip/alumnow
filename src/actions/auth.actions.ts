"use server";

import { createServerSupabaseClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema, signupAlumniSchema } from "@/lib/validation";
import { sendEmail, emailTemplates } from "@/lib/email";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { createUserWithAdmin } from "@/lib/supabase-admin";
import type { ApiResponse } from "@/types";

export async function signup(input: unknown): Promise<ApiResponse<{ redirectTo: string }>> {
  try {
    const parsed = signupSchema.parse(input);
    const email = parsed.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { success: false, error: "An account with this email already exists." };

    const authUser = await createUserWithAdmin({
      email,
      password: parsed.password,
      user_metadata: { role: "student", full_name: parsed.fullName, phone: parsed.phone },
    });

    if (!authUser) {
      return { success: false, error: "Could not create account. Please try again." };
    }

    await prisma.user.create({
      data: {
        id: authUser.id,
        email,
        phone: parsed.phone,
        role: "student",
        emailVerifiedAt: new Date(),
        studentProfile: {
          create: {
            fullName: parsed.fullName,
            dateOfBirth: parsed.dateOfBirth instanceof Date ? parsed.dateOfBirth : null,
            currentGrade: parsed.currentGrade,
            school: parsed.school,
          },
        },
      },
    });

    return { success: true, data: { redirectTo: "/dashboard" } };
  } catch (error) {
    if (error instanceof Error && "flatten" in error) return { success: false, error: "Please check your details." };
    console.error("signup error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData): Promise<{ error?: string } | undefined> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email.trim().toLowerCase(),
    password: parsed.data.password,
  });

  if (error || !data.session) {
    return { error: "Invalid email or password." };
  }

  const role = data.user.user_metadata?.role as string ?? "student";
  const redirectTo = role === "alumnus" ? "/alumni/dashboard" : role === "admin" ? "/admin" : "/dashboard";
  redirect(redirectTo);
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

    const authUser = await createUserWithAdmin({
      email,
      password: data.password,
      user_metadata: { role: "alumnus", full_name: data.fullName, phone: data.phone },
    });

    if (!authUser) {
      return { success: false, error: "Could not create account. Please try again." };
    }

    const user = await prisma.user.create({
      data: {
        id: authUser.id,
        email, phone: data.phone, role: "alumnus", emailVerifiedAt: new Date(),
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

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
}

export async function forgotPassword(input: unknown): Promise<ApiResponse<undefined>> {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`forgot:${ip}`, { max: 3, windowMs: 900000 }))
    return { success: false, error: "Too many requests. Try again later." };
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Enter a valid email address." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/reset-password`,
  });
  if (error) console.error("forgotPassword supabase error:", error);

  return { success: true };
}

export async function resetPassword(input: unknown): Promise<ApiResponse<undefined>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid reset details." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { success: false, error: "Failed to reset password. The link may have expired." };

  return { success: true };
}
