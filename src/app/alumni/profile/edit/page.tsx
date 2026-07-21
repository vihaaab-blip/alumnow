import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/supabase-auth";
import { prisma } from "@/lib/prisma";
import { ProfileEditor } from "@/components/ProfileEditor";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AlumniProfileEditPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.alumniProfile.findUnique({ where: { userId: session.user.id } });
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
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/alumni/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft size={16} />
        Back to profile
      </Link>
      <h1 className="mt-6 text-3xl font-semibold text-primary">Edit profile</h1>
      <p className="mt-2 text-muted-foreground">Update your personal information, bio, and links.</p>
      <div className="mt-8">
        <ProfileEditor
          initial={{
            fullName: profile.fullName,
            universityName: profile.universityName,
            course: profile.course,
            country: profile.country,
            graduationYearJbcn: profile.graduationYearJbcn,
            currentStudyLevel: profile.currentStudyLevel,
            bio: profile.bio,
            languages,
            linkedinUrl: profile.linkedinUrl,
            profilePhotoUrl: profile.profilePhotoUrl,
          }}
        />
      </div>
    </div>
  );
}
