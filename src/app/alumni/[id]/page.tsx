import { notFound } from "next/navigation";
import Link from "next/link";
import { getAlumniById } from "@/actions/alumni.actions";
import { getAvailability, getBookedSlots, getGroupBookingCounts } from "@/actions/availability.actions";
import { getReviews } from "@/actions/review.actions";
import { ProfileHeader } from "@/components/ProfileHeader";
import { BioSection } from "@/components/BioSection";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { SessionPricingCard } from "@/components/SessionPricingCard";
import { ReviewList } from "@/components/ReviewList";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default async function AlumniProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let alumni;
  let availability;
  let booked;
  let reviews;
  let groupBookedCounts: Record<string, number> = {};

  try {
    alumni = await getAlumniById(id);
    if (!alumni) notFound();
    const results = await Promise.all([
      getAvailability(id),
      getBookedSlots(id),
      getReviews(id),
    ]);
    availability = results[0];
    booked = results[1];
    reviews = results[2];

    const groupOfferings = alumni.sessionTypes?.filter((st) => st.type === "group_40") ?? [];
    if (groupOfferings.length > 0) {
      groupBookedCounts = await getGroupBookingCounts(
        id,
        groupOfferings.map((o) => o.id),
      );
    }
  } catch {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#1A1A1A] p-12 text-center">
          <h2 className="text-xl font-bold text-primary">Something went wrong</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&apos;t load this alumni profile. It may have been removed or is temporarily unavailable.
          </p>
          <Link href="/browse">
            <Button className="mt-6" variant="primary">
              <ArrowLeft size={16} /> Go back to browse
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const languages = (() => {
    try {
      const parsed = typeof alumni.languages === "string" ? JSON.parse(alumni.languages) : alumni.languages;
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  })();

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <ProfileHeader
        alumni={{
          id: alumni.id,
          fullName: alumni.fullName,
          profilePhotoUrl: alumni.profilePhotoUrl,
          universityName: alumni.universityName,
          course: alumni.course,
          country: alumni.country,
          graduationYearJbcn: alumni.graduationYearJbcn,
          isVerifiedJbcnAlumnus: alumni.isVerifiedJbcnAlumnus,
          qsRankingTier: alumni.qsRankingTier ?? "unranked",
        }}
      />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          <BioSection
            bio={alumni.bio}
            languages={languages}
            responseHours={alumni.avgResponseTimeHours}
          />
          <AvailabilityCalendar
            availability={availability}
            booked={booked}
            alumniId={alumni.id}
          />
          <ReviewList
            reviews={reviews.items}
            totalPages={reviews.totalPages}
            alumniId={alumni.id}
          />
        </div>
        <aside>
          <div className="sticky top-6 space-y-4">
            <SessionPricingCard
              alumniId={alumni.id}
              offerings={alumni.sessionTypes}
              bookedCounts={groupBookedCounts}
            />
          </div>
        </aside>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0D0D0D]/95 backdrop-blur-sm p-4 shadow-lg lg:static lg:mt-8 lg:border-t-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="text-sm font-semibold text-primary max-lg:hidden">
            Book a session with {alumni.fullName}
          </p>
          <div className="flex w-full gap-3 lg:w-auto">
            <Link href={{ pathname: "/book/new", query: { alumniId: alumni.id } }} className="flex-1 lg:flex-initial">
              <Button variant="primary" className="w-full">
                Book a session with {alumni.fullName}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
