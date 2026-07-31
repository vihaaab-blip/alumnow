import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/supabase-auth";
import { AvailabilityEditor } from "@/components/AvailabilityEditor";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function restHeaders(extra?: HeadersInit): HeadersInit {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export default async function AlumniProfileAvailabilityPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");

  // REST, not Prisma - see alumni/profile/page.tsx for why: the pooled
  // Prisma connection has been the recurring cause of "page not loaded"
  // failures on these self-service pages.
  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/AlumniProfile?select=id&userId=eq.${encodeURIComponent(session.user.id)}&limit=1`,
    { headers: restHeaders(), cache: "no-store" }
  );
  if (!profileRes.ok) throw new Error(`Failed to load profile: ${profileRes.status} ${await profileRes.text()}`);
  const profile = ((await profileRes.json()) as { id: string }[])[0];
  if (!profile) redirect("/apply");

  const slotsRes = await fetch(
    `${supabaseUrl}/rest/v1/AlumniAvailability?select=*&alumniId=eq.${encodeURIComponent(profile.id)}&order=dayOfWeek.asc,specificDate.asc`,
    { headers: restHeaders(), cache: "no-store" }
  );
  if (!slotsRes.ok) throw new Error(`Failed to load availability: ${slotsRes.status} ${await slotsRes.text()}`);
  const allSlots = (await slotsRes.json()) as any[];

  const recurringSlots = allSlots
    .filter((s) => s.isRecurring)
    .map((s) => ({ id: s.id, dayOfWeek: s.dayOfWeek!, startTime: s.startTime, endTime: s.endTime }));

  const oneOffSlots = allSlots
    .filter((s) => !s.isRecurring)
    .map((s) => ({ id: s.id, specificDate: s.specificDate ?? "", startTime: s.startTime, endTime: s.endTime }));

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="mx-auto max-w-4xl px-6 pt-28 pb-12">
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
