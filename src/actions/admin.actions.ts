"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "@/lib/supabase-auth";
import { prisma } from "@/lib/prisma";
import { alumniAdminEditSchema } from "@/lib/validation";
import type { ApiResponse } from "@/types";

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

async function guard() {
  const session = await getServerSession();
  if (!session?.user?.id || session.user.role !== "admin") throw new Error("Admin access required.");
  return session.user.id;
}

// Service-role Supabase client for admin-only operations (e.g. updating another
// user's Auth email/metadata) that the cookie-scoped server client can't do -
// createServerSupabaseClient() is bound to the requesting admin's own session,
// not a general-purpose admin API client.
function adminAuthClient() {
  return createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Mutations below change data read by the public network (/browse), the
// alumni detail page, and this admin table - all of which read through
// fetch() calls cached via Next's data cache (see alumni.actions.ts,
// next: { revalidate: 15/60 }). Without an explicit revalidatePath here,
// those cached entries only naturally expire after their TTL, which is
// exactly the "have to hard reload to see my change" symptom: a soft
// navigation back to /browse can still be served the stale cached fetch
// response. Hard-reloading doesn't actually bypass that cache either - it's
// really the client-side pages' own state that only refetches on remount -
// but explicitly revalidating here removes the server-side staleness so the
// data is correct the moment either page fetches again.
function revalidateAlumniSurfaces(id?: string) {
  revalidatePath("/browse");
  revalidatePath("/admin/alumni");
  if (id) revalidatePath(`/alumni/${id}`);
}

export async function getAdminStats() {
  await guard();
  const [alumni, bookings, revenue, reviews] = await Promise.all([
    prisma.alumniProfile.count(),
    prisma.booking.count(),
    prisma.payment.aggregate({ _sum: { amountPaise: true }, where: { status: "verified" } }),
    prisma.review.count({ where: { moderationStatus: "pending" } }),
  ]);
  return { alumni, bookings, revenuePaise: revenue._sum.amountPaise ?? 0, pendingReviews: reviews };
}

// Lightweight count used to badge the "Alumni" nav item across every admin
// page (not just /admin/alumni), so pending applications stay visible no
// matter where the admin currently is.
export async function getPendingAlumniCount() {
  await guard();
  return prisma.alumniProfile.count({ where: { verificationStatus: "pending" } });
}

export async function getAllAlumni(opts?: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
}) {
  await guard();
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const params = new URLSearchParams({
    select: "*,user:User!AlumniProfile_userId_fkey(email,phone),sessionTypes:SessionTypeOffering(*),availability:AlumniAvailability(*)",
    order: "createdAt.desc",
    offset: String((page - 1) * pageSize),
    limit: String(pageSize),
  });
  if (opts?.status && opts.status.toLowerCase() !== "all") {
    params.set("verificationStatus", `eq.${opts.status.toLowerCase()}`);
  } else {
    // "all" still excludes soft-deleted alumni — deleted profiles should
    // never resurface anywhere in the admin UI, including this tab.
    params.set("verificationStatus", "neq.deleted");
  }
  if (opts?.search?.trim()) {
    const term = opts.search.trim().replaceAll("%", "\\%");
    params.set("or", `(fullName.ilike.*${term}*,bio.ilike.*${term}*)`);
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/AlumniProfile?${params.toString()}`, {
    headers: restHeaders({ Prefer: "count=exact" }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load alumni: ${res.status} ${await res.text()}`);

  const items = await res.json();
  const range = res.headers.get("content-range") ?? "";
  const total = Number(range.split("/")[1] ?? items.length);
  return { items, total, totalPages: Math.ceil(total / pageSize), page };
}

export async function updateAlumniProfile(id: string, data: {
  verificationStatus?: string
  isVerifiedJbcnAlumnus?: boolean
  bio?: string
  fullName?: string
  universityName?: string
  course?: string
  country?: string
}) {
  await guard();
  const payload = { ...data, updatedAt: new Date().toISOString() };
  const res = await fetch(`${supabaseUrl}/rest/v1/AlumniProfile?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: restHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update alumni: ${res.status} ${await res.text()}`);
  const rows = await res.json();
  revalidateAlumniSurfaces(id);
  return rows[0];
}

