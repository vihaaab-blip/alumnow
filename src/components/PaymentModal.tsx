"use client";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCircle, Copy, Loader2, Shield, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { submitPaymentRef } from "@/actions/payment.actions";
import { getUpiId } from "@/actions/admin.actions";
import { toast } from "@/components/ui/Toaster";

const UPI_REF_REGEX = /^[A-Za-z0-9.-]{8,}$/;

export function PaymentModal({
  bookingId,
  onComplete,
  bookingAmount,
  alumniName,
}: {
  bookingId: string;
  onComplete: () => void;
  bookingAmount?: number;
  alumniName?: string;
}) {
  const [ref, setRef] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<
    "idle" | "busy" | "verifying" | "confirming" | "verified"
  >("idle");
  const [upiId, setUpiId] = useState("alumnow@upi");
  const [qrLoading, setQrLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    getUpiId().then(setUpiId).catch(() => {});
  }, []);

  useEffect(() => {
    if (!upiId) return;
    setQrLoading(true);
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(alumniName ?? "AlumNow")}${bookingAmount ? `&am=${(bookingAmount / 100).toFixed(2)}` : ""}&cu=INR`;
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, upiUrl, {
        width: 192,
        margin: 2,
        color: { dark: "#1a1a2e", light: "#ffffff" },
      })
        .then(() => setQrLoading(false))
        .catch(() => setQrLoading(false));
    }
  }, [upiId, bookingAmount, alumniName]);

  const submit = async () => {
    setError("");
    setStage("busy");
    const result = await submitPaymentRef(bookingId, {
      upiTransactionRef: ref,
    });
    if (!result.success) {
      setError(result.error ?? "Payment failed.");
      setStage("idle");
      return;
    }
    setStage("verifying");
    setTimeout(() => setStage("confirming"), 800);
    setTimeout(() => {
      setStage("verified");
      toast({ title: "Payment verified!", variant: "success" });
    }, 1500);
    setTimeout(onComplete, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-background to-white p-6 text-center to-[#131316]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8573A]/10">
          <Smartphone size={28} style={{ color: "#E8573A" }} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-primary">Pay with UPI</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan the QR code or pay to the UPI ID below
        </p>

        <div className="mt-5 flex justify-center">
          {qrLoading && (
            <Skeleton className="h-48 w-48 rounded-xl" />
          )}
          <canvas
            ref={canvasRef}
            className={`rounded-xl border border-border/60 ${qrLoading ? "hidden" : ""}`}
          />
        </div>

        {!qrLoading && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-[#131316] px-4 py-2.5">
            <code className="font-mono text-sm font-semibold text-primary">
              {upiId}
            </code>
            <button
              aria-label="Copy UPI ID"
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(upiId).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            </button>
          </div>
        )}

        {bookingAmount != null && (
          <p className="mt-3 text-sm text-muted-foreground">
            Amount: <span className="font-mono font-semibold text-primary">₹{(bookingAmount / 100).toLocaleString("en-IN")}</span>
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {stage === "verified" ? (
          <motion.div
            key="verified"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-3 rounded-2xl bg-green-950/30 py-10"
          >
            <CheckCircle size={48} className="text-green-600" />
            <p className="text-lg font-semibold text-primary">Payment verified!</p>
            <p className="text-sm text-muted-foreground">Redirecting to confirmation...</p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-border/80 bg-[#131316] p-5">
              <label className="block text-sm font-semibold text-primary">
                Enter UPI transaction reference
                <Input
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  placeholder="e.g. UPI-XXXXXXXX"
                  className="mt-2"
                  disabled={stage !== "idle"}
                />
              </label>
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <Shield size={12} />
                Your payment is processed securely via UPI
              </p>
            </div>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            {stage === "idle" || stage === "busy" ? (
              <Button
                variant="accent"
                className="w-full"
                disabled={
                  stage === "busy" || !UPI_REF_REGEX.test(ref)
                }
                onClick={() => void submit()}
              >
                {stage === "busy" ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={17} />
                    Verifying payment...
                  </>
                ) : (
                  "Verify payment"
                )}
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#E8573A]/20 bg-[#E8573A]/5 py-6">
                <Loader2 className="animate-spin" style={{ color: "#E8573A" }} size={22} />
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {stage === "verifying"
                      ? "Verifying payment..."
                      : "Confirming with UPI network..."}
                  </p>
                  <p className="text-xs text-muted-foreground">This should only take a moment</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
