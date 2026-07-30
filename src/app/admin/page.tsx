import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { GlowCard } from "@/components/ui/GlowCard";
import { AdminStatCard } from "@/components/AdminStatCard";
import { StaggerReveal } from "@/components/StaggerReveal";
import Link from "next/link";
import { Users, CalendarDays, IndianRupee, Star, ArrowUpRight, GraduationCap, ClipboardList } from "lucide-react";
import { getDailyRevenueSeries, getRevenueSeries } from "@/actions/admin.actions";
import { AdminPeriodSelector } from "@/components/AdminPeriodSelector";
import { AdminRevenueChart } from "@/components/AdminRevenueChart";
import { AdminActivityFeed } from "@/components/AdminActivityFeed";

export const dynamic = "force-dynamic";

const monthAgo = () => new Date(new Date().setMonth(new Date().getMonth() - 1));

async function getStats() {
  const [totalAlumni, totalBookings, totalRevenueResult, pendingReviews, pendingApplications, totalStudents, prevMonthAlumni, prevMonthBookings, prevMonthRevenue, dailyRevenue, revenueSeries] = await Promise.all([
    prisma.alumniProfile.count().catch(() => 0),
    prisma.booking.count().catch(() => 0),
    prisma.payment.aggregate({ _sum: { amountPaise: true }, where: { status: "verified" } }).catch(() => ({ _sum: { amountPaise: null } })),
    prisma.review.count({ where: { moderationStatus: "pending" } }).catch(() => 0),
    prisma.alumniProfile.count({ where: { verificationStatus: "pending" } }).catch(() => 0),
    prisma.user.count({ where: { role: "student" } }).catch(() => 0),
    prisma.alumniProfile.count({ where: { createdAt: { lt: monthAgo() } } }).catch(() => 0),
    prisma.booking.count({ where: { createdAt: { lt: monthAgo() } } }).catch(() => 0),
    prisma.payment.aggregate({ _sum: { amountPaise: true }, where: { status: "verified", createdAt: { lt: monthAgo() } } }).catch(() => ({ _sum: { amountPaise: null } })),
    getDailyRevenueSeries().catch(() => []),
    getRevenueSeries(30).catch(() => []),
  ]);
  return { totalAlumni, totalBookings, totalRevenueResult, pendingReviews, pendingApplications, totalStudents, prevMonthAlumni, prevMonthBookings, prevMonthRevenue, dailyRevenue, revenueSeries };
}

