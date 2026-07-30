"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/supabase-auth";
import { alumniProfileSchema, sessionTypeSchema } from "@/lib/validation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";

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

// See admin.actions.ts revalidateAlumniSurfaces for why this is needed: the
// public network/alumni-detail pages read through a short-TTL Next data
// cache, so self-service edits here need the same explicit invalidation as
// admin edits or the change won't show until that cache naturally expires.
function revalidateAlumniSurfaces(id: string) {
  revalidatePath("/browse");
  revalidatePath(`/alumni/${id}`);
}

// REST, not Prisma - the pooled connection has repeatedly failed silently
// in production (see alumni.actions.ts listAlumni history), which is what
// caused "page not loaded" failures on these self-service pages.
async function guard() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  const res = await fetch(
    `${supabaseUrl}/rest/v1/AlumniProfile?select=id&userId=eq.${encodeURIComponent(session.user.id)}&limit=1`,
    { headers: restHeaders(), cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Failed to load profile: ${res.status} ${await res.text()}`);
  const profile = ((await res.json()) as { id: string }[])[0];
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

    const existingRes = await fetch(
      `${supabaseUrl}/rest/v1/SessionTypeOffering?select=id&alumniId=eq.${encodeURIComponent(profile.id)}&type=eq.${encodeURIComponent(parsed.data.type)}&limit=1`,
      { headers: restHeaders(), cache: "no-store" }
    );
    if (!existingRes.ok) throw new Error(`Failed to look up session type: ${existingRes.status} ${await existingRes.text()}`);
    const existing = ((await existingRes.json()) as { id: string }[])[0];

    if (existing) {
      const res = await fetch(`${supabaseUrl}/rest/v1/SessionTypeOffering?id=eq.${encodeURIComponent(existing.id)}`, {
        method: "PATCH",
        headers: restHeaders({ Prefer: "return=minimal" }),
        body: JSON.stringify({ pricePaise: parsed.data.pricePaise, maxParticipants: parsed.data.maxParticipants }),
      });
      if (!res.ok) throw new Error(`Failed to update session type: ${res.status} ${await res.text()}`);
    } else {
      const res = await fetch(`${supabaseUrl}/rest/v1/SessionTypeOffering`, {
        method: "POST",
        headers: restHeaders({ Prefer: "return=minimal" }),
        body: JSON.stringify({ id: crypto.randomUUID(), alumniId: profile.id, ...parsed.data, descriptionOneLiner: null }),
      });
      if (!res.ok) throw new Error(`Failed to create session type: ${res.status} ${await res.text()}`);
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
    const params = new URLSearchParams({ id: `eq.${offeringId}`, alumniId: `eq.${profile.id}` });
    const res = await fetch(`${supabaseUrl}/rest/v1/SessionTypeOffering?${params.toString()}`, {
      method: "DELETE",
      headers: restHeaders({ Prefer: "return=representation" }),
    });
    if (!res.ok) throw new Error(`Failed to delete session type: ${res.status} ${await res.text()}`);
    const deleted = (await res.json()) as any[];
    if (deleted.length === 0) return { success: false, error: "Session type not found." };
    revalidateAlumniSurfaces(profile.id);
    return { success: true };
  } catch (error) {
    console.error("deleteSessionType error:", error);
    return { success: false, error: "Failed to delete session type." };
  }
}
