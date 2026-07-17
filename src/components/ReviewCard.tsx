"use client";
import { useState } from "react";
import { Star } from "lucide-react";

export function ReviewCard({ review }: { review: { rating: number; text: string | null; reviewerName: string; createdAt: string } }) {
  const [expanded, setExpanded] = useState(false);
  const text = review.text ?? "Great session \u2014 practical and thoughtful guidance.";
  const shouldTruncate = text.length > 200;
  const displayText = shouldTruncate && !expanded ? text.slice(0, 200) + "\u2026" : text;

  return (
    <article className="rounded-xl border border-border bg-[#1A1A1A] p-5">
      <div className="flex items-center justify-between">
        <div className="flex text-accent" aria-label={`Rating: ${review.rating} out of 5`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={15} className={star <= review.rating ? "fill-accent text-accent" : "text-muted-foreground"} />
          ))}
        </div>
        <time className="text-xs text-muted-foreground" dateTime={review.createdAt}>
          {new Date(review.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
        </time>
      </div>
      <p className="mt-3 text-sm leading-6 text-foreground">
        <span>{displayText}</span>
        {shouldTruncate && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="ml-1 text-accent hover:text-accent-light text-xs font-semibold transition-colors"
            aria-label={expanded ? "Show less" : "Read more"}
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </p>
      <p className="mt-4 text-xs font-semibold text-primary">{review.reviewerName}</p>
    </article>
  );
}