export default async function AdminDashboardPage() {
  let statsData = null;
  let statsError: string | null = null;
  try {
    statsData = await getStats();
  } catch (e) {
    statsError = e instanceof Error ? e.message : String(e);
    console.error("AdminDashboard data error:", statsError);
  }
  if (!statsData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-semibold text-white font-heading">Dashboard unavailable</h2>
        <p className="mt-2 text-white/40">Could not load dashboard data.</p>
        {statsError && <p className="mt-2 text-xs text-red-400 font-mono max-w-md">{statsError}</p>}
      </div>
    );
  }

  const { totalAlumni, totalBookings, totalRevenueResult, pendingReviews, pendingApplications, totalStudents, prevMonthAlumni, prevMonthBookings, prevMonthRevenue, dailyRevenue, revenueSeries } = statsData;
  const totalRevenuePaise = totalRevenueResult._sum.amountPaise ?? 0;
  const prevRevenuePaise = prevMonthRevenue._sum.amountPaise ?? 0;
  const revenueTrend = dailyRevenue.map((d) => d.totalPaise);

  const calcChange = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? "+100%" : null;
    const pct = ((current - prev) / prev) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  };

  const alumniChange = calcChange(totalAlumni, prevMonthAlumni);
  const bookingsChange = calcChange(totalBookings, prevMonthBookings);
  const revenueChange = calcChange(totalRevenuePaise, prevRevenuePaise);

  const quickLinks = [
    { label: "Review applications", href: "/admin/alumni", icon: GraduationCap, count: pendingApplications },
    { label: "Moderate reviews", href: "/admin/reviews", icon: ClipboardList, count: pendingReviews },
    { label: "Manage bookings", href: "/admin/bookings", icon: CalendarDays },
    { label: "View users", href: "/admin/users", icon: Users },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-white">Overview</h1>
          <p className="mt-1.5 text-sm text-white/40">A live view of the alumnow. platform — accounts, bookings, and revenue.</p>
        </div>
        <span className="rounded-full border border-coral/25 bg-coral/10 px-3 py-1.5 text-xs font-semibold text-coral">Admin only</span>
      </div>

      {/* Pending applications alert */}
      {pendingApplications > 0 && (
        <Link
          href="/admin/alumni"
          className="mt-6 flex items-center gap-3 rounded-[14px] px-5 py-4 transition-colors hover:opacity-90"
          style={{
            background: "linear-gradient(90deg, rgba(232,87,58,0.14) 0%, rgba(232,87,58,0.03) 100%)",
            border: "1px solid rgba(232,87,58,0.25)",
          }}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral/20 text-lg font-bold text-coral">
            {pendingApplications}
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {pendingApplications} alumni application{pendingApplications !== 1 ? "s" : ""} pending review
            </p>
            <p className="text-xs text-white/45 mt-0.5">Click to review and approve or reject</p>
          </div>
          <ArrowUpRight size={16} className="text-white/40" />
        </Link>
      )}

      {/* Stat grid: revenue is the headline number the platform runs on, so it
          carries a distinct featured cell instead of sitting flush with three
          identical boxes. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr]">
        <StaggerReveal>
          <GlowCard>
          <AdminStatCard
          featured
          label="Total Revenue"
          value={`₹${(totalRevenuePaise / 100).toLocaleString("en-IN")}`}
          icon={IndianRupee}
          change={revenueChange ?? undefined}
          changeType={totalRevenuePaise >= prevRevenuePaise ? "increase" : "decrease"}
          trend={revenueTrend}
          detail="Verified payments, all time"
        />
          </GlowCard>
        <div className="grid grid-cols-1 gap-4 sm:col-span-1 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-3">
          <AdminStatCard label="Alumni" value={totalAlumni} icon={GraduationCap} change={alumniChange ?? undefined} changeType={totalAlumni >= prevMonthAlumni ? "increase" : "decrease"} href="/admin/alumni" />
          <AdminStatCard label="Bookings" value={totalBookings} icon={CalendarDays} change={bookingsChange ?? undefined} changeType={totalBookings >= prevMonthBookings ? "increase" : "decrease"} href="/admin/bookings" />
          <AdminStatCard label="Pending reviews" value={pendingReviews} icon={Star} href="/admin/reviews" />
        </div>
        </StaggerReveal>
      </div>

      {/* Revenue chart */}
      <Card className="mt-8 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-white">Revenue</h2>
          <AdminPeriodSelector />
        </div>
        <AdminRevenueChart data={revenueSeries} />
      </Card>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="p-6">
          <h2 className="text-[13px] font-semibold text-white">Platform snapshot</h2>
          <p className="mt-1 text-xs text-white/40">Registered accounts across the network.</p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Students</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-white">{totalStudents}</p>
            </div>
            <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Alumni</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-white">{totalAlumni}</p>
            </div>
            <div className="rounded-[10px] border border-coral/15 bg-coral/[0.04] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Pending</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-coral">{pendingApplications}</p>
            </div>
          </div>
        </Card>

        <AdminActivityFeed />

        <Card className="p-6">
          <h2 className="text-[13px] font-semibold text-white">Quick actions</h2>
          <div className="mt-4 space-y-0.5">
            {quickLinks.map(({ label, href, icon: Icon, count }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-white/60 transition-colors duration-150 hover:bg-white/[0.04] hover:text-white"
              >
                <Icon size={16} className="text-white/30" />
                <span className="flex-1">{label}</span>
                {count != null && count > 0 && (
                  <span className="rounded-full bg-coral/15 px-2 py-0.5 text-[11px] font-bold text-coral">{count}</span>
                )}
                <ArrowUpRight size={14} className="text-white/20" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
