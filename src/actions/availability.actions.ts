"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/supabase-auth";
import { redirect } from "next/navigation";
import { availabilitySchema } from "@/lib/validation";
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

// REST, not Prisma, for the same reliability reason documented across this
// codebase (see alumni.actions.ts): the pooled connection has repeatedly
// failed silently in production, which is what caused availability saves
// to appear broken.
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

export async function getAvailability(alumniId: string) {
  return prisma.alumniAvailability.findMany({
    where: { alumniId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function getBookedSlots(
  alumniId: string,
  from = new Date(),
  to = new Date(Date.now() + 1000 * 60 * 60 * 24 * 35)
) {
  return prisma.booking.findMany({
    where: {
      alumniId,
      scheduledStartAt: { gte: from, lte: to },
      status: { not: "cancelled" },
    },
    select: { scheduledStartAt: true, scheduledEndAt: true },
  });
}

export async function getGroupBookingCounts(alumniId: string, offeringIds: string[]) {
  const counts: Record<string, number> = {};
  for (const id of offeringIds) {
    counts[id] = await prisma.booking.count({
      where: { alumniId, sessionTypeOfferingId: id, status: { notIn: ["cancelled", "no_show"] } },
    });
  }
  return counts;
}

export async function setRecurringSlots(slots: { dayOfWeek: number; startTime: string; endTime: string }[]): Promise<ApiResponse<Record<string, never>>> {
  try {
    const { profile } = await guard();

    for (const slot of slots) {
      const parsed = availabilitySchema.safeParse({ ...slot, isRecurring: true });
      if (!parsed.success) return { success: false, error: `Invalid slot: ${parsed.error.issues[0]?.message}` };
    }

    const delRes = await fetch(
      `${supabaseUrl}/rest/v1/AlumniAvailability?alumniId=eq.${encodeURIComponent(profile.id)}&isRecurring=eq.true`,
      { method: "DELETE", headers: restHeaders({ Prefer: "return=minimal" }) }
    );
    if (!delRes.ok) throw new Error(`Failed to clear recurring slots: ${delRes.status} ${await delRes.text()}`);

    if (slots.length > 0) {
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/AlumniAvailability`, {
        method: "POST",
        headers: restHeaders({ Prefer: "return=minimal" }),
        body: JSON.stringify(slots.map((s) => ({
          id: crypto.randomUUID(),
          alumniId: profile.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isRecurring: true,
        }))),
      });
      if (!insertRes.ok) throw new Error(`Failed to save recurring slots: ${insertRes.status} ${await insertRes.text()}`);
    }

    return { success: true };
  } catch (error) {
    console.error("setRecurringSlots error:", error);
    return { success: false, error: "Failed to update availability." };
  }
}

export async function setOneOffSlots(slots: { specificDate: string; startTime: string; endTime: string }[]): Promise<ApiResponse<Record<string, never>>> {
  try {
    const { profile } = await guard();

    for (const slot of slots) {
      const parsed = availabilitySchema.safeParse({ ...slot, specificDate: slot.specificDate, isRecurring: false });
      if (!parsed.success) return { success: false, error: `Invalid slot: ${parsed.error.issues[0]?.message}` };
    }

    if (slots.length > 0) {
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/AlumniAvailability`, {
        method: "POST",
        headers: restHeaders({ Prefer: "return=minimal" }),
        body: JSON.stringify(slots.map((s) => ({
          id: crypto.randomUUID(),
          alumniId: profile.id,
          specificDate: s.specificDate,
          startTime: s.startTime,
          endTime: s.endTime,
          isRecurring: false,
        }))),
      });
      if (!insertRes.ok) throw new Error(`Failed to save one-off slots: ${insertRes.status} ${await insertRes.text()}`);
    }

    return { success: true };
  } catch (error) {
    console.error("setOneOffSlots error:", error);
    return { success: false, error: "Failed to add one-off slots." };
  }
}

export async function deleteSlot(slotId: string): Promise<ApiResponse<Record<string, never>>> {
  try {
    const { profile } = await guard();
    const params = new URLSearchParams({ id: `eq.${slotId}`, alumniId: `eq.${profile.id}` });
    const res = await fetch(`${supabaseUrl}/rest/v1/AlumniAvailability?${params.toString()}`, {
      method: "DELETE",
      headers: restHeaders({ Prefer: "return=representation" }),
    });
    if (!res.ok) throw new Error(`Failed to delete slot: ${res.status} ${await res.text()}`);
    const deleted = (await res.json()) as any[];
    if (deleted.length === 0) return { success: false, error: "Slot not found." };
    return { success: true };
  } catch (error) {
    console.error("deleteSlot error:", error);
    return { success: false, error: "Failed to delete slot." };
  }
}
