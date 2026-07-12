"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookingDraftSchema } from "@/lib/validation";
import { sendEmail, emailTemplates } from "@/lib/email";

async function studentId() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "student")
    throw new Error("Please sign in as a student.");
  return session.user.id;
}

export async function getSessionOfferingWithAlumni(offeringId: string) {
  try {
    return await prisma.sessionTypeOffering.findUnique({
      where: { id: offeringId },
      include: { alumni: true },
    });
  } catch {
    return null;
  }
}

export async function createBookingDraft(input: unknown) {
  try {
    let userId: string;
    try {
      userId = await studentId();
    } catch {
      return { success: false, error: "Please sign in as a student." } as const;
    }

    const parsed = bookingDraftSchema.safeParse(input);
    if (!parsed.success)
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid slot." } as const;

    const data = parsed.data;

    const offering = await prisma.sessionTypeOffering.findFirst({
      where: { id: data.sessionTypeOfferingId, alumniId: data.alumniId },
      include: { alumni: true },
    });
    if (!offering)
      return { success: false, error: "Session is no longer available. Please refresh and choose another session." } as const;

    const conflict = await prisma.booking.findFirst({
      where: {
        alumniId: data.alumniId,
        status: { not: "cancelled" },
        scheduledStartAt: { lt: new Date(data.scheduledEndAt) },
        scheduledEndAt: { gt: new Date(data.scheduledStartAt) },
      },
    });
    if (conflict)
      return {
        success: false,
        error: "That time was just booked. Please choose another slot.",
      } as const;

    const booking = await prisma.booking.create({
      data: {
        studentId: userId,
        alumniId: data.alumniId,
        sessionTypeOfferingId: data.sessionTypeOfferingId,
        scheduledStartAt: new Date(data.scheduledStartAt),
        scheduledEndAt: new Date(data.scheduledEndAt),
        status: "pending_payment",
      },
      include: { alumni: true, sessionType: true },
    });

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amountPaise: offering.pricePaise,
      },
    });

    return { success: true, data: booking } as const;
  } catch (error) {
    console.error("createBookingDraft failed", error);
    return { success: false, error: "Could not create booking. Please refresh and try again." } as const;
  }
}

export async function getBookingById(id: string) {
  try {
    const userId = await studentId();
    return await prisma.booking.findFirst({
      where: { id, studentId: userId },
      include: { alumni: true, sessionType: true, payment: true, review: true },
    });
  } catch {
    return null;
  }
}

export async function getMyBookings() {
  try {
    const userId = await studentId();
    return await prisma.booking.findMany({
      where: { studentId: userId },
      include: { alumni: true, sessionType: true, payment: true, review: true },
      orderBy: { scheduledStartAt: "asc" },
    });
  } catch {
    return [];
  }
}

export async function getAlumniBookings() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "alumnus") {
      return [];
    }
    const profile = await prisma.alumniProfile.findUnique({
      where: { userId: session.user.id }
    });
    if (!profile) return [];
    return await prisma.booking.findMany({
      where: { alumniId: profile.id },
      include: {
        student: {
          include: {
            studentProfile: true
          }
        },
        sessionType: true,
        payment: true,
        review: true
      },
      orderBy: { scheduledStartAt: "asc" },
    });
  } catch {
    return [];
  }
}

export async function cancelBooking(id: string) {
  let userId: string;
  try {
    userId = await studentId();
  } catch {
    return { success: false, error: "Please sign in as a student." };
  }

  const booking = await prisma.booking.findFirst({
    where: { id, studentId: userId },
    include: { alumni: true, student: true },
  });
  if (!booking || ["completed", "cancelled"].includes(booking.status))
    return { success: false, error: "This booking cannot be cancelled." };

  await prisma.booking.update({ where: { id }, data: { status: "cancelled" } });

  const date = new Date(booking.scheduledStartAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  await sendEmail(
    emailTemplates.bookingCancelled(booking.student.email, booking.alumni.fullName, date),
    userId,
  );

  return { success: true };
}