export async function createAlumniProfile(data: {
  fullName: string
  email: string
  bio?: string
  pricePaise?: number
}) {
  await guard();
  const { createServerSupabaseClient } = await import("@/utils/supabase/server");
  const supabase = await createServerSupabaseClient();
  const tempPassword = randomBytes(16).toString("hex");
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: tempPassword,
    options: { data: { role: "alumnus", full_name: data.fullName } },
  });
  if (signUpError || !authData.user) throw new Error("Failed to create user in Supabase Auth.");
  const user = await prisma.user.create({
    data: {
      id: authData.user.id,
      email: data.email,
      role: "alumnus",
      alumniProfile: {
        create: {
          fullName: data.fullName,
          bio: data.bio ?? null,
          universityName: "TBD",
          course: "TBD",
          country: "India",
          graduationYearJbcn: 2020,
          verificationStatus: "approved",
          isVerifiedJbcnAlumnus: true,
          isActive: true,
        },
      },
    },
    include: { alumniProfile: true },
  });
  if (data.pricePaise) {
    await prisma.sessionTypeOffering.create({
      data: {
        alumniId: user.alumniProfile!.id,
        type: "call_30",
        pricePaise: data.pricePaise,
      },
    });
  }
  revalidateAlumniSurfaces(user.alumniProfile!.id);
  return user;
}

export async function toggleAlumniActive(id: string, isActive: boolean) {
  await guard();
  const res = await fetch(`${supabaseUrl}/rest/v1/AlumniProfile?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: restHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify({ isActive, updatedAt: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Failed to update alumni: ${res.status} ${await res.text()}`);
  const rows = await res.json();
  revalidateAlumniSurfaces(id);
  return rows[0];
}

// Soft-deletes an alumni profile. We deliberately avoid a hard delete here:
// Booking.alumniId and Review.alumnusId reference AlumniProfile.id without
// ON DELETE CASCADE, so a real row delete would either violate those FK
// constraints (if the alumnus ever had bookings/reviews) or silently orphan
// booking/review history (if it succeeded via a cascading migration we don't
// have). Marking the profile "deleted" hides it everywhere — the public
// network already only queries verificationStatus="approved", and
// getAllAlumni above excludes "deleted" from the "all" tab — while keeping
// booking/review history intact. We do not touch the Supabase Auth user or
// User row for the same reason (Booking/Review ultimately trace back to it).
export async function deleteAlumniProfile(id: string) {
  await guard();
  const res = await fetch(`${supabaseUrl}/rest/v1/AlumniProfile?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: restHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify({
      verificationStatus: "deleted",
      isVerifiedJbcnAlumnus: false,
      isActive: false,
      updatedAt: new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error(`Failed to delete alumni: ${res.status} ${await res.text()}`);
  const rows = await res.json();
  revalidateAlumniSurfaces(id);
  return rows[0];
}

// Full admin edit of an alumni profile - unlike updateAlumniProfile above
// (status/verification only), this covers every editable field admins need
// to correct incorrect submissions or complete missing details (e.g. a
// missing photo). Email changes also update the linked Supabase Auth user
// via the service-role admin API, following the same
// supabase.auth.updateUser pattern account.actions.ts uses for self-service
// email edits, but through auth.admin.updateUserById since this is another
// user's account, not the caller's own session.
export async function editAlumniProfileAdmin(
  id: string,
  input: unknown
): Promise<ApiResponse<Record<string, never>>> {
  await guard();
  const parsed = alumniAdminEditSchema.safeParse(input);
  if (!parsed.success) return { success: false, errors: { form: parsed.error.issues.map((i) => i.message) } };
  const { email, phone, languages, ...profileFields } = parsed.data;

  const userRes = await fetch(`${supabaseUrl}/rest/v1/AlumniProfile?id=eq.${encodeURIComponent(id)}&select=userId`, {
    headers: restHeaders(),
  });
  if (!userRes.ok) return { success: false, error: "Alumni profile not found." };
  const userRows = (await userRes.json()) as { userId: string }[];
  const userId = userRows[0]?.userId;
  if (!userId) return { success: false, error: "Alumni profile not found." };

  if (email) {
    const admin = adminAuthClient();
    const { error: authError } = await admin.auth.admin.updateUserById(userId, { email });
    if (authError) return { success: false, error: `Failed to update login email: ${authError.message}` };
    const userUpdateRes = await fetch(`${supabaseUrl}/rest/v1/User?id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: restHeaders(),
      body: JSON.stringify({ email }),
    });
    if (!userUpdateRes.ok) return { success: false, error: `Failed to sync email: ${await userUpdateRes.text()}` };
  }
  if (phone) {
    const phoneRes = await fetch(`${supabaseUrl}/rest/v1/User?id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: restHeaders(),
      body: JSON.stringify({ phone }),
    });
    if (!phoneRes.ok) return { success: false, error: `Failed to update phone: ${await phoneRes.text()}` };
  }

  const payload: Record<string, unknown> = { ...profileFields, updatedAt: new Date().toISOString() };
  if (languages) payload.languages = JSON.stringify(languages);

  const res = await fetch(`${supabaseUrl}/rest/v1/AlumniProfile?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: restHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { success: false, error: `Failed to update alumni: ${await res.text()}` };

  revalidateAlumniSurfaces(id);
  return { success: true };
}

export async function getAllBookings(opts?: {
  page?: number
  pageSize?: number
  status?: string
  startDate?: string
  endDate?: string
}) {
  await guard();
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const where: Record<string, any> = {};
  if (opts?.status && opts.status !== "ALL") {
    where.status = opts.status;
  }
  if (opts?.startDate || opts?.endDate) {
    where.scheduledStartAt = {};
    if (opts?.startDate) where.scheduledStartAt.gte = new Date(opts.startDate);
    if (opts?.endDate) where.scheduledStartAt.lte = new Date(opts.endDate + "T23:59:59.999Z");
  }
  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        student: { include: { studentProfile: true } },
        alumni: true,
        payment: true,
        sessionType: true,
      },
      orderBy: { scheduledStartAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.booking.count({ where }),
  ]);
  return { items, total, totalPages: Math.ceil(total / pageSize), page };
}

