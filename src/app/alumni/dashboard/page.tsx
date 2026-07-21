"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { motion } from "framer-motion";
import { CountdownTimer } from "@/components/CountdownTimer";
import { getAlumniBookings } from "@/actions/booking.actions";
import { SearchOverlay, SearchTrigger } from "@/components/SearchOverlay";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Sidebar } from "@/components/Sidebar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Label,
} from "recharts";
import {
  CalendarDays, ArrowRight, Star, GraduationCap,
  Award, Sparkles, Users,
  DollarSign, Edit3, ChevronDown,
  Download, Filter,
} from "lucide-react";

const ACCENT = "#E8573A";
const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const FADE_UP = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

function getWeekRange(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + mondayOffset + offset * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function generateMonthlySessions(bookings: any[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = new Date().getFullYear();
  return months.map((month) => {
    const monthIndex = months.indexOf(month);
    const monthBookings = bookings.filter((b) => {
      const d = new Date(b.scheduledStartAt);
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    });
    return {
      month,
      sessions: monthBookings.filter((b) => b.status !== "cancelled").length,
    };
  });
}

function generateWeeklyStudents(bookings: any[]) {
  const { start } = getWeekRange(0);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, i) => {
    const dayStart = new Date(start);
    dayStart.setDate(start.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const students = new Set(
      bookings
        .filter((b) => new Date(b.scheduledStartAt) >= dayStart && new Date(b.scheduledStartAt) < dayEnd)
        .map((b) => b.studentId)
    );
    return { day, students: students.size };
  });
}

function generateEarnings(bookings: any[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = new Date().getFullYear();
  return months.map((month) => {
    const monthIndex = months.indexOf(month);
    const amount = bookings
      .filter((b) => {
        const d = new Date(b.scheduledStartAt);
        return d.getFullYear() === year && d.getMonth() === monthIndex && b.status !== "cancelled";
      })
      .reduce((sum, b) => sum + (b.payment?.amountPaise ?? b.sessionType?.pricePaise ?? 0), 0);
    return { month, amount };
  });
}

function generateRatingDist(bookings: any[]) {
  const dist = [5, 4, 3, 2, 1].map((r) => ({
    rating: `${r}★`,
    count: bookings.filter((b) => b.review?.rating === r).length,
    color: r === 5 ? "#16A34A" : r === 4 ? "#65A30D" : r === 3 ? "#D97706" : r === 2 ? "#DC2626" : "#EF4444",
  }));
  return dist;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  pending_payment: { label: "Pending Payment", classes: "bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20" },
  payment_submitted: { label: "Payment Submitted", classes: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20" },
  confirmed: { label: "Confirmed", classes: "bg-[#E8573A]/10 text-[#E8573A] border-[#E8573A]/20" },
  completed: { label: "Completed", classes: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20" },
  cancelled: { label: "Cancelled", classes: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20" },
  no_show: { label: "No Show", classes: "bg-[#6E6E76]/10 text-[#6E6E76] border-[#6E6E76]/20" },
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 72; const h = 24;
  const max = Math.max(...data, 1);
  const pts = data.length < 2
    ? `0,${h - (data[0] ?? 0 / max) * h}`
    : data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" points={pts} style={{ filter: `drop-shadow(0 0 3px ${color}40)` }} />
    </svg>
  );
}

function TrendPill({ value, positive }: { value: string; positive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${positive ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-[#DC2626]/10 text-[#DC2626]"}`}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={positive ? "" : "rotate-180"}>
        <path d="M4 1L7 6H1L4 1Z" fill="currentColor" />
      </svg>
      {value}
    </span>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1A1A] border border-white/5 rounded-[10px] px-3 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.1)] shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
      <p className="text-[11px] font-semibold text-white/40 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="tabular-nums">{p.value}{p.name === "Earnings" ? "₹" : ""}</span>
        </p>
      ))}
    </div>
  );
}

export default function AlumniDashboardPage() {
  return (
    <ErrorBoundary>
      <AlumniDashboardContent />
    </ErrorBoundary>
  );
}

function AlumniDashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;
    getAlumniBookings()
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [status, router]);

  const now = Date.now();

  const sessionsData = useMemo(() => generateMonthlySessions(bookings), [bookings]);
  const studentsData = useMemo(() => generateWeeklyStudents(bookings), [bookings]);
  const earningsData = useMemo(() => generateEarnings(bookings), [bookings]);
  const ratingData = useMemo(() => generateRatingDist(bookings), [bookings]);

  const totalSessions = useMemo(() => sessionsData.reduce((a, d) => a + d.sessions, 0), [sessionsData]);
  const totalStudents = useMemo(() => new Set(bookings.map((b) => b.studentId)).size, [bookings]);
  const totalEarnings = useMemo(() => earningsData.reduce((a, d) => a + d.amount, 0), [earningsData]);
  const totalRatings = useMemo(() => ratingData.reduce((s, r) => s + r.count, 0), [ratingData]);
  const avgRating = useMemo(() => {
    const weighted = ratingData.reduce((s, r) => s + parseInt(r.rating) * r.count, 0);
    return totalRatings ? weighted / totalRatings : 0;
  }, [ratingData, totalRatings]);

  const upcomingCount = useMemo(
    () => bookings.filter((b) => new Date(b.scheduledStartAt).getTime() >= now && b.status !== "cancelled").length,
    [bookings, now]
  );

  const sessionsTrend = useMemo(() => {
    const half = Math.ceil(sessionsData.length / 2);
    const first = sessionsData.slice(0, half).reduce((a, d) => a + d.sessions, 0);
    const second = sessionsData.slice(half).reduce((a, d) => a + d.sessions, 0);
    if (!first) return { value: "New", positive: true };
    const pct = Math.round(((second - first) / first) * 100);
    return { value: `${pct > 0 ? "+" : ""}${pct}%`, positive: pct >= 0 };
  }, [sessionsData]);

  const earningsTrend = useMemo(() => {
    const half = Math.ceil(earningsData.length / 2);
    const first = earningsData.slice(0, half).reduce((a, d) => a + d.amount, 0);
    const second = earningsData.slice(half).reduce((a, d) => a + d.amount, 0);
    if (!first) return { value: "New", positive: true };
    const pct = Math.round(((second - first) / first) * 100);
    return { value: `${pct > 0 ? "+" : ""}${pct}%`, positive: pct >= 0 };
  }, [earningsData]);

  const sparkSessions = useMemo(() => sessionsData.map((d) => d.sessions), [sessionsData]);
  const sparkStudents = useMemo(() => studentsData.map((d) => d.students), [studentsData]);
  const sparkEarnings = useMemo(() => earningsData.map((d) => d.amount / 1000), [earningsData]);
  const sparkRatings = useMemo(() => ratingData.map((d) => d.count), [ratingData]);

  const peakMonth = useMemo(() => [...sessionsData].sort((a, b) => b.sessions - a.sessions)[0], [sessionsData]);
  const peakEarningsMonth = useMemo(() => [...earningsData].sort((a, b) => b.amount - a.amount)[0], [earningsData]);

  const insight = useMemo(() => {
    const avg = sessionsData.reduce((a, d) => a + d.sessions, 0) / sessionsData.length;
    const latest = sessionsData[sessionsData.length - 1]?.sessions ?? 0;
    if (latest > avg) return `You're trending up! ${Math.round((latest / avg - 1) * 100)}% more sessions this month than your average.`;
    return `You've mentored ${totalStudents} students across ${totalSessions} sessions this year — keep sharing your expertise!`;
  }, [sessionsData, totalSessions, totalStudents]);

  const statCards = useMemo(() => [
    {
      icon: Award, label: "Total Sessions", value: String(totalSessions), unit: "",
      color: "#E8573A", bg: "bg-[#E8573A]/8",
      trend: sessionsTrend, sparkData: sparkSessions,
      detail: `${sessionsData[sessionsData.length - 1]?.sessions ?? 0} this month · peak in ${peakMonth?.month}`,
    },
    {
      icon: Users, label: "Students Mentored", value: String(totalStudents), unit: "",
      color: "#16A34A", bg: "bg-[#16A34A]/8",
      trend: { value: `${studentsData[studentsData.length - 1]?.students ?? 0} this week`, positive: true }, sparkData: sparkStudents,
      detail: `${studentsData[studentsData.length - 1]?.students ?? 0} this week`,
    },
    {
      icon: DollarSign, label: "Total Earnings", value: `₹${(totalEarnings / 100000).toFixed(1)}`, unit: "L",
      color: "#D97706", bg: "bg-[#D97706]/8",
      trend: earningsTrend, sparkData: sparkEarnings,
      detail: `Best month: ${peakEarningsMonth?.month} · ₹${peakEarningsMonth ? (peakEarningsMonth.amount / 100).toFixed(0) : 0}K`,
    },
    {
      icon: Star, label: "Rating", value: avgRating > 0 ? avgRating.toFixed(1) : "—", unit: "",
      color: "#EC4899", bg: "bg-[#EC4899]/8",
      trend: { value: `${totalRatings} reviews`, positive: totalRatings >= 5 }, sparkData: sparkRatings,
      detail: `${totalRatings} total reviews`,
    },
  ], [totalSessions, totalStudents, totalEarnings, avgRating, totalRatings, sessionsTrend, earningsTrend, sparkSessions, sparkStudents, sparkEarnings, sparkRatings, sessionsData, studentsData, peakMonth, peakEarningsMonth]);

  const formatBadge = (s: string) => STATUS_MAP[s] ?? { label: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), classes: "bg-[#6E6E76]/10 text-[#6E6E76] border-[#6E6E76]/20" };

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-[#0D0D0D]">
        <Sidebar />
      <div className="ml-[240px] min-h-screen">
          <div className="p-6 max-w-[1400px] space-y-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[100px] rounded-[16px]" />)}
          </div>
        </div>
      </div>
    );
  }

  const userName = session.user?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-[#0D0D0D] transition-colors duration-150">
      <Sidebar />
      <div className="ml-[240px] min-h-screen">
        <div className="p-6 max-w-[1400px]">

          {/* ─── Hero ─── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#0F0F10] via-[#0F0F10] to-[#1A0F2E] p-6 mb-6"
          >
            <div className="absolute inset-0 aurora-mesh" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F0F10]/80 via-transparent to-[#E8573A]/20" />
            <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-[#E8573A]/15 blur-3xl pointer-events-none" />
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[#EC4899]/8 blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <img
                  src={`https://picsum.photos/seed/${session.user.id}/100/100`}
                  alt={session.user?.name ?? "Profile"}
                  className="h-[52px] w-[52px] rounded-[12px] border-2 border-white/[0.12] object-cover shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-[13px] h-[13px] rounded-full bg-[#16A34A] border-[2.5px] border-[#0F0F10] shadow-[0_0_6px_rgba(22,163,74,0.5)]" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#E8573A]">Alumni dashboard</p>
                <h1 className="text-[24px] font-bold text-white tracking-[-0.02em] mt-0.5">{getGreeting()}, {userName}</h1>
                <p className="text-[13px] text-white/50 mt-0.5">
                  {upcomingCount > 0
                    ? `You have ${upcomingCount} upcoming session${upcomingCount !== 1 ? "s" : ""}`
                    : "Your mentoring dashboard — manage sessions, earnings & more"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/alumni/profile">
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-[12px] h-9 rounded-[10px]">
                    <Edit3 size={13} className="mr-1.5" /> Profile
                  </Button>
                </Link>
                <SearchTrigger onClick={() => setSearchOpen(true)} />
              </div>
            </div>
          </motion.div>

          {/* ─── Insight ─── */}
          <motion.div variants={FADE_UP} initial="hidden" animate="show" className="mb-5">
            <div className="rounded-[12px] border border-[#E8573A]/15 bg-gradient-to-r from-[#E8573A]/5 to-transparent px-5 py-3.5 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#E8573A]/10">
                <Sparkles size={15} style={{ color: ACCENT }} />
              </div>
              <p className="text-[13px] text-primary font-medium">{insight}</p>
              <button type="button" className="ml-auto shrink-0 rounded-[8px] p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 10L10 4M10 4H5M10 4V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </motion.div>

          {/* ─── Controls ─── */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-primary">Mentor analytics</h2>
            <div className="flex items-center gap-2">
              <button type="button" className="flex items-center gap-1.5 rounded-[10px] border border-border/60 bg-[#1A1A1A] px-3 h-8 text-[12px] font-medium text-muted-foreground hover:text-primary transition-colors">
                <Filter size={13} /> This year <ChevronDown size={12} />
              </button>
              <button type="button" className="rounded-[10px] border border-border/60 bg-[#1A1A1A] px-3 h-8 text-[12px] font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                <Download size={13} /> Export
              </button>
            </div>
          </div>

          {/* ─── Stat Cards ─── */}
          <motion.div variants={CONTAINER} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {statCards.map((s) => (
              <motion.div key={s.label} variants={FADE_UP}
                className={`relative overflow-hidden rounded-[16px] border border-white/5 ${s.bg} p-5 transition-all duration-150`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-[10px]`} style={{ backgroundColor: `${s.color}15` }}>
                    <s.icon size={15} style={{ color: s.color }} />
                  </div>
                  {s.trend && <TrendPill value={s.trend.value} positive={s.trend.positive} />}
                </div>
                <p className="text-[11px] text-white/40 font-medium mb-0.5">{s.label}</p>
                <div className="flex items-end justify-between">
                  <p className="text-[28px] font-bold tabular-nums text-primary tracking-[-0.02em]" style={{ lineHeight: 1 }}>
                    {s.value}<span className="text-[14px] font-semibold text-muted-foreground ml-0.5">{s.unit}</span>
                  </p>
                  <Sparkline data={s.sparkData} color={s.color} />
                </div>
                <p className="mt-1.5 text-[11px] text-white/40">{s.detail}</p>
                <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${s.color}40, ${s.color}80, ${s.color}40)` }} />
              </motion.div>
            ))}
          </motion.div>

          {/* ─── Charts Row ─── */}
          <motion.div variants={CONTAINER} initial="hidden" animate="show" className="grid grid-cols-12 gap-4 mb-5">

            {/* Sessions bar chart */}
            <motion.div variants={FADE_UP} className="col-span-12 sm:col-span-7 rounded-[16px] bg-[#1A1A1A] border border-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.06em]">Sessions per month</h3>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-1 text-white/40">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
                    Completed
                  </span>
                </div>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionsData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-white/10" strokeWidth={1} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9A9AA2" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9A9AA2" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "transparent" }} />
                    <Bar dataKey="sessions" name="Sessions" radius={[4, 4, 0, 0]} fill={ACCENT}
                      animationBegin={200} animationDuration={600}
                      label={({ x, y, width, value }: any) =>
                        value === peakMonth?.sessions ? (
                          <text x={x + width / 2} y={y - 8} textAnchor="middle" fill={ACCENT} fontSize={9} fontWeight={600}>
                            ▲ Peak
                          </text>
                        ) : null
                      }
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Rating donut + overview */}
            <motion.div variants={FADE_UP} className="col-span-12 sm:col-span-5 rounded-[16px] bg-[#1A1A1A] border border-white/5 p-5">
              <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.06em] mb-3">Rating breakdown</h3>
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ratingData} cx="50%" cy="50%" innerRadius={32} outerRadius={58} paddingAngle={2} dataKey="count"
                      animationBegin={400} animationDuration={600}
                    >
                      {ratingData.map((entry, i) => (
                        <Cell key={i} fill={entry.color}
                          className="transition-all duration-150 hover:opacity-80"
                          style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.05))" }}
                        />
                      ))}
                      <Label value={`${avgRating > 0 ? avgRating.toFixed(1) : "—"}`}
                        position="center"
                        fill="#0F0F10"
                        className="text-[20px] font-bold tabular-nums"
                        style={{ fontSize: 20, fontWeight: 700, dominantBaseline: "central" }}
                      />
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {ratingData.map((r) => {
                  const pct = totalRatings ? Math.round((r.count / totalRatings) * 100) : 0;
                  return (
                    <div key={r.rating} className="flex items-center gap-2 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                      <span className="text-white/40 w-[20px]">{r.rating}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: r.color }} />
                      </div>
                      <span className="text-white font-medium tabular-nums w-[24px] text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>

          {/* ─── Bottom Row: Quick Actions + Earnings + Bookings ─── */}
          <motion.div variants={CONTAINER} initial="hidden" animate="show" className="grid grid-cols-12 gap-4">

            {/* Quick actions */}
            <motion.div variants={FADE_UP} className="col-span-12 sm:col-span-3 rounded-[16px] bg-[#1A1A1A] border border-white/5 p-5">
              <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.06em] mb-4">Quick actions</h3>
              <div className="space-y-1.5">
                <Link href="/alumni/profile/edit" className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-[10px] hover:bg-white/[0.03] transition-colors group">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#E8573A]/10">
                    <Edit3 size={14} style={{ color: ACCENT }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-primary">Edit profile</p>
                    <p className="text-[10px] text-muted-foreground">Update bio, photo & details</p>
                  </div>
                  <ArrowRight size={13} className="text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </Link>
                <Link href="/alumni/profile/availability" className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-[10px] hover:bg-white/[0.03] transition-colors group">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#16A34A]/10">
                    <CalendarDays size={14} style={{ color: "#16A34A" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-primary">Manage availability</p>
                    <p className="text-[10px] text-muted-foreground">Set your weekly schedule</p>
                  </div>
                  <ArrowRight size={13} className="text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </Link>
                <Link href="/alumni/profile/pricing" className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-[10px] hover:bg-white/[0.03] transition-colors group">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#D97706]/10">
                    <DollarSign size={14} style={{ color: "#D97706" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-primary">Pricing & session types</p>
                    <p className="text-[10px] text-muted-foreground">Configure session offerings</p>
                  </div>
                  <ArrowRight size={13} className="text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </Link>
                <Link href="/browse" className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-[10px] hover:bg-white/[0.03] transition-colors group">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#EC4899]/10">
                    <GraduationCap size={14} style={{ color: "#EC4899" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-primary">View marketplace</p>
                    <p className="text-[10px] text-muted-foreground">See how students see you</p>
                  </div>
                  <ArrowRight size={13} className="text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </Link>
              </div>
            </motion.div>

            {/* Earnings chart */}
            <motion.div variants={FADE_UP} className="col-span-12 sm:col-span-4 rounded-[16px] bg-[#1A1A1A] border border-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.06em]">Earnings</h3>
                <span className="text-[13px] font-bold tabular-nums text-primary">₹{(totalEarnings / 100000).toFixed(1)}L</span>
              </div>
              <div className="h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earningsData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-white/10" strokeWidth={1} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#9A9AA2" }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fontSize: 9, fill: "#9A9AA2" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}K`} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "transparent" }} />
                    <Bar dataKey="amount" name="Earnings" radius={[3, 3, 0, 0]}
                      fill="url(#earningsGradient)" animationBegin={300} animationDuration={600}
                    />
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D97706" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#D97706" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Upcoming bookings */}
            <motion.div variants={FADE_UP} className="col-span-12 sm:col-span-5 rounded-[16px] bg-[#1A1A1A] border border-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.06em]">Upcoming bookings</h3>
                <Link href="/bookings" className="text-[11px] text-[#E8573A] hover:text-[#D44A2E] font-medium flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={11} />
                </Link>
              </div>
              {loading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[48px] rounded-[10px]" />)}</div>
              ) : bookings.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-[#E8573A]/6 flex items-center justify-center mx-auto mb-3">
                    <CalendarDays size={22} className="text-[#E8573A]/30" />
                  </div>
                  <p className="text-[14px] font-semibold text-primary">No bookings yet</p>
                  <p className="text-[12px] text-muted-foreground mt-1">When students book sessions, they will appear here.</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {bookings.filter((b) => new Date(b.scheduledStartAt).getTime() >= now && b.status !== "cancelled").slice(0, 4).map((b, i) => {
                    const statusInfo = formatBadge(b.status);
                    const isUrgent = b.status === "confirmed" && new Date(b.scheduledStartAt).getTime() - now < 86400000;
                    return (
                      <motion.div key={b.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.25 }}
                        className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-b-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={`https://picsum.photos/seed/${b.studentId}/40/40`}
                            alt="Student" className="h-8 w-8 rounded-full object-cover" />
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-primary truncate">
                              {b.student?.studentProfile?.fullName || b.student?.name || "Student"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(b.scheduledStartAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              {" · "}
                              {new Date(b.scheduledStartAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {isUrgent ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D97706]/20 bg-[#D97706]/5 text-[#D97706] px-2.5 py-0.5 text-[10px] font-mono tabular-nums">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#D97706] animate-pulse" />
                              <CountdownTimer target={b.scheduledStartAt} />
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.classes}`}>
                              {statusInfo.label}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  {bookings.filter((b) => new Date(b.scheduledStartAt).getTime() >= now && b.status !== "cancelled").length > 4 && (
                    <div className="pt-2 mt-1 border-t border-white/5">
                      <Link href="/bookings" className="text-[11px] text-[#E8573A] hover:text-[#D44A2E] transition-colors flex items-center gap-1 justify-center font-medium py-1">
                        View all bookings <ArrowRight size={11} />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} value="" onChange={(v) => { router.push(`/browse${v ? `?search=${encodeURIComponent(v)}` : ""}`); }} />
    </div>
  );
}
