"use client";
import { useState } from "react";
import { moderateReview } from "@/actions/admin.actions";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "@/components/ui/Toaster";
import type { AdminReviewItem } from "@/types";

export function AdminReviewModeration({ reviews: initial }: { reviews: AdminReviewItem[] }) {
  const [items, setItems] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ reviewId: string; action: "approved" | "rejected" } | null>(null);

  const handleModerate = async (id: string, action: "approved" | "rejected") => {
    try {
      await moderateReview(id, action);
      setItems((old) => old.filter((item) => item.id !== id));
      toast({ title: `Review ${action === "approved" ? "approved" : "rejected"}`, variant: "success" });
    } catch {
      toast({ title: `Failed to ${action} review`, variant: "error" });
    }
    setConfirmAction(null);
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
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && handleModerate(confirmAction.reviewId, confirmAction.action)}
        title={confirmAction?.action === "approved" ? "Approve review" : "Reject review"}
        description={confirmAction?.action === "approved" ? "This review will be visible publicly." : "This review will be hidden from the public."}
        confirmLabel={confirmAction?.action === "approved" ? "Approve" : "Reject"}
        variant={confirmAction?.action === "rejected" ? "destructive" : "default"}
      />
    </>
  );
}
