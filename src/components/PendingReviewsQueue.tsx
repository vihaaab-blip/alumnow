export function PendingReviewsQueue({ reviews }: { reviews: any[] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-[16px] bg-white border border-[var(--border-subtle)] p-5 shadow-[var(--shadow-xs)] text-center py-8">
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Queue is clear</p>
        <p className="text-[12px] text-[var(--text-secondary)] mt-1">No reviews awaiting moderation.</p>
      </div>
    );
  }
  return (
    <div className="rounded-[16px] bg-white border border-[var(--border-subtle)] p-5 shadow-[var(--shadow-xs)]">
      <h3 className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.06em] mb-3">Pending reviews</h3>
      <div className="space-y-2">
        {reviews.map((r: any) => (
          <div key={r.id} className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--bg-card-sunken)]">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{r.text || "No comment"}</p>
              <p className="text-[11px] text-[var(--text-secondary)]">{r.rating}\u2605 · {r.booking?.student?.name}</p>
            </div>
            <div className="flex gap-1.5 shrink-0 ml-3">
              <form action={`/api/admin/reviews/${r.id}/approve`} method="POST">
                <button className="text-[11px] font-semibold px-2.5 py-1 rounded-[8px] bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20">Approve</button>
              </form>
              <form action={`/api/admin/reviews/${r.id}/reject`} method="POST">
                <button className="text-[11px] font-semibold px-2.5 py-1 rounded-[8px] bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20">Reject</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
