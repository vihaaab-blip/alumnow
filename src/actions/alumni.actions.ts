"use server";

import { headers } from "next/headers";
import { hash } from "bcrypt-ts";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { alumniApplicationSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types";
import { auth } from "@/lib/auth";

export async function applyAsAlumni(input: unknown): Promise<ApiResponse<{ redirectTo: string }>> {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`apply:${ip}`, { max: 3, windowMs: 900000 })) return { success: false, error: "Too many applications. Try again in 15 minutes." };
  const parsed = alumniApplicationSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Check your application details." };
  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { success: false, error: "An account with this email already exists. Try logging in." };
  const langStr = parsed.data.languages ?? "";
  const languages = JSON.stringify(langStr.split(",").map((item) => item.trim()).filter(Boolean));
  const passwordHash = await hash(parsed.data.password, 12);
  const user = await prisma.$transaction(async (tx) => {
    const account = await tx.user.create({ data: { email: parsed.data.email, phone: parsed.data.phone, role: "alumnus", passwordHash, emailVerifiedAt: new Date() } });
    await tx.alumniProfile.create({ data: { userId: account.id, fullName: parsed.data.fullName, profilePhotoUrl: `https://picsum.photos/seed/${encodeURIComponent(parsed.data.fullName)}/400/400`, universityName: parsed.data.universityName, course: parsed.data.course, country: parsed.data.country, graduationYearJbcn: parsed.data.graduationYearJbcn, bio: parsed.data.bio, languages, verificationStatus: "approved", isVerifiedJbcnAlumnus: true, avgResponseTimeHours: 6, sessionTypes: { create: [{ type: "call_30", pricePaise: 29900, descriptionOneLiner: "A focused 30-minute conversation" }, { type: "call_45", pricePaise: 39900, descriptionOneLiner: "A balanced 45-minute conversation" }, { type: "call_60", pricePaise: 49900, descriptionOneLiner: "A deeper one-hour conversation" }, { type: "group_40", pricePaise: 99900, maxParticipants: 6, descriptionOneLiner: "Learn together in a small group" }] }, availability: { create: [{ dayOfWeek: 1, startTime: "17:00", endTime: "19:00" }, { dayOfWeek: 2, startTime: "17:00", endTime: "19:00" }, { dayOfWeek: 3, startTime: "17:00", endTime: "19:00" }, { dayOfWeek: 5, startTime: "17:00", endTime: "19:00" }, { dayOfWeek: 6, startTime: "10:00", endTime: "13:00" }] } } });
    return account;
  });
  await sendEmail({ to: user.email, subject: "Your AlumNow mentor profile is approved", body: `Welcome ${parsed.data.fullName}. Your profile is live and ready for students to discover.`, eventType: "alumni_application_approved" }, user.id);
  return { success: true, data: { redirectTo: "/alumni/dashboard" } };
}

export type AlumniListFilters = { search?: string; university?: string; country?: string; course?: string; studyLevel?: string; gradYearMin?: number; gradYearMax?: number; qsTiers?: string[]; priceMin?: number; priceMax?: number; languages?: string[]; minRating?: string; availability?: string; sessionType?: string; sortBy?: string; page?: number; pageSize?: number };

const alumniInclude = { sessionTypes: true, availability: true } as const;

function parseLanguages(languages: unknown): string[] {
  if (Array.isArray(languages)) return languages;
  if (typeof languages === "string") {
    try { return JSON.parse(languages) as string[]; } catch { return []; }
  }
  return [];
}

