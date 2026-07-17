"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { submitReview } from "@/actions/review-submit.actions";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

export function ReviewForm({ bookingId, onSubmitted }: { bookingId: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const reduced = useReducedMotion();

  return (
    <div className="rounded-xl border border-border bg-[#1A1A1A] p-5" aria-label="Review form">
      <h3 className="font-semibold text-primary">How was your session?</h3>
      <div className="mt-4 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} star${value === 1 ? "" : "s"}`}
            onClick={() => setRating(value)}
            className={reduced ? "" : "transition-transform duration-150 hover:scale-110"}
          >
            <Star
              size={23}
              className={value <= rating ? "fill-accent text-accent" : "text-muted-foreground"}
            />
          </button>
        ))}
      </div>
      <div className="mt-4 relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 200))}
          placeholder="Share a helpful note (optional)"
          rows={4}
          maxLength={200}
          className="w-full rounded-[10px] border border-border bg-[#1A1A1A] px-4 py-2.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30"
          aria-label="Review text"
        />
        <span className="absolute bottom-3 right-3 text-xs text-muted-foreground" aria-live="polite">
          {text.length}/200
        </span>
      </div>
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Rating required</span>
        <Button
          disabled={!rating || busy}
          onClick={async () => {
            if (busy) return;
            setBusy(true);
            setError("");
            const result = await submitReview(bookingId, { rating, text });
            if (!result.success) setError(result.error ?? "Could not submit review.");
            else onSubmitted();
            setBusy(false);
          }}
        >
          {busy ? "Submitting\u2026" : "Submit review"}
        </Button>
      </div>
    </div>
  );
}
