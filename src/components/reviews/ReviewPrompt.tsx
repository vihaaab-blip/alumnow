"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Lock, CheckCircle, Clock } from "lucide-react";

type ReviewPromptProps = {
  bookingId: string;
  alumniName: string;
  sessionType: string;
  onSubmit: (bookingId: string, rating: number, comment: string) => Promise<{ success: boolean; error?: string }>;
  onDismiss: () => void;
};

/**
 * Two-sided simultaneous-reveal review prompt.
 *
 * Behaviour:
 * - Both student AND alumni see this prompt post-session.
 * - Neither party can see the other's review until BOTH have submitted
 *   OR 72 hours have elapsed — preventing retaliatory reviews (Fiverr pattern).
 * - UI communicates this clearly with the blind-until-reveal badge.
 */
export function ReviewPrompt({
  bookingId,
  alumniName,
  sessionType,
  onSubmit,
  onDismiss,
}: ReviewPromptProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [stage, setStage] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async () => {
    if (rating === 0) { setError("Please select a rating."); return; }
    setError("");
    setStage("busy");
    const result = await onSubmit(bookingId, rating, comment);
    if (!result.success) {
      setError(result.error ?? "Failed to submit review.");
      setStage("idle");
    } else {
      setStage("done");
    }
  };

  const displayStars = hovered || rating;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #1d1d1d 0%, #161616 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Blind-reveal badge */}
      <div
        className="flex items-center gap-2 px-5 py-3 text-[11px] text-white/40"
        style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Lock size={11} className="text-white/25" />
        Reviews are private until both sides submit or 72 hours pass — no retaliation possible
      </div>

      <AnimatePresence mode="wait">
        {stage === "done" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 px-5 py-10 text-center"
          >
            <CheckCircle size={36} className="text-emerald-400" />
            <p className="text-[15px] font-semibold text-white">Review submitted!</p>
            <p className="text-[13px] text-white/40 max-w-xs">
              It will become public once {alumniName.split(" ")[0]} submits their review, or after 72 hours.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-white/25 mt-1">
              <Clock size={11} />
              Blind reveal window: 72 hours
            </div>
          </motion.div>
        ) : (
          <motion.div key="form" exit={{ opacity: 0 }} className="px-5 py-5 space-y-5">
            {/* Session context */}
            <div>
              <p className="text-[13px] font-semibold text-white">
                How was your session with {alumniName}?
              </p>
              <p className="text-[12px] text-white/35 mt-0.5 capitalize">
                {sessionType.replace(/_/g, " ")}
              </p>
            </div>

            {/* Star picker */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/25">Rating</p>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const val = i + 1;
                  return (
                    <button
                      key={i}
                      onMouseEnter={() => setHovered(val)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(val)}
                      className="transition-transform hover:scale-125"
                    >
                      <Star
                        size={26}
                        className={
                          val <= displayStars
                            ? "fill-amber-400 text-amber-400"
                            : "text-white/15 fill-white/5"
                        }
                        style={{ transition: "color 120ms, fill 120ms" }}
                      />
                    </button>
                  );
                })}
                {rating > 0 && (
                  <span className="ml-2 text-[12px] text-white/40">
                    {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Written review */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/25">
                Written review <span className="text-white/20 font-normal">(optional)</span>
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`What did you find most valuable about the session with ${alumniName.split(" ")[0]}?`}
                rows={3}
                className="w-full rounded-xl px-3.5 py-3 text-[13px] text-white/80 placeholder:text-white/20 resize-none outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  transition: "border-color 200ms",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(232,87,58,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              <p className="text-[11px] text-white/20">{comment.length}/500</p>
            </div>

            {error && <p className="text-[12px] text-red-400">{error}</p>}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={onDismiss}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-white/40 hover:text-white/60 transition-colors"
              >
                Later
              </button>
              <button
                onClick={() => void submit()}
                disabled={stage === "busy" || rating === 0}
                className="btn-coral flex-[2] py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40"
              >
                {stage === "busy" ? "Submitting…" : "Submit review"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
