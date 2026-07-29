import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/supabase-auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Edit3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AlumniProfileViewPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.alumniProfile.findUnique({
    where: { userId: session.user.id },
    include: { sessionTypes: true, availability: true },
  });
  if (!profile) redirect("/apply");

  const languages = (() => {
    try {
      const parsed = JSON.parse(profile.languages);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link href="/alumni/dashboard" className="inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white">
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        {/* ── Header band ── */}
        <div className="relative mt-6 overflow-hidden rounded-[18px] border border-white/8 bg-[#151517] p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(232,87,58,0.16),transparent_45%)]" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-coral">Alumni profile</p>
              <h1 className="mt-2 font-heading text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">{profile.fullName}</h1>
              <p className="mt-1.5 text-sm text-white/45">{profile.universityName} · {profile.course}</p>
            </div>
            <Link href="/alumni/profile/edit">
              <Button variant="accent">
                <Edit3 className="mr-2 h-4 w-4" />
                Edit profile
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          <div>
            <div className="alumni-card overflow-hidden rounded-[16px]">
              {profile.profilePhotoUrl ? (
                <img src={profile.profilePhotoUrl} alt="" className="aspect-square h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-[#1a1a1a] text-5xl font-bold text-white/15">
                  {profile.fullName.charAt(0)}
                </div>
              )}
            </div>
            <div className="mt-4 space-y-1.5 text-sm">
              <p className="font-semibold text-white">{profile.universityName}</p>
              <p className="text-white/40">{profile.course}</p>
              <p className="text-white/40">{profile.country}</p>
            </div>
          </div>

          <div className="space-y-5">
            <Card className="p-6">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">About</h2>
              <p className="mt-3 leading-7 text-white/80">{profile.bio ?? "No bio provided."}</p>
            </Card>

            <Card className="p-6">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Details</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-white/35">Graduation year</p>
                  <p className="mt-1 font-medium text-white">{profile.graduationYearJbcn}</p>
                </div>
                <div>
                  <p className="text-xs text-white/35">Study level</p>
                  <p className="mt-1 font-medium capitalize text-white">{profile.currentStudyLevel}</p>
                </div>
                <div>
                  <p className="text-xs text-white/35">Status</p>
                  <Badge className="mt-1 bg-coral/15 text-coral border-coral/20">{profile.verificationStatus}</Badge>
                </div>
                <div>
                  <p className="text-xs text-white/35">LinkedIn</p>
                  <p className="mt-1">
                    {profile.linkedinUrl ? (
                      <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-coral underline underline-offset-2 hover:text-coral-light">
                        View profile
                      </a>
                    ) : (
                      <span className="text-white/35">Not provided</span>
                    )}
                  </p>
                </div>
              </div>
            </Card>

            {languages.length > 0 && (
              <Card className="p-6">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Languages</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {languages.map((lang: string) => (
                    <Badge key={lang} className="bg-white/5 text-white/70 border-white/10">{lang}</Badge>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Quick links</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/alumni/profile/edit">
                  <Button variant="outline" size="sm"><Edit3 className="mr-1.5 h-3.5 w-3.5" />Edit profile</Button>
                </Link>
                <Link href="/alumni/profile/availability">
                  <Button variant="outline" size="sm">Manage availability</Button>
                </Link>
                <Link href="/alumni/profile/pricing">
                  <Button variant="outline" size="sm">Manage pricing</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
