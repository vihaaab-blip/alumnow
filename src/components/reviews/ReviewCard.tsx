"use client";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  sessionType: string;
  reviewerName: string;
  timeAgo: string; // e.g. "2 weeks ago"
}

export function ReviewCard({ review, index = 0 }: { review: Review; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl p-4"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={11}
              className={
                i < review.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-white/10 fill-white/10"
              }
            />
          ))}
        </div>
        <span className="text-[11px] text-white/20 shrink-0 ml-2">
          {review.sessionType.replace(/_/g, " ")} · {review.timeAgo}
        </span>
      </div>

      {/* Comment */}
      {review.comment ? (
        <p className="text-[13px] text-white/55 leading-relaxed">
          &ldquo;{review.comment}&rdquo;
        </p>
      ) : (
        <p className="text-[13px] text-white/25 italic">No written review.</p>
      )}

      {/* Reviewer */}
      <p className="text-[11px] text-white/25 mt-2.5">— {review.reviewerName}</p>
    </motion.div>
  );
}
