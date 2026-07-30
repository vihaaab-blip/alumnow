"use server";

import { createServerSupabaseClient } from "@/utils/supabase/server";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema, signupAlumniSchema } from "@/lib/validation";
import { sendEmail, emailTemplates } from "@/lib/email";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { createUserWithAdmin } from "@/lib/supabase-admin";
import type { ApiResponse } from "@/types";
import { ZodError } from "zod";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function restHeaders(extra?: HeadersInit): HeadersInit {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function findUserByEmail(email: string) {
  const params = new URLSearchParams({ select: "id,email", email: `eq.${email}`, limit: "1" });
  const res = await fetch(`${supabaseUrl}/rest/v1/User?${params.toString()}`, {
    headers: restHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`User lookup failed: ${res.status} ${await res.text()}`);
  const rows = await res.json() as { id: string; email: string }[];
  return rows[0] ?? null;
}

async function createStudentUserRecord(input: {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  dateOfBirth: Date | null;
  currentGrade: string;
  school: string;
}) {
  const now = new Date().toISOString();
  const userRes = await fetch(`${supabaseUrl}/rest/v1/User`, {
    method: "POST",
    headers: restHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify({
      id: input.id,
      email: input.email,
      phone: input.phone,
      role: "student",
      createdAt: now,
      updatedAt: now,
      emailVerifiedAt: now,
    }),
  });
  if (!userRes.ok) throw new Error(`User create failed: ${userRes.status} ${await userRes.text()}`);

  const profileRes = await fetch(`${supabaseUrl}/rest/v1/StudentProfile`, {
    method: "POST",
    headers: restHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify({
      id: crypto.randomUUID(),
      userId: input.id,
      fullName: input.fullName,
      dateOfBirth: input.dateOfBirth?.toISOString() ?? null,
      currentGrade: input.currentGrade,
      school: input.school,
    }),
  });
  if (!profileRes.ok) throw new Error(`StudentProfile create failed: ${profileRes.status} ${await profileRes.text()}`);
}

export async function createAlumniUserRecord(input: {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  profilePhotoUrl?: string;
  universityName: string;
  course: string;
  country: string;
  graduationYearJbcn: number;
  bio?: string;
  languages?: string;
  sessionTypes: { type: string; pricePaise: number; maxParticipants?: number; descriptionOneLiner?: string }[];
}) {
  const now = new Date().toISOString();
  const userRes = await fetch(`${supabaseUrl}/rest/v1/User`, {
    method: "POST",
    headers: restHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify({
      id: input.id,
      email: input.email,
      phone: input.phone,
      role: "alumnus",
      createdAt: now,
      updatedAt: now,
      emailVerifiedAt: now,
    }),
  });
  if (!userRes.ok) throw new Error(`User create failed: ${userRes.status} ${await userRes.text()}`);

  const alumniId = crypto.randomUUID();
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/AlumniProfile`, {
    method: "POST",
    headers: restHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify({
      id: alumniId,
      userId: input.id,
      fullName: input.fullName,
      profilePhotoUrl: input.profilePhotoUrl,
      universityName: input.universityName,
      course: input.course,
      country: input.country,
      graduationYearJbcn: input.graduationYearJbcn,
      bio: input.bio,
      languages: input.languages ? JSON.stringify(input.languages.split(",").map((l) => l.trim()).filter(Boolean)) : "[]",
      verificationStatus: "pending",
      isVerifiedJbcnAlumnus: false,
      createdAt: now,
      updatedAt: now,
    }),
  });
  if (!profileRes.ok) throw new Error(`AlumniProfile create failed: ${profileRes.status} ${await profileRes.text()}`);

  const sessionRows = input.sessionTypes.map((st) => ({
    id: crypto.randomUUID(),
    alumniId,
    type: st.type,
    pricePaise: st.pricePaise,
    maxParticipants: st.maxParticipants ?? 1,
    descriptionOneLiner: st.descriptionOneLiner,
  }));
  const sessionRes = await fetch(`${supabaseUrl}/rest/v1/SessionTypeOffering`, {
    method: "POST",
    headers: restHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify(sessionRows),
  });
  if (!sessionRes.ok) throw new Error(`SessionTypeOffering create failed: ${sessionRes.status} ${await sessionRes.text()}`);
}

export async function signup(input: unknown): Promise<ApiResponse<{ redirectTo: string }>> {
  try {
    const parsed = signupSchema.parse(input);
    const email = parsed.email.trim().toLowerCase();

    const existing = await findUserByEmail(email);
    if (existing) return { success: false, error: "An account with this email already exists." };

    const authUser = await createUserWithAdmin({
      email,
      password: parsed.password,
      user_metadata: { role: "student", full_name: parsed.fullName, phone: parsed.phone },
    });

    if (!authUser) {
      return { success: false, error: "Could not create account. Please try again." };
    }

    await createStudentUserRecord({
      id: authUser.id,
      email,
      phone: parsed.phone,
      fullName: parsed.fullName,
      dateOfBirth: parsed.dateOfBirth instanceof Date ? parsed.dateOfBirth : null,
      currentGrade: parsed.currentGrade,
      school: parsed.school,
    });

    // Admin API creation does not establish the browser session. Sign the new
    // user in through the SSR client so the dashboard redirect is authenticated.
    const supabase = await createServerSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.password,
    });
    if (signInError) {
      console.error("signup session error:", signInError.message);
      return { success: false, error: "Account created, but we could not start your session. Please sign in." };
    }

    return { success: true, data: { redirectTo: "/dashboard" } };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Please check your details." };
    }
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("signup error:", msg, error);
    return { success: false, error: `Something went wrong: ${msg}` };
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
      const issue = parsed.error.issues[0];
      const fieldLabel = issue?.path?.[0] ? String(issue.path[0]) : null;
      return {
        success: false,
        error: issue?.message
          ? fieldLabel
            ? `${fieldLabel}: ${issue.message}`
            : issue.message
          : "Please check your details.",
      };
    }
    const { data } = parsed;
    const email = data.email.trim().toLowerCase();

    const existing = await findUserByEmail(email);
    if (existing) return { success: false, error: "An account with this email already exists." };

    const authUser = await createUserWithAdmin({
      email,
      password: data.password,
      user_metadata: { role: "alumnus", full_name: data.fullName, phone: data.phone },
    });

    if (!authUser) {
      return { success: false, error: "Could not create account. Please try again." };
    }

    await createAlumniUserRecord({
      id: authUser.id,
      email,
      phone: data.phone,
      fullName: data.fullName,
      profilePhotoUrl: data.profilePhotoUrl,
      universityName: data.universityName,
      course: data.course,
      country: data.country,
      graduationYearJbcn: data.graduationYearJbcn,
      bio: data.bio,
      languages: data.languages,
      sessionTypes: data.sessionTypes,
    });

    const supabase = await createServerSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: data.password,
    });
    if (signInError) {
      console.error("signupAlumni session error:", signInError.message);
      return { success: false, error: "Account created, but we could not start your session. Please sign in." };
    }

    try {
      await sendEmail(emailTemplates.signupVerification(email, data.fullName), authUser.id);
    } catch (error) {
      console.warn("signupAlumni notification failed", error);
    }
    try {
      await sendEmail(emailTemplates.newAlumniApplication(data.fullName, email, data.universityName));
    } catch (error) {
      console.warn("signupAlumni admin notification failed", error);
    }
    return { success: true, data: { redirectTo: "/alumni/application-under-review" } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("signupAlumni failed:", msg, error);
    return { success: false, error: `Could not submit application: ${msg}` };
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
