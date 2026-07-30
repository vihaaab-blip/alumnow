"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/supabase-auth";
import { alumniProfileSchema, sessionTypeSchema } from "@/lib/validation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";

// See admin.actions.ts revalidateAlumniSurfaces for why this is needed: the
// public network/alumni-detail pages read through a short-TTL Next data
// cache, so self-service edits here need the same explicit invalidation as
// admin edits or the change won't show until that cache naturally expires.
function revalidateAlumniSurfaces(id: string) {
  revalidatePath("/browse");
  revalidatePath(`/alumni/${id}`);
}

async function guard() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  const profile = await prisma.alumniProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/apply");
  return { session, profile };
}

export async function updateProfile(input: unknown): Promise<ApiResponse<Record<string, never>>> {
  try {
    const { profile } = await guard();
    const parsed = alumniProfileSchema.safeParse(input);
    if (!parsed.success) return { success: false, errors: { form: parsed.error.issues.map(i => i.message) } };

    const { languages, ...rest } = parsed.data;
    await prisma.alumniProfile.update({
      where: { id: profile.id },
      data: {
        ...rest,
        languages: languages ? JSON.stringify(languages) : undefined,
      },
    });

    revalidateAlumniSurfaces(profile.id);
    return { success: true };
  } catch (error) {
    console.error("updateProfile error:", error);
    return { success: false, error: "Failed to update profile." };
  }
}

export async function updateProfilePhoto(formData: FormData): Promise<ApiResponse<{ url: string }>> {
  try {
    const { profile, session } = await guard();
    const file = formData.get("photo") as File;
    if (!file || file.size === 0) return { success: false, error: "No file provided." };
    if (file.size > 5 * 1024 * 1024) return { success: false, error: "File must be under 5MB." };

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) return { success: false, error: "Only jpg, png, webp allowed." };

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `alumni_${session.user.id}_${Date.now()}.${ext}`;
    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;
    await prisma.alumniProfile.update({ where: { id: profile.id }, data: { profilePhotoUrl: url } });

    revalidateAlumniSurfaces(profile.id);
    return { success: true, data: { url } };
  } catch (error) {
    console.error("updateProfilePhoto error:", error);
    return { success: false, error: "Failed to upload photo." };
  }
}

export async function updateSessionPricing(input: unknown): Promise<ApiResponse<Record<string, never>>> {
  try {
    const { profile } = await guard();
    const parsed = sessionTypeSchema.safeParse(input);
    if (!parsed.success) return { success: false, errors: { form: parsed.error.issues.map(i => i.message) } };

    const existing = await prisma.sessionTypeOffering.findFirst({
      where: { alumniId: profile.id, type: parsed.data.type },
    });

    if (existing) {
      await prisma.sessionTypeOffering.update({
        where: { id: existing.id },
        data: { pricePaise: parsed.data.pricePaise, maxParticipants: parsed.data.maxParticipants },
      });
    } else {
      await prisma.sessionTypeOffering.create({
        data: { alumniId: profile.id, ...parsed.data, descriptionOneLiner: null },
      });
    }

    revalidateAlumniSurfaces(profile.id);
    return { success: true };
  } catch (error) {
    console.error("updateSessionPricing error:", error);
    return { success: false, error: "Failed to update pricing." };
  }
}

export async function deleteSessionType(offeringId: string): Promise<ApiResponse<Record<string, never>>> {
  try {
    const { profile } = await guard();
    const offering = await prisma.sessionTypeOffering.findFirst({
      where: { id: offeringId, alumniId: profile.id },
    });
    if (!offering) return { success: false, error: "Session type not found." };
    await prisma.sessionTypeOffering.delete({ where: { id: offeringId } });
    revalidateAlumniSurfaces(profile.id);
    return { success: true };
  } catch (error) {
    console.error("deleteSessionType error:", error);
    return { success: false, error: "Failed to delete session type." };
  }
}
