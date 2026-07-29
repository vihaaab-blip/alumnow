"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { alumniApplicationSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types";
import { getServerSession } from "@/lib/supabase-auth";
import { createAlumniUserRecord, findUserByEmail } from "@/actions/auth.actions";

const DEFAULT_SESSION_TYPES = [
  { type: "call_30", pricePaise: 29900, descriptionOneLiner: "A focused 30-minute conversation" },
  { type: "call_45", pricePaise: 39900, descriptionOneLiner: "A balanced 45-minute conversation" },
  { type: "call_60", pricePaise: 49900, descriptionOneLiner: "A deeper one-hour conversation" },
  { type: "group_40", pricePaise: 99900, maxParticipants: 6, descriptionOneLiner: "Learn together in a small group" },
];

// Writes go through the same Supabase REST path as signupAlumni/student
// signup rather than a raw Prisma transaction - that pooled connection has
// repeatedly proven unreliable in production, and unlike every other action
// in this codebase this one had no try/catch at all, so a failed Prisma call
// surfaced to the user as a bare "Something went wrong" with nothing logged
// server-side to diagnose. Alumni signup was the last place still on the old
// path (student signup was migrated earlier), which is exactly why it kept
// failing while student signup worked fine.
export async function applyAsAlumni(input: unknown): Promise<ApiResponse<{ redirectTo: string }>> {
  try {
    const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
    if (!rateLimit(`apply:${ip}`, { max: 3, windowMs: 900000 })) return { success: false, error: "Too many applications. Try again in 15 minutes." };
    const parsed = alumniApplicationSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Check your application details." };

    const email = parsed.data.email.trim().toLowerCase();
    const exists = await findUserByEmail(email);
    if (exists) return { success: false, error: "An account with this email already exists. Try logging in." };

    const authUserId = (input as any).authUserId as string | undefined;
    if (!authUserId) return { success: false, error: "Authentication failed. Please try again." };

    const photoUrl = parsed.data.profilePhotoUrl || `https://picsum.photos/seed/${encodeURIComponent(parsed.data.fullName)}/400/400`;

    await createAlumniUserRecord({
      id: authUserId,
      email,
      phone: parsed.data.phone,
      fullName: parsed.data.fullName,
      profilePhotoUrl: photoUrl,
      universityName: parsed.data.universityName,
      course: parsed.data.course,
      country: parsed.data.country,
      graduationYearJbcn: parsed.data.graduationYearJbcn,
      bio: parsed.data.bio,
      languages: parsed.data.languages,
      sessionTypes: DEFAULT_SESSION_TYPES,
    });

    try {
      await sendEmail({ to: email, subject: "Your alumnow mentor application has been submitted", body: `Welcome ${parsed.data.fullName}. Your mentor application has been submitted and is pending review by our team. You will be notified once your profile is approved.`, eventType: "alumni_application_submitted" }, authUserId);
    } catch (error) {
      console.warn("applyAsAlumni notification failed", error);
    }
    return { success: true, data: { redirectTo: "/alumni/application-under-review" } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("applyAsAlumni failed:", msg, error);
    return { success: false, error: `Could not submit application: ${msg}` };
  }
}

export type AlumniListFilters = { search?: string; universities?: string[]; countries?: string[]; courses?: string[]; studyLevel?: string; gradYearMin?: number; gradYearMax?: number; qsTiers?: string[]; priceMin?: number; priceMax?: number; languages?: string[]; minRating?: string; availability?: string; sortBy?: string; page?: number; pageSize?: number };

function parseLanguages(languages: unknown): string[] {
  if (Array.isArray(languages)) return languages;
  if (typeof languages === "string") {
    try { return JSON.parse(languages) as string[]; } catch { return []; }
  }
  return [];
}

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

const ilikeEscape = (value: string) => value.replaceAll("%", "\\%").replaceAll(",", "\\,");

// PostgREST `in.()` list syntax: each value must be double-quoted (with internal
// quotes/backslashes escaped) so values containing commas, parens, or spaces
// (e.g. "University College London") are parsed as a single list item.
const pgInList = (values: string[]) =>
  `in.(${values.map((v) => `"${v.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`).join(",")})`;

// Reads go straight against the Supabase REST API rather than through the pooled
// Prisma connection: that pool has proven unreliable in production (see prisma.ts
// history), and listAlumni previously swallowed those failures into an empty list,
// which is why approved alumni silently failed to show up on the marketplace.
export async function listAlumni(filters: AlumniListFilters = {}) {
  try {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(24, Math.max(1, filters.pageSize ?? 20));
    const search = filters.search?.trim();

    const params = new URLSearchParams({
      select: "*,sessionTypes:SessionTypeOffering(*),availability:AlumniAvailability(*)",
      verificationStatus: "eq.approved",
      isActive: "eq.true",
      offset: String((page - 1) * pageSize),
      limit: String(pageSize),
    });

    if (search) {
      const term = ilikeEscape(search);
      params.set("or", `(fullName.ilike.*${term}*,universityName.ilike.*${term}*,course.ilike.*${term}*,bio.ilike.*${term}*)`);
    }
    if (filters.universities?.length) params.set("universityName", pgInList(filters.universities));
    if (filters.countries?.length) params.set("country", pgInList(filters.countries));
    if (filters.courses?.length) params.set("course", pgInList(filters.courses));
    if (filters.studyLevel && filters.studyLevel !== "both") params.set("currentStudyLevel", `eq.${filters.studyLevel}`);
    if (filters.gradYearMin) params.append("graduationYearJbcn", `gte.${filters.gradYearMin}`);
    if (filters.gradYearMax) params.append("graduationYearJbcn", `lte.${filters.gradYearMax}`);
    if (filters.qsTiers?.length) params.set("qsRankingTier", `in.(${filters.qsTiers.join(",")})`);
    if (filters.minRating) params.set("ratingAvg", `gte.${Number(filters.minRating)}`);

    if (filters.sortBy === "rating") params.set("order", "ratingAvg.desc.nullslast");
    else if (filters.sortBy === "newest") params.set("order", "id.desc");
    else params.set("order", "fullName.asc");

    const res = await fetch(`${supabaseUrl}/rest/v1/AlumniProfile?${params.toString()}`, {
      headers: restHeaders({ Prefer: "count=exact" }),
      next: { revalidate: 15 },
    });
    if (!res.ok) throw new Error(`Failed to load alumni: ${res.status} ${await res.text()}`);

    let items = (await res.json()) as any[];
    const range = res.headers.get("content-range") ?? "";
    const total = Number(range.split("/")[1] ?? items.length);

    if (filters.languages?.length) {
      items = items.filter((item) => filters.languages!.some((lang) => String(item.languages ?? "").includes(lang)));
    }
    if (filters.priceMin != null || filters.priceMax != null) {
      const min = filters.priceMin != null ? Math.round(filters.priceMin * 100) : -Infinity;
      const max = filters.priceMax != null ? Math.round(filters.priceMax * 100) : Infinity;
      items = items.filter((item) => (item.sessionTypes ?? []).some((s: any) => s.pricePaise >= min && s.pricePaise <= max));
    }
    if (filters.availability === "this_week") {
      const dow = new Date().getDay();
      items = items.filter((item) => (item.availability ?? []).some((a: any) => a.dayOfWeek === dow));
    } else if (filters.availability === "this_month") {
      items = items.filter((item) => (item.availability ?? []).length > 0);
    }

    const session = await getServerSession();
    const savedIds = new Set<string>();
    if (session?.user?.id) {
      const savedRes = await fetch(
        `${supabaseUrl}/rest/v1/SavedAlumni?select=alumniId&studentId=eq.${encodeURIComponent(session.user.id)}`,
        { headers: restHeaders(), cache: "no-store" }
      );
      if (savedRes.ok) {
        const saved = (await savedRes.json()) as { alumniId: string }[];
        saved.forEach((s) => savedIds.add(s.alumniId));
      }
    }

    return {
      items: items.map((item) => ({
        ...item,
        languages: parseLanguages(item.languages),
        isSaved: savedIds.has(item.id),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("listAlumni error:", error);
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  }
}

export async function getAlumniById(id: string) {
  try {
    const session = await getServerSession();
    const params = new URLSearchParams({
      select: "*,sessionTypes:SessionTypeOffering(*),availability:AlumniAvailability(*)",
      id: `eq.${id}`,
      verificationStatus: "eq.approved",
      isActive: "eq.true",
    });
    const res = await fetch(`${supabaseUrl}/rest/v1/AlumniProfile?${params.toString()}`, {
      headers: restHeaders(),
      next: { revalidate: 15 },
    });
    if (!res.ok) throw new Error(`Failed to load alumni: ${res.status} ${await res.text()}`);
    const rows = (await res.json()) as any[];
    const alumni = rows[0];
    if (!alumni) return null;

    let saved = false;
    if (session?.user?.id) {
      const savedRes = await fetch(
        `${supabaseUrl}/rest/v1/SavedAlumni?select=alumniId&studentId=eq.${encodeURIComponent(session.user.id)}&alumniId=eq.${encodeURIComponent(id)}`,
        { headers: restHeaders(), cache: "no-store" }
      );
      if (savedRes.ok) saved = ((await savedRes.json()) as unknown[]).length > 0;
    }

    return { ...alumni, languages: parseLanguages(alumni.languages), isSaved: saved };
  } catch (error) {
    console.error("getAlumniById error:", error);
    return null;
  }
}

// Distinct university/country/course values across approved+active alumni —
// this is what backs the marketplace filter dropdowns. It needs no separate
// "options" table or sync step: as soon as an admin approves a new alumnus,
// their university/course/country become selectable here automatically
// (deduped for free by the DISTINCT-style Set), and once nobody approved has
// a given value anymore it naturally drops out. Cached briefly since these
// change only when an admin approves someone, not on every page view.
export async function getFilterOptions() {
  try {
    const fetchDistinct = async (column: string) => {
      const params = new URLSearchParams({ select: column, verificationStatus: "eq.approved", isActive: "eq.true", order: `${column}.asc` });
      const res = await fetch(`${supabaseUrl}/rest/v1/AlumniProfile?${params.toString()}`, {
        headers: restHeaders(),
        next: { revalidate: 60 },
      });
      if (!res.ok) throw new Error(`Failed to load filter options: ${res.status} ${await res.text()}`);
      const rows = (await res.json()) as Record<string, string>[];
      return Array.from(new Set(rows.map((r) => r[column]).filter(Boolean))) as string[];
    };

    const [universities, countries, courses] = await Promise.all([
      fetchDistinct("universityName"),
      fetchDistinct("country"),
      fetchDistinct("course"),
    ]);
    return { universities, countries, courses };
  } catch (error) {
    console.error("getFilterOptions error:", error);
    return { universities: [], countries: [], courses: [] };
  }
}

export async function saveAlumni(alumniId: string) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Please sign in." };
    await prisma.savedAlumni.upsert({
      where: { studentId_alumniId: { studentId: session.user.id, alumniId } },
      update: {},
      create: { studentId: session.user.id, alumniId },
    });
    return { success: true };
  } catch (error) {
    console.error("saveAlumni error:", error);
    return { success: false, error: "Failed to save alumni." };
  }
}

export async function unsaveAlumni(alumniId: string) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) return { success: false, error: "Please sign in." };
    await prisma.savedAlumni.deleteMany({ where: { studentId: session.user.id, alumniId } });
    return { success: true };
  } catch (error) {
    console.error("unsaveAlumni error:", error);
    return { success: false, error: "Failed to unsave alumni." };
  }
}
