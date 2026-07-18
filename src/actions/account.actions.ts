"use server";

import { hash, compare } from "bcrypt-ts";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

export async function updateAccountName(input: unknown): Promise<ApiResponse<{ name: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated." };

    const parsed = updateNameSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid name." };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { studentProfile: true, alumniProfile: true },
    });
    if (!user) return { success: false, error: "User not found." };

    if (user.studentProfile) {
      await prisma.studentProfile.update({
        where: { userId: user.id },
        data: { fullName: parsed.data.fullName },
      });
    } else if (user.alumniProfile) {
      await prisma.alumniProfile.update({
        where: { userId: user.id },
        data: { fullName: parsed.data.fullName },
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
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated." };

    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.passwordHash) return { success: false, error: "Account uses social login. Cannot change password." };

    const valid = await compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) return { success: false, error: "Current password is incorrect." };

    const newHash = await hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return { success: true };
  } catch (error) {
    console.error("changePassword error:", error);
    return { success: false, error: "Failed to change password." };
  }
}

export async function updateAccountPhone(input: unknown): Promise<ApiResponse<undefined>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated." };

    const parsed = updatePhoneSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid phone." };

    await prisma.user.update({
      where: { id: session.user.id },
      data: { phone: parsed.data.phone },
    });

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
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated." };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { studentProfile: true, alumniProfile: true },
    });
    if (!user) return { success: false, error: "User not found." };

    const name = user.studentProfile?.fullName ?? user.alumniProfile?.fullName ?? user.email;
    const profilePhotoUrl = user.alumniProfile?.profilePhotoUrl ?? null;

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        name,
        hasPassword: Boolean(user.passwordHash),
        profilePhotoUrl,
        studentGrade: user.studentProfile?.currentGrade ?? null,
        school: user.studentProfile?.school ?? null,
        alumniUniversity: user.alumniProfile?.universityName ?? null,
      },
    };
  } catch (error) {
    console.error("getAccountData error:", error);
    return { success: false, error: "Failed to load account data." };
  }
}
