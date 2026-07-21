import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/supabase-auth";
import { prisma } from "@/lib/prisma";
import { PricingEditor } from "@/components/PricingEditor";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AlumniProfilePricingPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.alumniProfile.findUnique({
    where: { userId: session.user.id },
    include: { sessionTypes: true },
  });
  if (!profile) redirect("/apply");

  const offerings = profile.sessionTypes.map((st) => ({
    id: st.id,
    type: st.type,
    pricePaise: st.pricePaise,
    maxParticipants: st.maxParticipants,
  }));

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/alumni/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft size={16} />
        Back to profile
      </Link>
      <h1 className="mt-6 text-3xl font-semibold text-primary">Manage pricing</h1>
      <p className="mt-2 text-muted-foreground">Set your session prices. All prices are displayed in INR.</p>
      <div className="mt-8">
        <PricingEditor offerings={offerings} />
      </div>
    </div>
  );
}
