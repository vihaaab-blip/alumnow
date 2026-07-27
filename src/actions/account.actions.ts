"use server";

import { createServerSupabaseClient } from "@/utils/supabase/server";
import { getServerSession } from "@/lib/supabase-auth";
import type { ApiResponse } from "@/types";
import { z } from "zod";

const updateNameSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").regex(/[0-9]/, "Must contain at least 1 number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const updatePhoneSchema = z.object({
  phone: z.string().regex(/^(\+91)?[0-9]{10}$/, "Phone must be 10 digits (optionally with +91 prefix)"),
});

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

// Account reads/writes go straight against the Supabase REST API rather than
// through the pooled Prisma connection - that pool has proven unreliable in
// production (see prisma.ts history and the marketplace fixes), and unlike
// listAlumni this file had no try/catch-triggered fallback UI, so a hung
// Prisma call here just left the account page spinning forever for every
// role (admin, alumni, student all hit the same getAccountData call).
export async function updateAccountName(input: unknown): Promise<ApiResponse<{ name: string }>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Not authenticated." };

    const parsed = updateNameSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid name." };

    const userId = session.user.id;
    const payload = { fullName: parsed.data.fullName, updatedAt: new Date().toISOString() };

    if (session.user.role === "alumnus") {
      await fetch(`${supabaseUrl}/rest/v1/AlumniProfile?userId=eq.${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: restHeaders(),
        body: JSON.stringify(payload),
      });
    } else if (session.user.role === "admin") {
      // Admin accounts have no StudentProfile/AlumniProfile row - their display
      // name lives in Supabase Auth user_metadata.full_name instead.
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
        method: "PUT",
        headers: restHeaders(),
        body: JSON.stringify({ user_metadata: { full_name: parsed.data.fullName } }),
      });
    } else {
      await fetch(`${supabaseUrl}/rest/v1/StudentProfile?userId=eq.${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: restHeaders(),
        body: JSON.stringify(payload),
      });
    }

    return { success: true, data: { name: parsed.data.fullName } };
  } catch (error) {
    console.error("updateAccountName error:", error);
    return { success: false, error: "Failed to update name." };
  }
}

export async function changePassword(input: unknown): Promise<ApiResponse<undefined>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Not authenticated." };

    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

    const supabase = await createServerSupabaseClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: parsed.data.currentPassword,
    });
    if (signInError) return { success: false, error: "Current password is incorrect." };

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.newPassword,
    });
    if (updateError) return { success: false, error: "Failed to change password." };

    return { success: true };
  } catch (error) {
    console.error("changePassword error:", error);
    return { success: false, error: "Failed to change password." };
  }
}

export async function updateAccountPhone(input: unknown): Promise<ApiResponse<undefined>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Not authenticated." };

    const parsed = updatePhoneSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid phone." };

    const res = await fetch(`${supabaseUrl}/rest/v1/User?id=eq.${encodeURIComponent(session.user.id)}`, {
      method: "PATCH",
      headers: restHeaders(),
      body: JSON.stringify({ phone: parsed.data.phone, updatedAt: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error(`Failed to update phone: ${res.status} ${await res.text()}`);

    return { success: true };
  } catch (error) {
    console.error("updateAccountPhone error:", error);
    return { success: false, error: "Failed to update phone." };
  }
}

export async function getAccountData(): Promise<ApiResponse<{
  id: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: Date;
  name: string;
  hasPassword: boolean;
  profilePhotoUrl: string | null;
  studentGrade: string | null;
  school: string | null;
  alumniUniversity: string | null;
}>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Not authenticated." };

    const userId = session.user.id;
    const [userRes, studentRes, alumniRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/User?select=id,email,phone,role,createdAt&id=eq.${encodeURIComponent(userId)}&limit=1`, {
        headers: restHeaders(),
        cache: "no-store",
      }),
      fetch(`${supabaseUrl}/rest/v1/StudentProfile?select=fullName,currentGrade,school&userId=eq.${encodeURIComponent(userId)}&limit=1`, {
        headers: restHeaders(),
        cache: "no-store",
      }),
      fetch(`${supabaseUrl}/rest/v1/AlumniProfile?select=fullName,profilePhotoUrl,universityName&userId=eq.${encodeURIComponent(userId)}&limit=1`, {
        headers: restHeaders(),
        cache: "no-store",
      }),
    ]);

    if (!userRes.ok) throw new Error(`Failed to load user: ${userRes.status} ${await userRes.text()}`);

    const userRows = (await userRes.json()) as { id: string; email: string; phone: string | null; role: string; createdAt: string }[];
    const user = userRows[0];
    if (!user) return { success: false, error: "User not found." };

    const studentRows = studentRes.ok ? ((await studentRes.json()) as { fullName: string; currentGrade: string; school: string }[]) : [];
    const alumniRows = alumniRes.ok ? ((await alumniRes.json()) as { fullName: string; profilePhotoUrl: string | null; universityName: string }[]) : [];
    const studentProfile = studentRows[0] ?? null;
    const alumniProfile = alumniRows[0] ?? null;

    const name = studentProfile?.fullName ?? alumniProfile?.fullName ?? session.user.name ?? user.email;

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: new Date(user.createdAt),
        name,
        hasPassword: true,
        profilePhotoUrl: alumniProfile?.profilePhotoUrl ?? null,
        studentGrade: studentProfile?.currentGrade ?? null,
        school: studentProfile?.school ?? null,
        alumniUniversity: alumniProfile?.universityName ?? null,
      },
    };
  } catch (error) {
    console.error("getAccountData error:", error);
    return { success: false, error: "Failed to load account data." };
  }
}
