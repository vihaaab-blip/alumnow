import { prisma } from "@/lib/prisma";
import { AdminStatCard } from "@/components/AdminStatCard";
import { PendingReviewsQueue } from "@/components/PendingReviewsQueue";
import { Users, CalendarDays, IndianRupee, Star } from "lucide-react";

export const dynamic = "force-dynamic";

async function getPendingReviews() {
  return prisma.review.findMany({
    where: { moderationStatus: "pending" },
    include: { booking: { include: { student: true, alumni: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export default async function AdminDashboardPage() {
  const [totalAlumni, totalBookings, totalRevenueResult, pendingReviews, prevMonthAlumni, prevMonthBookings, prevMonthRevenue, pendingReviewsList] = await Promise.all([
    prisma.alumniProfile.count(),
    prisma.booking.count(),
    prisma.payment.aggregate({ _sum: { amountPaise: true }, where: { status: "verified" } }),
    prisma.review.count({ where: { moderationStatus: "pending" } }),
    prisma.alumniProfile.count({
      where: { createdAt: { lt: new Date(new Date().setMonth(new Date().getMonth() - 1)) } },
    }),
    prisma.booking.count({
      where: { createdAt: { lt: new Date(new Date().setMonth(new Date().getMonth() - 1)) } },
    }),
    prisma.payment.aggregate({
      _sum: { amountPaise: true },
      where: { status: "verified", createdAt: { lt: new Date(new Date().setMonth(new Date().getMonth() - 1)) } },
    }),
    getPendingReviews(),
  ]);

  const totalRevenuePaise = totalRevenueResult._sum.amountPaise ?? 0;
  const prevRevenuePaise = prevMonthRevenue._sum.amountPaise ?? 0;

  const calcChange = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? "+100%" : null;
    const pct = ((current - prev) / prev) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  };

  const stats = [
    { label: "Total Alumni", value: totalAlumni, change: calcChange(totalAlumni, prevMonthAlumni), changeType: (totalAlumni >= prevMonthAlumni ? "increase" : "decrease") as "increase" | "decrease", icon: Users, color: "#8B5CF6" },
    { label: "Total Bookings", value: totalBookings, change: calcChange(totalBookings, prevMonthBookings), changeType: (totalBookings >= prevMonthBookings ? "increase" : "decrease") as "increase" | "decrease", icon: CalendarDays, color: "#E8573A" },
    { label: "Total Revenue", value: `\u20B9${(totalRevenuePaise / 100).toLocaleString("en-IN")}`, change: calcChange(totalRevenuePaise, prevRevenuePaise), changeType: (totalRevenuePaise >= prevRevenuePaise ? "increase" : "decrease") as "increase" | "decrease", icon: IndianRupee, color: "#D97706" },
    { label: "Pending Reviews", value: pendingReviews, icon: Star, color: "#EC4899" },
  ];

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Admin Dashboard</h1>
          <p className="mt-2 text-[var(--text-secondary)]">A live view of the alumnow. platform.</p>
        </div>
        <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white">Admin only</span>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, change, changeType, icon: Icon, color }) => (
          <AdminStatCard
            key={label}
            label={label}
            value={value}
            change={change ?? undefined}
            changeType={changeType}
            icon={Icon}
            color={color}
          />
        ))}
      </div>
      <div className="mt-6">
        <PendingReviewsQueue reviews={pendingReviewsList} />
      </div>
    </div>
  );
}
