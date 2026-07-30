"use server";
import { getServerSession } from "@/lib/supabase-auth";

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

function parseLanguages(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Ported off the pooled Prisma connection (see alumni.actions.ts listAlumni
// for the same history) to the direct Supabase REST pattern - Prisma reads
// were failing silently here, which is why the Saved tab never reflected
// what a student had actually saved.
export async function getSavedAlumni() {
  const session = await getServerSession();
  if (!session?.user?.id) return [];

  const savedRes = await fetch(
    `${supabaseUrl}/rest/v1/SavedAlumni?select=alumniId,createdAt&studentId=eq.${encodeURIComponent(session.user.id)}&order=createdAt.desc`,
    { headers: restHeaders(), cache: "no-store" }
  );
  if (!savedRes.ok) {
    console.error("getSavedAlumni: SavedAlumni fetch failed", savedRes.status, await savedRes.text());
    return [];
  }
  const saved = (await savedRes.json()) as { alumniId: string; createdAt: string }[];
  if (saved.length === 0) return [];

  const ids = saved.map((s) => `"${s.alumniId}"`).join(",");
  const alumniRes = await fetch(
    `${supabaseUrl}/rest/v1/AlumniProfile?select=*,sessionTypes:SessionTypeOffering(*),availability:AlumniAvailability(*)&id=in.(${ids})`,
    { headers: restHeaders(), cache: "no-store" }
  );
  if (!alumniRes.ok) {
    console.error("getSavedAlumni: AlumniProfile fetch failed", alumniRes.status, await alumniRes.text());
    return [];
  }
  const alumniById = new Map(((await alumniRes.json()) as any[]).map((a) => [a.id, a]));

  return saved
    .filter((s) => alumniById.has(s.alumniId))
    .map((s) => {
      const alumni = alumniById.get(s.alumniId);
      return {
        studentId: session.user.id,
        alumniId: s.alumniId,
        createdAt: s.createdAt,
        alumni: {
          ...alumni,
          isSaved: true,
          languages: parseLanguages(alumni.languages),
        },
      };
    });
}
