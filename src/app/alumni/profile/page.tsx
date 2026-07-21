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
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/alumni/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      <div className="mt-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Profile</p>
          <h1 className="mt-2 text-3xl font-semibold text-primary">{profile.fullName}</h1>
        </div>
        <Link href="/alumni/profile/edit">
          <Button variant="primary">
            <Edit3 className="mr-2 h-4 w-4" />
            Edit profile
          </Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <div>
          <div className="overflow-hidden rounded-xl bg-muted">
            {profile.profilePhotoUrl ? (
              <img src={profile.profilePhotoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-muted text-5xl font-semibold text-muted-foreground">
                {profile.fullName.charAt(0)}
              </div>
            )}
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <p className="font-medium text-primary">{profile.universityName}</p>
            <p className="text-muted-foreground">{profile.course}</p>
            <p className="text-muted-foreground">{profile.country}</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">About</h2>
            <p className="mt-3 leading-7 text-primary">{profile.bio ?? "No bio provided."}</p>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Graduation year</p>
                <p className="mt-1 font-medium">{profile.graduationYearJbcn}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Study level</p>
                <p className="mt-1 font-medium capitalize">{profile.currentStudyLevel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
                <Badge className="mt-1 bg-accent/20">{profile.verificationStatus}</Badge>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">LinkedIn</p>
                <p className="mt-1">
                  {profile.linkedinUrl ? (
                    <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
                      View profile
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </p>
              </div>
            </div>
          </Card>

          {languages.length > 0 && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Languages</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {languages.map((lang: string) => (
                  <Badge key={lang} className="bg-muted">{lang}</Badge>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick links</h2>
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
  );
}
