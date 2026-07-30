"use client";
import { useState } from "react";
import { moderateReview } from "@/actions/admin.actions";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toaster";
import type { AdminReviewItem } from "@/types";

export function AdminReviewModeration({ reviews: initial }: { reviews: AdminReviewItem[] }) {
  const [items, setItems] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ reviewId: string; action: "approved" | "rejected" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const getFlags = (text: string | null): string[] => {
    if (!text) return [];
    const flags: string[] = [];
    if (/http[s]?:\/\//i.test(text)) flags.push("Contains link");
    if (/\b(scam|fraud|fake)\b/i.test(text)) flags.push("Sensitive keyword");
    if (/(.)\1{5,}/.test(text)) flags.push("Repeated characters");
    return flags;
  };

  const handleModerate = async (id: string, action: "approved" | "rejected", _reason?: string) => {
    try {
      await moderateReview(id, action);
      setItems((old) => old.filter((item) => item.id !== id));
      toast({ title: `Review ${action === "approved" ? "approved" : "rejected"}`, variant: "success" });
    } catch {
      toast({ title: `Failed to ${action} review`, variant: "error" });
    }
    setConfirmAction(null);
    setRejectReason("");
  };

  return (
    <>
      <div className="space-y-3">
        {!items.length && (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No pending reviews.
          </p>
        )}
        {items.map((review) => (
          <div key={review.id} className="rounded-xl border border-border bg-[#1A1A1A] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary">{review.rating}/5 · {review.alumnus?.fullName ?? "Unknown"}</p>
                <p className="mt-2 text-sm text-foreground">
                  {expanded === review.id ? review.text : (review.text ?? "No written note")}
                </p>
                {review.text && review.text.length > 80 && (
                  <button
                    onClick={() => setExpanded(expanded === review.id ? null : review.id)}
                    className="mt-1 text-xs font-semibold text-accent hover:text-accent-light transition-colors"
                  >
                    {expanded === review.id ? "Show less" : "Read more"}
                  </button>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  From {review.booking.student.studentProfile?.fullName ?? review.booking.student.email}
                </p>
                {getFlags(review.text).length > 0 && (
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {getFlags(review.text).map((f) => (
                      <span key={f} className="rounded-md bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-[10px] font-semibold text-amber-300">{f}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <Button variant="accent" onClick={() => setConfirmAction({ reviewId: review.id, action: "approved" })}>
                  Approve
                </Button>
                <Button variant="outline" onClick={() => setConfirmAction({ reviewId: review.id, action: "rejected" })}>
                  Reject
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={confirmAction?.action === "approved"}
        onOpenChange={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && handleModerate(confirmAction.reviewId, confirmAction.action)}
        title="Approve review"
        description="This review will be visible publicly."
        confirmLabel="Approve"
      />
      <DialogRoot open={confirmAction?.action === "rejected"} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject review</DialogTitle>
            <DialogDescription>Optionally note why, for internal record.</DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Contains unverifiable claims"
            rows={3}
            className="mt-2 w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm"
          />
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => confirmAction && handleModerate(confirmAction.reviewId, "rejected", rejectReason)}>Reject</Button>
          </div>
        </DialogContent>
      </DialogRoot>
    </>
  );
}