export async function listAlumni(filters: AlumniListFilters = {}) {
  try {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(24, Math.max(1, filters.pageSize ?? 20));
    const search = filters.search?.trim();

    const where: Record<string, unknown> = { verificationStatus: "approved" };

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { universityName: { contains: search } },
        { course: { contains: search } },
        { bio: { contains: search } },
      ];
    }
    if (filters.university) where.universityName = filters.university;
    if (filters.country) where.country = filters.country;
    if (filters.course) where.course = { contains: filters.course };
    if (filters.studyLevel && filters.studyLevel !== "both") where.currentStudyLevel = filters.studyLevel;
    if (filters.gradYearMin || filters.gradYearMax) {
      const gradFilter: Record<string, number> = {};
      if (filters.gradYearMin) gradFilter.gte = filters.gradYearMin;
      if (filters.gradYearMax) gradFilter.lte = filters.gradYearMax;
      where.graduationYearJbcn = gradFilter;
    }
    if (filters.qsTiers?.length) where.qsRankingTier = { in: filters.qsTiers };
    if (filters.minRating) where.ratingAvg = { gte: Number(filters.minRating) };
    if (filters.languages?.length) {
      where.OR = [
        ...((where.OR as Record<string, unknown>[] | undefined) ?? []),
        ...filters.languages.map((language) => ({ languages: { contains: language } })),
      ];
    }
    if (filters.priceMin != null || filters.priceMax != null) {
      const priceFilter: Record<string, number> = {};
      if (filters.priceMin != null) priceFilter.gte = Math.round(filters.priceMin * 100);
      if (filters.priceMax != null) priceFilter.lte = Math.round(filters.priceMax * 100);
      where.sessionTypes = { some: { pricePaise: priceFilter } };
    }
    if (filters.sessionType === "1:1") {
      const existing = where.sessionTypes as { some?: Record<string, unknown> } | undefined;
      where.sessionTypes = { some: { ...(existing?.some ?? {}), type: { in: ["call_30", "call_45", "call_60"] } } };
    } else if (filters.sessionType === "group") {
      const existing = where.sessionTypes as { some?: Record<string, unknown> } | undefined;
      where.sessionTypes = { some: { ...(existing?.some ?? {}), type: "group_40" } };
    }
    if (filters.availability === "this_week") {
      where.availability = { some: { dayOfWeek: new Date().getDay() } };
    } else if (filters.availability === "this_month") {
      where.availability = { some: {} };
    }

    let orderBy: Record<string, unknown> = { fullName: "asc" };
    if (filters.sortBy === "rating") {
      orderBy = { ratingAvg: { sort: "desc", nulls: "last" } };
    } else if (filters.sortBy === "newest") {
      orderBy = { id: "desc" };
    }

    const [items, total] = await Promise.all([
      prisma.alumniProfile.findMany({
        where,
        include: alumniInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.alumniProfile.count({ where }),
    ]);

    const session = await auth();
    const saved = session?.user?.id
      ? await prisma.savedAlumni.findMany({ where: { studentId: session.user.id }, select: { alumniId: true } })
      : [];
    const savedIds = new Set(saved.map((s) => s.alumniId));

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
    const session = await auth();
    const alumni = await prisma.alumniProfile.findUnique({
      where: { id, verificationStatus: "approved" },
      include: { sessionTypes: true, availability: true },
    });
    if (!alumni) return null;

    const saved = session?.user?.id
      ? await prisma.savedAlumni.findUnique({
          where: { studentId_alumniId: { studentId: session.user.id, alumniId: id } },
        })
      : null;

    return { ...alumni, languages: parseLanguages(alumni.languages), isSaved: !!saved };
  } catch (error) {
    console.error("getAlumniById error:", error);
    return null;
  }
}

export async function getFilterOptions(country?: string) {
  try {
    const baseWhere: Record<string, unknown> = { verificationStatus: "approved" };

    const [universities, countries, courses] = await Promise.all([
      prisma.alumniProfile.findMany({
        where: country ? { ...baseWhere, country } : baseWhere,
        distinct: ["universityName"],
        select: { universityName: true },
        orderBy: { universityName: "asc" }
      }),
      prisma.alumniProfile.findMany({
        where: baseWhere,
        distinct: ["country"],
        select: { country: true },
        orderBy: { country: "asc" }
      }),
      prisma.alumniProfile.findMany({
        where: country ? { ...baseWhere, country } : baseWhere,
        distinct: ["course"],
        select: { course: true },
        orderBy: { course: "asc" }
      }),
    ]);
    return {
      universities: universities.map((u) => u.universityName),
      countries: countries.map((c) => c.country),
      courses: courses.map((c) => c.course)
    };
  } catch (error) {
    console.error("getFilterOptions error:", error);
    return { universities: [], countries: [], courses: [] };
  }
}

export async function saveAlumni(alumniId: string) {
  try {
    const session = await auth();
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
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Please sign in." };
    await prisma.savedAlumni.deleteMany({ where: { studentId: session.user.id, alumniId } });
    return { success: true };
  } catch (error) {
    console.error("unsaveAlumni error:", error);
    return { success: false, error: "Failed to unsave alumni." };
  }
}