export async function getAllUsers(opts?: {
  page?: number
  pageSize?: number
  search?: string
  role?: string
}) {
  await guard();
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  const where: Record<string, any> = {};
  if (opts?.search) {
    where.OR = [
      { email: { contains: opts.search } },
      { studentProfile: { fullName: { contains: opts.search } } },
      { alumniProfile: { fullName: { contains: opts.search } } },
    ];
  }
  if (opts?.role && opts.role !== "ALL") {
    where.role = opts.role;
  }
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        studentProfile: { select: { fullName: true } },
        alumniProfile: { select: { fullName: true, verificationStatus: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, totalPages: Math.ceil(total / pageSize), page };
}

export async function getPendingReviews() {
  await guard();
  return prisma.review.findMany({
    where: { moderationStatus: "pending" },
    include: {
      alumnus: true,
      booking: { include: { student: { include: { studentProfile: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function moderateReview(id: string, moderationStatus: "approved" | "rejected") {
  await guard();
  const review = await prisma.review.update({ where: { id }, data: { moderationStatus } });
  if (moderationStatus === "approved" && review.alumnusId) {
    const agg = await prisma.review.aggregate({
      where: { alumnusId: review.alumnusId, moderationStatus: "approved" },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.alumniProfile.update({
      where: { id: review.alumnusId },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count.rating },
    });
    revalidateAlumniSurfaces(review.alumnusId);
  }
  return review;
}

export async function getUpiId() {
  const setting = await prisma.platformSetting.findUnique({ where: { key: "upi_id" } });
  return setting?.value ?? "alumnow@upi";
}
export async function updatePlatformStat(key: string, value: number) {
  const adminId = await guard();
  return prisma.platformStat.upsert({
    where: { key },
    update: { value, updatedByAdminId: adminId },
    create: { key, value, updatedByAdminId: adminId },
  });
}

export async function updatePlatformSetting(key: string, value: string) {
  await guard();
  return prisma.platformSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function updateUpiSettings(upiId: string) {
  await guard();
  return prisma.platformSetting.upsert({
    where: { key: "upi_id" },
    update: { value: upiId },
    create: { key: "upi_id", value: upiId },
  });
}

export async function getPlatformSettings() {
  await guard();
  const settings = await prisma.platformSetting.findMany();
  const map: Record<string, string> = {};
  settings.forEach((s) => { map[s.key] = s.value; });
  return map;
}

export async function getPlatformStats() {
  await guard();
  const stats = await prisma.platformStat.findMany();
  const map: Record<string, number> = {};
  stats.forEach((s) => { map[s.key] = s.value; });
  return map;
}

export async function exportBookingsCsv(filters?: { startDate?: string; endDate?: string }) {
  await guard();
  const where: Record<string, any> = {};
  if (filters?.startDate || filters?.endDate) {
    where.scheduledStartAt = {};
    if (filters?.startDate) where.scheduledStartAt.gte = new Date(filters.startDate);
    if (filters?.endDate) where.scheduledStartAt.lte = new Date(filters.endDate + "T23:59:59.999Z");
  }
  const rows = await prisma.booking.findMany({
    where,
    include: { student: true, alumni: true, payment: true, sessionType: true },
    orderBy: { scheduledStartAt: "desc" },
  });
  const header = "id,student,alumni,session_type,status,start,amount_paise,amount_rupees\n";
  return header + rows.map((row) =>
    [
      row.id,
      row.student.email,
      row.alumni.fullName,
      row.sessionType.type,
      row.status,
      row.scheduledStartAt.toISOString(),
      row.payment?.amountPaise ?? 0,
      ((row.payment?.amountPaise ?? 0) / 100).toFixed(2),
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  ).join("\n");
}
