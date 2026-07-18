"use server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentRefSchema } from "@/lib/validation";
import { sendEmail, emailTemplates } from "@/lib/email";
export async function submitPaymentRef(bookingId: string, input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Please sign in." };
    const parsed = paymentRefSchema.safeParse(input);
    if (!parsed.success)
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid reference." };
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, studentId: session.user.id },
      include: { payment: true, alumni: true, student: true },
    });
    if (!booking?.payment)
      return { success: false, error: "Payment record not found." };
    await prisma.payment.update({
      where: { bookingId },
      data: {
        upiTransactionRef: parsed.data.upiTransactionRef,
        status: "verified",
        verifiedAt: new Date(),
      },
    });
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "confirmed",
        meetLink: `https://meet.google.com/alumnow-${bookingId.slice(-6)}`,
      },
    });
    const amount = `\u20B9${(booking.payment.amountPaise / 100).toLocaleString("en-IN")}`;
    const date = new Date(booking.scheduledStartAt).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const time = new Date(booking.scheduledStartAt).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    await Promise.allSettled([
      sendEmail(
        emailTemplates.paymentVerified(booking.student.email, amount),
        session.user.id,
      ),
      sendEmail(
        emailTemplates.bookingConfirmed(
          booking.student.email,
          booking.alumni.fullName,
          date,
          time,
        ),
        session.user.id,
      ),
    ]);
    return { success: true };
  } catch (error) {
    console.error("submitPaymentRef failed", error);
    return { success: false, error: "Could not verify payment. Please try again." };
  }
}
