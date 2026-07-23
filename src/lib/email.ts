import { prisma } from "./prisma";

interface EmailParams {
  to: string;
  subject: string;
  body: string;
  eventType: string;
}

export async function sendEmail(params: EmailParams, userId?: string): Promise<void> {
  const timestamp = new Date().toISOString();

  const line = "\u2500".repeat(Math.max(params.subject.length + 4, 50));
  console.log(`
\u250c${line}\u2510
\u2502  [EMAIL]
\u2502  To:       ${params.to}
\u2502  Subject:  ${params.subject}
\u2502  Body:     ${params.body.replace(/\n/g, "\n\u2502           ")}
\u2502  Timestamp: ${timestamp}
\u2514${line}\u2518`);

  await prisma.notificationLog.create({
    data: {
      userId: userId ?? "",
      eventType: params.eventType,
      status: "logged",
    },
  });
}

export const emailTemplates = {
  signupVerification: (email: string, name: string) => ({
    to: email,
    subject: "Welcome to AlumNow! Verify your email",
    body: `Hi ${name},\n\nWelcome to AlumNow! Your account has been created successfully.\n\nIn production, you'd receive a verification link here. For this demo, you're auto-verified.\n\nStart browsing alumni at /browse`,
    eventType: "signup_verification" as const,
  }),

  sendPasswordResetEmail: (email: string, token: string) => ({
    to: email,
    subject: "Reset your AlumNow password",
    body: `Reset link: ${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/reset-password?token=${token}\n\nThis link expires in 15 minutes.`,
    eventType: "password_reset_requested" as const,
  }),

  sendAlumniWelcome: (email: string, name: string) => ({
    to: email,
    subject: "Your AlumNow mentor profile is approved",
    body: `Welcome ${name}. Your profile is live and ready for students to discover.`,
    eventType: "alumni_application_approved" as const,
  }),

  bookingConfirmed: (email: string, alumnusName: string, date: string, time: string) => ({
    to: email,
    subject: `Session Confirmed — ${alumnusName}`,
    body: `Your session with ${alumnusName} on ${date} at ${time} IST is confirmed.\n\nJoin link will appear 10 minutes before the session.\n\nView your bookings at /bookings`,
    eventType: "booking_confirmed" as const,
  }),

  bookingCancelled: (email: string, alumnusName: string, date: string) => ({
    to: email,
    subject: `Session Cancelled — ${alumnusName}`,
    body: `Your session with ${alumnusName} on ${date} has been cancelled.\n\nIf this was a mistake, please book again at /browse`,
    eventType: "booking_cancelled" as const,
  }),

  paymentVerified: (email: string, amount: string) => ({
    to: email,
    subject: "Payment Verified — AlumNow",
    body: `Your payment of ${amount} has been verified.\n\nYour session is confirmed. You can access it from your dashboard.\n\nThank you for using AlumNow!`,
    eventType: "payment_verified" as const,
  }),
};