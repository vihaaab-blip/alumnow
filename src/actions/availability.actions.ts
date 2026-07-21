"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/supabase-auth";
import { redirect } from "next/navigation";
import { availabilitySchema } from "@/lib/validation";
import type { ApiResponse } from "@/types";

async function guard() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  const profile = await prisma.alumniProfile.findUnique({ where: { userId: session.user.id } });
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

    await prisma.alumniAvailability.deleteMany({
      where: { alumniId: profile.id, isRecurring: true },
    });

    if (slots.length > 0) {
      await prisma.alumniAvailability.createMany({
        data: slots.map((s) => ({
          alumniId: profile.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isRecurring: true,
        })),
      });
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
      await prisma.alumniAvailability.createMany({
        data: slots.map((s) => ({
          alumniId: profile.id,
          specificDate: new Date(s.specificDate),
          startTime: s.startTime,
          endTime: s.endTime,
          isRecurring: false,
        })),
      });
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
    const slot = await prisma.alumniAvailability.findFirst({
      where: { id: slotId, alumniId: profile.id },
    });
    if (!slot) return { success: false, error: "Slot not found." };
    await prisma.alumniAvailability.delete({ where: { id: slotId } });
    return { success: true };
  } catch (error) {
    console.error("deleteSlot error:", error);
    return { success: false, error: "Failed to delete slot." };
  }
}
