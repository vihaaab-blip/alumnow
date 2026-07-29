import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/supabase-auth";
import { prisma } from "@/lib/prisma";
import { AvailabilityEditor } from "@/components/AvailabilityEditor";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AlumniProfileAvailabilityPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.alumniProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/apply");

  const allSlots = await prisma.alumniAvailability.findMany({
    where: { alumniId: profile.id },
    orderBy: [{ dayOfWeek: "asc" }, { specificDate: "asc" }],
  });

  const recurringSlots = allSlots
    .filter((s) => s.isRecurring)
    .map((s) => ({ id: s.id, dayOfWeek: s.dayOfWeek!, startTime: s.startTime, endTime: s.endTime }));

  const oneOffSlots = allSlots
    .filter((s) => !s.isRecurring)
    .map((s) => ({ id: s.id, specificDate: s.specificDate?.toISOString() ?? "", startTime: s.startTime, endTime: s.endTime }));

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/alumni/profile" className="inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white">
          <ArrowLeft size={16} />
          Back to profile
        </Link>

        <div className="relative mt-6 overflow-hidden rounded-[18px] border border-white/8 bg-[#151517] p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(232,87,58,0.16),transparent_45%)]" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-coral">Alumni profile</p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">Manage availability</h1>
            <p className="mt-1.5 text-sm text-white/45">Set when you&apos;re available for student sessions.</p>
          </div>
        </div>

        <div className="mt-8">
          <AvailabilityEditor recurringSlots={recurringSlots} oneOffSlots={oneOffSlots} />
        </div>
      </div>
    </div>
  );
}
