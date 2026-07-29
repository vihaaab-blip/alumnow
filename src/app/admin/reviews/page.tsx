import { getPendingReviews } from "@/actions/admin.actions";
import { AdminReviewModeration } from "@/components/AdminReviewModeration";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await getPendingReviews();
  return (
    <div>
      <Breadcrumbs items={[{ label: "Reviews" }]} />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Moderation</p>
      <h1 className="mt-2 text-[32px] font-bold tracking-tight text-white">Review moderation</h1>
      <p className="mt-2 text-sm text-white/40">Approve useful, safe feedback before it appears publicly.</p>
      <div className="mt-8">
        <AdminReviewModeration reviews={reviews as any} />
      </div>
    </div>
  );
}
