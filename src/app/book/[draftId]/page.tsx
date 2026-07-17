"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { getBookingById } from "@/actions/booking.actions";
import { BookingSummaryCard } from "@/components/BookingSummaryCard";
import { PaymentModal } from "@/components/PaymentModal";
import { ConfirmationScreen } from "@/components/ConfirmationScreen";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

type Step = 1 | 2 | 3;

const STEPS = [
  { num: 1, label: "Review" },
  { num: 2, label: "Payment" },
  { num: 3, label: "Confirmed" },
];

export default function BookingPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>(1);

  useEffect(() => {
    getBookingById(draftId)
      .then((data) => {
        if (!data) {
          setError("Booking not found.");
        } else {
          setBooking(data);
        }
      })
      .catch(() => setError("Failed to load booking."))
      .finally(() => setLoading(false));
  }, [draftId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-8 w-56" />
        <div className="mt-8 space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="text-lg font-semibold text-red-600">
          {error || "Booking not found."}
        </p>
        <Button
          className="mt-4"
          variant="accent"
          onClick={() => router.push("/browse")}
        >
          Browse alumni
        </Button>
      </main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-2xl px-6 py-12"
    >
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#E8573A" }}>
          Secure your session
        </p>
        <h1 className="mt-2 text-3xl font-bold text-primary">
          {step === 1 && "Review your session"}
          {step === 2 && "Complete payment"}
          {step === 3 && "All set!"}
        </h1>

        <div className="mt-8 flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center">
              {i > 0 && (
                <div
                  className={`mx-2 h-px w-10 transition-colors duration-300 ${
                    step > i ? "" : "bg-border"
                  }`}
                  style={step > i ? { backgroundColor: "#E8573A" } : {}}
                />
              )}
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    step > s.num
                      ? "text-white"
                      : step === s.num
                      ? "text-white"
                      : "text-muted-foreground border border-white/10"
                  }`}
                  style={
                    step >= s.num
                      ? { backgroundColor: "#E8573A" }
                      : {}
                  }
                >
                  {step > s.num ? <CheckCircle size={14} /> : s.num}
                </span>
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    step === s.num ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <BookingSummaryCard booking={booking} />
                <div className="rounded-xl bg-[#E8573A]/5 px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    By confirming, you agree to attend the session at the scheduled time. Late cancellations may affect your account.
                  </p>
                </div>
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={() => setStep(2)}
                >
                  Confirm & Continue to Payment
                </Button>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <PaymentModal
                  bookingId={draftId}
                  bookingAmount={booking.payment?.amountPaise}
                  alumniName={booking.alumni?.fullName}
                  onComplete={() => setStep(3)}
                />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ConfirmationScreen booking={booking} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.main>
  );
}
