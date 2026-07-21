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
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/alumni/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft size={16} />
        Back to profile
      </Link>
      <h1 className="mt-6 text-3xl font-semibold text-primary">Manage availability</h1>
      <p className="mt-2 text-muted-foreground">Set when you&apos;re available for student sessions.</p>
      <div className="mt-8">
        <AvailabilityEditor recurringSlots={recurringSlots} oneOffSlots={oneOffSlots} />
      </div>
    </div>
  );
}
