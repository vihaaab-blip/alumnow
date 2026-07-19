import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CountryFlag } from "./CountryFlag";
import { VerifiedBadge } from "./VerifiedBadge";
import { Badge } from "@/components/ui/Badge";

const QS_LABELS: Record<string, string> = {
  top10: "Top 10",
  top20: "Top 20",
  top50: "Top 50",
  top100: "Top 100",
  top200: "Top 200",
};

export function ProfileHeader({
  alumni,
}: {
  alumni: {
    id: string;
    fullName: string;
    profilePhotoUrl: string | null;
    universityName: string;
    course: string;
    country: string;
    graduationYearJbcn: number;
    isVerifiedJbcnAlumnus: boolean;
    qsRankingTier: string;
  };
}) {
  const qsLabel = QS_LABELS[alumni.qsRankingTier] ?? null;

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#1A1A1A] p-6 text-white md:p-8">
      <Link
        href="/browse"
        className="mb-8 inline-flex items-center gap-2 text-sm text-white/75 hover:text-white transition-colors"
        aria-label="Back to browse"
      >
        <ArrowLeft size={16} /> Back to browse
      </Link>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <img
          src={alumni.profilePhotoUrl ?? `https://picsum.photos/seed/${alumni.id}/400/400`}
          alt={alumni.fullName}
          className="h-28 w-28 rounded-xl object-cover ring-4 ring-white/20"
        />
        <div>
          <p className="text-white/75">
            <CountryFlag country={alumni.country} /> {alumni.universityName}
          </p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">{alumni.fullName}</h1>
          <p className="mt-2 text-white/80">
            {alumni.course} \u00B7 JBCN alumnus, {alumni.graduationYearJbcn}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {alumni.isVerifiedJbcnAlumnus && <VerifiedBadge />}
            {qsLabel && (
              <Badge tone="accent" className="text-xs">
                {qsLabel}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
