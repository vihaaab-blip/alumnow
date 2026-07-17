"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SearchOverlay, SearchTrigger } from "@/components/SearchOverlay";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getMyBookings, getAlumniBookings } from "@/actions/booking.actions";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ReviewForm } from "@/components/ReviewForm";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  CalendarDays, ArrowRight, Star, GraduationCap,
  Clock, Award, Sparkles, Search, TrendingUp,
  Download, Filter, ChevronDown,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Label,
} from "recharts";

/* ─── Real Data Generators ─── */
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

function generateWeeklyHours(bookings: any[]) {
  const { start } = getWeekRange(0);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, i) => {
    const dayStart = new Date(start);
    dayStart.setDate(start.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const hours = bookings
      .filter((b) => b.status === "completed" && new Date(b.scheduledStartAt) >= dayStart && new Date(b.scheduledStartAt) < dayEnd)
      .reduce((sum, b) => {
        const dur = (new Date(b.scheduledEndAt).getTime() - new Date(b.scheduledStartAt).getTime()) / 3600000;
        return sum + dur;
      }, 0);
    const sessions = bookings.filter((b) => b.status === "completed" && new Date(b.scheduledStartAt) >= dayStart && new Date(b.scheduledStartAt) < dayEnd).length;
    return { day, hours: Math.round(hours * 10) / 10, sessions };
  });
}

function generateLastWeekHours(bookings: any[]) {
  const { start } = getWeekRange(-1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, i) => {
    const dayStart = new Date(start);
    dayStart.setDate(start.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const hours = bookings
      .filter((b) => b.status === "completed" && new Date(b.scheduledStartAt) >= dayStart && new Date(b.scheduledStartAt) < dayEnd)
      .reduce((sum, b) => {
        const dur = (new Date(b.scheduledEndAt).getTime() - new Date(b.scheduledStartAt).getTime()) / 3600000;
        return sum + dur;
      }, 0);
    return { day, hours: Math.round(hours * 10) / 10 };
  });
}

function generateMonthlySessions(bookings: any[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = new Date().getFullYear();
  return months.map((month) => {
    const monthIndex = months.indexOf(month);
    const count = bookings.filter((b) => {
      const d = new Date(b.scheduledStartAt);
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    });
    return {
      month,
      completed: count.filter((b) => b.status === "completed").length,
      cancelled: count.filter((b) => b.status === "cancelled").length,
    };
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

/* ─── Mini Sparkline ─── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 72; const h = 24;
  const max = Math.max(...data, 1);
  const pts = data.length < 2
    ? `0,${h - ((data[0] ?? 0) / max) * h}`
    : data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" points={pts} style={{ filter: `drop-shadow(0 0 3px ${color}40)` }} />
    </svg>
  );
}

/* ─── Trend Pill ─── */
function TrendPill({ value, positive }: { value: string; positive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
      positive ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-[#DC2626]/10 text-[#DC2626]"
    }`}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={positive ? "" : "rotate-180"}>
        <path d="M4 1L7 6H1L4 1Z" fill="currentColor" />
      </svg>
      {value}
    </span>
  );
}

/* ─── Chart Tooltip ─── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1A1A] border border-white/5 rounded-[10px] px-3 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
      <p className="text-[11px] font-semibold text-white/40 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="tabular-nums">{p.value}{p.name === "Hours" || p.name === "Last week" ? "h" : ""}</span>
        </p>
      ))}
    </div>
  );
}

/* ─── Status Badge ─── */
const STATUS_MAP: Record<string, { label: string; classes: string; icon?: any }> = {
  pending_payment: { label: "Pending Payment", classes: "bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20", icon: Clock },
  payment_submitted: { label: "Payment Submitted", classes: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20" },
  confirmed: { label: "Confirmed", classes: "bg-[#E8573A]/10 text-[#E8573A] border-[#E8573A]/20" },
  completed: { label: "Completed", classes: "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20" },
  cancelled: { label: "Cancelled", classes: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20" },
  no_show: { label: "No Show", classes: "bg-[#6E6E76]/10 text-[#6E6E76] border-[#6E6E76]/20" },
};

/* ─── Helpers ─── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const ACCENT = "#E8573A";
const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const FADE_UP = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};
const CHART_ANIM = { animationBegin: 200, animationDuration: 600 };

/* ─── Dashboard Page ─── */
export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [alumniBookings, setAlumniBookings] = useState<any[]>([]);
  const [dashboardMode, setDashboardMode] = useState<"student" | "alumnus">("student");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showInsight, setShowInsight] = useState(true);

  useEffect(() => {
    if (session?.user?.role === "alumnus") setDashboardMode("alumnus");
  }, [session]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;
    getMyBookings().then(setBookings).catch(() => setBookings([]));
    getAlumniBookings().then(setAlumniBookings).catch(() => setAlumniBookings([])).finally(() => setLoading(false));
  }, [status, router]);

  const activeBookings = dashboardMode === "student" ? bookings : alumniBookings;
  const now = Date.now();
  const filtered = activeBookings.filter((b) =>
    tab === "upcoming"
      ? new Date(b.scheduledStartAt).getTime() >= now && b.status !== "cancelled"
      : new Date(b.scheduledStartAt).getTime() < now || b.status === "cancelled"
  );

  /* ------- Derived Data from Real Bookings ------- */
  const weeklyData = useMemo(() => generateWeeklyHours(activeBookings), [activeBookings]);
  const lastWeekData = useMemo(() => generateLastWeekHours(activeBookings), [activeBookings]);
  const monthlyData = useMemo(() => generateMonthlySessions(activeBookings), [activeBookings]);
  const ratingData = useMemo(() => generateRatingDist(activeBookings), [activeBookings]);

  const chartTotalHours = useMemo(() => weeklyData.reduce((a, d) => a + d.hours, 0), [weeklyData]);
  const chartTotalCompleted = useMemo(() => monthlyData.reduce((a, d) => a + d.completed, 0), [monthlyData]);
  const chartTotalCancelled = useMemo(() => monthlyData.reduce((a, d) => a + d.cancelled, 0), [monthlyData]);
  const chartAvgRating = useMemo(() => {
    const total = ratingData.reduce((s, r) => s + r.count, 0);
    const weighted = ratingData.reduce((s, r) => s + parseInt(r.rating) * r.count, 0);
    return total ? weighted / total : 0;
  }, [ratingData]);
  const chartTotalRatings = useMemo(() => ratingData.reduce((s, r) => s + r.count, 0), [ratingData]);

  const realUpcomingCount = useMemo(
    () => activeBookings.filter((b) => new Date(b.scheduledStartAt).getTime() >= now && b.status !== "cancelled").length,
    [activeBookings, now]
  );

  /* Trend indicators */
  const completedTrend = useMemo(() => {
    const half = Math.ceil(monthlyData.length / 2);
    const first = monthlyData.slice(0, half).reduce((a, d) => a + d.completed, 0);
    const second = monthlyData.slice(half).reduce((a, d) => a + d.completed, 0);
    if (!first) return { value: chartTotalCompleted > 0 ? `${chartTotalCompleted} total` : "New", positive: true };
    const pct = Math.round(((second - first) / first) * 100);
    return { value: `${pct > 0 ? "+" : ""}${pct}%`, positive: pct >= 0 };
  }, [monthlyData, chartTotalCompleted]);

  const hoursTrend = useMemo(() => {
    const thisW = weeklyData.reduce((a, d) => a + d.hours, 0);
    const lastW = lastWeekData.reduce((a, d) => a + d.hours, 0);
    if (!lastW) return { value: thisW > 0 ? `${thisW.toFixed(1)}h` : "New", positive: true };
    const pct = Math.round(((thisW - lastW) / lastW) * 100);
    return { value: `${pct > 0 ? "+" : ""}${pct}%`, positive: pct >= 0 };
  }, [weeklyData, lastWeekData]);

  const ratingTrend = useMemo(() => {
    const total = ratingData.reduce((s, r) => s + r.count, 0);
    return { value: total ? `(${total} reviews)` : "No ratings yet", positive: total >= 5 };
  }, [ratingData]);

  const upcomingTrend = useMemo(() => {
    return { value: realUpcomingCount > 0 ? `${realUpcomingCount} upcoming` : "Clear schedule", positive: realUpcomingCount > 0 };
  }, [realUpcomingCount]);

  /* Insight */
  const insight = useMemo(() => {
    const peak = [...monthlyData].sort((a, b) => b.completed - a.completed)[0];
    const avg = monthlyData.reduce((a, d) => a + d.completed, 0) / monthlyData.length;
    const latest = monthlyData[monthlyData.length - 1]?.completed ?? 0;
    if (chartTotalCompleted === 0) return "Book your first session to start tracking your mentoring journey.";
    if (latest > avg && avg > 0) return `You completed ${Math.round((latest / avg - 1) * 100)}% more sessions this month than your monthly average.`;
    return `You've completed ${chartTotalCompleted} sessions this year${peak?.month && peak.completed > 0 ? `, peaking in ${peak.month}` : ""}. Keep the momentum going!`;
  }, [monthlyData, chartTotalCompleted]);

  /* Recent mentors/students */
  const recentMentors = useMemo(() => {
    const seen = new Set<string>();
    return bookings.filter((b) => { const id = b.alumni?.id || b.alumniId; if (seen.has(id)) return false; seen.add(id); return true; }).slice(0, 4);
  }, [bookings]);

  const recentStudents = useMemo(() => {
    const seen = new Set<string>();
    return alumniBookings.filter((b) => { const id = b.student?.id || b.studentId; if (seen.has(id)) return false; seen.add(id); return true; }).slice(0, 4);
  }, [alumniBookings]);

  /* Sparkline data from real metrics */
  const sparklineCompleted = useMemo(() => monthlyData.map((d) => d.completed), [monthlyData]);
  const sparklineHours = useMemo(() => weeklyData.map((d) => d.hours), [weeklyData]);
  const sparklineRatings = useMemo(() => ratingData.map((d) => d.count), [ratingData]);
  const sparklineUpcoming = useMemo(() => {
    const upcoming = activeBookings.filter((b) => new Date(b.scheduledStartAt).getTime() >= now && b.status !== "cancelled");
    const byDay: number[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      byDay.push(upcoming.filter((b) => { const t = new Date(b.scheduledStartAt).getTime(); return t >= dayStart.getTime() && t <= dayEnd.getTime(); }).length);
    }
    return byDay;
  }, [activeBookings, now]);

  /* Peak annotation for bar chart */
  const peakMonth = useMemo(() => {
    const sorted = [...monthlyData].sort((a, b) => b.completed - a.completed);
    return sorted[0];
  }, [monthlyData]);

  /* Status ring color */
  const statusRingColor = (s: string) => {
    if (s === "completed") return "#16A34A";
    if (s === "confirmed") return ACCENT;
    if (s === "pending_payment") return "#D97706";
    if (s === "cancelled") return "#DC2626";
    if (s === "payment_submitted") return "#3B82F6";
    return "#6E6E76";
  };

  const formatBadge = (s: string) => STATUS_MAP[s] ?? { label: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), classes: "bg-[#6E6E76]/10 text-[#6E6E76] border-[#6E6E76]/20" };

  /* Stats for stat cards */
  const statCards = useMemo(() => [
    {
      icon: Award, label: "Completed", value: String(chartTotalCompleted), unit: "",
      color: "#16A34A", bg: "bg-[#16A34A]/8",
      trend: completedTrend, sparkData: sparklineCompleted,
      detail: `${chartTotalCompleted} total · ${monthlyData[monthlyData.length - 1]?.completed ?? 0} this month`,
    },
    {
      icon: Clock, label: "Total Hours", value: chartTotalHours.toFixed(1), unit: "h",
      color: "#3B82F6", bg: "bg-[#3B82F6]/8",
      trend: hoursTrend, sparkData: sparklineHours,
      detail: `${chartTotalHours.toFixed(1)}h this week`,
    },
    {
      icon: Star, label: "Rating", value: chartAvgRating > 0 ? chartAvgRating.toFixed(1) : "—", unit: chartAvgRating > 0 ? "" : "",
      color: "#D97706", bg: "bg-[#D97706]/8",
      trend: ratingTrend, sparkData: sparklineRatings,
      detail: chartTotalRatings > 0 ? `${chartTotalRatings} reviews total` : "No ratings yet",
    },
    {
      icon: TrendingUp, label: "Upcoming", value: String(realUpcomingCount), unit: "",
      color: "#8B5CF6", bg: "bg-[#8B5CF6]/8",
      trend: upcomingTrend, sparkData: sparklineUpcoming,
      detail: realUpcomingCount > 0 ? `Next: ${activeBookings.find((b) => new Date(b.scheduledStartAt).getTime() >= now && b.status !== "cancelled") ? new Date(activeBookings.find((b) => new Date(b.scheduledStartAt).getTime() >= now && b.status !== "cancelled")!.scheduledStartAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}` : "No upcoming sessions",
    },
  ], [chartTotalCompleted, chartTotalHours, chartAvgRating, chartTotalRatings, completedTrend, hoursTrend, ratingTrend, upcomingTrend, sparklineCompleted, sparklineHours, sparklineRatings, sparklineUpcoming, monthlyData, weeklyData, realUpcomingCount, activeBookings, now]);

  /* ──── Loading ──── */
  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-[#0D0D0D]">
        <div className="ml-0 min-h-screen">
          <div className="p-6 max-w-[1400px] space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <Skeleton className="h-[130px] w-full rounded-[16px]" />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.05 }} className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[120px] rounded-[16px]" />)}
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }} className="grid grid-cols-12 gap-4">
              <Skeleton className="col-span-7 rounded-[16px] h-[300px]" />
              <Skeleton className="col-span-5 rounded-[16px] h-[300px]" />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.15 }} className="grid grid-cols-12 gap-4">
              <Skeleton className="col-span-5 rounded-[16px] h-[300px]" />
              <Skeleton className="col-span-7 rounded-[16px] h-[300px]" />
            </motion.div>
          </div>
          <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} value="" onChange={(v) => { router.push(`/browse${v ? `?search=${encodeURIComponent(v)}` : ""}`); }} />
        </div>
      </div>
    );
  }

  const userName = session.user?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-[#0D0D0D] transition-colors duration-150">
      <div className="ml-0 min-h-screen">
        <div className="p-6 max-w-[1400px]">
          {/* ─── Hero Banner ─── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0, 0.1, 1] }}
            className="relative overflow-hidden rounded-[16px] bg-[#0F0F10] p-6 mb-6"
          >
            <div className="absolute inset-0 aurora-mesh" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F0F10]/80 via-transparent to-[#E8573A]/20" />
            <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-[#E8573A]/10 blur-3xl pointer-events-none" />
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[#3B82F6]/8 blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <img
                  src={session.user?.image ?? `https://picsum.photos/seed/${session.user?.id}/100/100`}
                  alt={session.user?.name ?? "Profile"}
                  className="h-[52px] w-[52px] rounded-[12px] border-2 border-white/[0.12] object-cover shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-[13px] h-[13px] rounded-full bg-[#16A34A] border-[2.5px] border-[#0F0F10] shadow-[0_0_6px_rgba(22,163,74,0.5)]" />
              </div>
              <div className="flex-1">
                <h1 className="text-[24px] font-bold text-white tracking-[-0.02em]">{getGreeting()}, {userName}</h1>
                <p className="text-[13px] text-white/50 mt-0.5">
                  {realUpcomingCount > 0
                    ? `${realUpcomingCount} upcoming session${realUpcomingCount !== 1 ? "s" : ""}`
                    : dashboardMode === "student"
                      ? "Ready to connect with alumni mentors?"
                      : "Ready for your upcoming mentoring sessions?"}
                </p>
              </div>
              {session.user?.role === "alumnus" && (
                <div className="flex bg-white/10 p-0.5 rounded-[10px] mr-2">
                  <button onClick={() => setDashboardMode("alumnus")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] transition-all duration-150 ${dashboardMode === "alumnus" ? "bg-white text-[#0D0D0D] shadow-sm" : "text-white/60 hover:text-white"}`}>Alumni view</button>
                  <button onClick={() => setDashboardMode("student")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] transition-all duration-150 ${dashboardMode === "student" ? "bg-white text-[#0D0D0D] shadow-sm" : "text-white/60 hover:text-white"}`}>Student view</button>
                </div>
              )}
              <SearchTrigger onClick={() => setSearchOpen(true)} />
            </div>
          </motion.div>

          {/* ─── Insight Callout ─── */}
          {showInsight && (
            <motion.div variants={FADE_UP} initial="hidden" animate="show" className="mb-5">
              <div className="rounded-[12px] border border-[#E8573A]/15 bg-gradient-to-r from-[#E8573A]/5 to-transparent px-5 py-3.5 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#E8573A]/10">
                  <Sparkles size={15} style={{ color: ACCENT }} />
                </div>
                <p className="text-[13px] text-primary font-medium">{insight}</p>
                <button type="button" onClick={() => setShowInsight(false)} className="ml-auto shrink-0 rounded-[8px] p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 10L10 4M10 4H5M10 4V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Top Bar Controls ─── */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-primary">Analytics overview</h2>
            <div className="flex items-center gap-2">
              <button type="button" className="flex items-center gap-1.5 rounded-[10px] border border-border/60 bg-[#1A1A1A] px-3 h-8 text-[12px] font-medium text-muted-foreground hover:text-primary transition-colors">
                <Filter size={13} /> Last 30 days <ChevronDown size={12} />
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
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-[16px] bg-[#1A1A1A] border border-white/5 p-5 flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-9 w-9 rounded-[10px] ${s.bg} flex items-center justify-center shrink-0`} style={s.color ? { backgroundColor: `${s.color}14` } : {}}>
                    <s.icon size={16} style={{ color: s.color }} />
                  </div>
                  <TrendPill value={s.trend.value} positive={s.trend.positive} />
                </div>
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.06em] mb-1">{s.label}</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-[40px] font-bold text-white tabular-nums leading-none tracking-[-0.03em]"
                    style={s.label === "Rating" && s.value === "—" ? { color: "#9A9AA2", fontSize: 32 } : {}}>
                    {s.value}
                  </p>
                  {s.unit && <span className="text-white/40 text-[16px] font-semibold ml-0.5">{s.unit}</span>}
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[11px] text-white/40">{s.detail}</span>
                  <Sparkline data={s.sparkData} color={s.color} />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ─── Charts Row ─── */}
          <motion.div variants={CONTAINER} initial="hidden" animate="show" className="grid grid-cols-12 gap-4 mb-5">
            {/* Weekly Hours */}
            <motion.div variants={FADE_UP} className="col-span-12 sm:col-span-7 rounded-[16px] bg-[#1A1A1A] border border-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.06em]">Weekly hours</h3>
                <button type="button" className="flex items-center gap-1 text-[10px] font-medium text-white/40 hover:text-primary transition-colors">
                  This week <ChevronDown size={11} />
                </button>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} {...CHART_ANIM}>
                    <defs>
                      <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ACCENT} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9A9AA2" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9A9AA2" }} axisLine={false} tickLine={false} domain={[0, 'dataMax + 1']} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeDasharray: "3 3" }} />
                    <Area type="monotone" dataKey="hours" stroke={ACCENT} strokeWidth={2.5} fill="url(#hoursGrad)" name="Hours" dot={false} activeDot={{ r: 6, fill: ACCENT, stroke: "#fff", strokeWidth: 2.5 }} />
                    <Area type="monotone" data={lastWeekData} dataKey="hours" stroke="#9A9AA2" strokeWidth={1.5} strokeDasharray="4 3" fill="none" name="Last week" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
                    <span>Mentoring hours</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                    <span className="w-2 h-2 rounded-full bg-[#9A9AA2]" />
                    <span>Last week</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-primary tabular-nums">Total: {chartTotalHours.toFixed(1)}h</span>
              </div>
            </motion.div>

            {/* Monthly Sessions */}
            <motion.div variants={FADE_UP} className="col-span-12 sm:col-span-5 rounded-[16px] bg-[#1A1A1A] border border-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.06em]">Monthly sessions</h3>
                <span className="text-[10px] font-medium text-white/40">{new Date().getFullYear()}</span>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} {...CHART_ANIM}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9A9AA2" }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fontSize: 11, fill: "#9A9AA2" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.1)", opacity: 0.3 }} />
                    <Bar dataKey="completed" fill={ACCENT} radius={[4, 4, 0, 0]} name="Completed" maxBarSize={18}>
                      {peakMonth ? monthlyData.map((entry, idx) => {
                        const isPeak = entry.month === peakMonth.month && entry.completed === peakMonth.completed;
                        return <Cell key={idx} fill={isPeak ? ACCENT : ACCENT} />;
                      }) : undefined}
                    </Bar>
                    <Bar dataKey="cancelled" fill="#DC2626" radius={[4, 4, 0, 0]} name="Cancelled" maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
                    <span>{chartTotalCompleted} completed</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                    <span className="w-2 h-2 rounded-full bg-[#DC2626]/60" />
                    <span>{chartTotalCancelled} cancelled</span>
                  </div>
                </div>
                {peakMonth && peakMonth.completed > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill={ACCENT}><circle cx="5" cy="5" r="2" /></svg>
                    Peak: {peakMonth.month}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* ─── Bottom Row ─── */}
          <motion.div variants={CONTAINER} initial="hidden" animate="show" className="grid grid-cols-12 gap-4">
            {/* Recent Mentors / Students */}
            <motion.div variants={FADE_UP} className="col-span-12 sm:col-span-5 rounded-[16px] bg-[#1A1A1A] border border-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.06em]">
                  {dashboardMode === "student" ? "Recent mentors" : "Recent students"}
                </h3>
                {dashboardMode === "student" && (
                  <Link href="/browse" className="text-[11px] font-medium text-[#E8573A] hover:text-[#D44A2E] transition-colors">View all</Link>
                )}
              </div>
              {dashboardMode === "student" ? (
                recentMentors.length === 0 ? (
                  <div className="py-10 text-center">
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="h-14 w-14 rounded-full bg-[#E8573A]/6 flex items-center justify-center mx-auto mb-3"
                    >
                      <GraduationCap size={24} className="text-[#E8573A]/30" />
                    </motion.div>
                    <p className="text-[14px] font-semibold text-white">Your mentor journey starts here</p>
                    <p className="text-[12px] text-white/40 mt-1 mb-4">Browse alumni to find the perfect mentor.</p>
                    <Link href="/browse">
                      <Button className="bg-[#E8573A] text-white hover:bg-[#D44A2E] rounded-[10px] text-[13px] h-9 px-4 transition-all duration-150">
                        <Search size={14} className="mr-1.5" /> Find a mentor
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentMentors.map((b) => {
                      const statusInfo = formatBadge(b.status);
                      return (
                        <div key={b.id} className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-[10px] hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer group">
                          <div className="relative shrink-0">
                            <img src={b.alumni?.user?.image ?? b.alumni?.profilePhotoUrl ?? `https://picsum.photos/seed/${b.alumniId}/80/80`}
                              alt={b.alumni?.fullName || "Mentor"} className="h-9 w-9 rounded-full object-cover" />
                            <span className="absolute -inset-0.5 rounded-full border-2" style={{ borderColor: statusRingColor(b.status), opacity: 0.6 }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white truncate">{b.alumni?.fullName || b.alumni?.user?.name || "Mentor"}</p>
                            <p className="text-[11px] text-white/40">{b.alumni?.universityName || "University"}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${statusInfo.classes}`}>
                            {statusInfo.icon && <statusInfo.icon size={10} />}
                            {statusInfo.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                recentStudents.length === 0 ? (
                  <div className="py-10 text-center">
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="h-14 w-14 rounded-full bg-[#E8573A]/6 flex items-center justify-center mx-auto mb-3"
                    >
                      <GraduationCap size={24} className="text-[#E8573A]/30" />
                    </motion.div>
                    <p className="text-[14px] font-semibold text-white">Your mentoring starts here</p>
                    <p className="text-[12px] text-white/40 mt-1">Students will appear here once they book a session.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentStudents.map((b) => {
                      const statusInfo = formatBadge(b.status);
                      return (
                        <div key={b.id} className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-[10px] hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer group">
                          <div className="relative shrink-0">
                            <img src={b.student?.image ?? `https://picsum.photos/seed/${b.studentId}/80/80`}
                              alt={b.student?.studentProfile?.fullName || "Student"} className="h-9 w-9 rounded-full object-cover" />
                            <span className="absolute -inset-0.5 rounded-full border-2" style={{ borderColor: statusRingColor(b.status), opacity: 0.6 }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white truncate">{b.student?.studentProfile?.fullName || b.student?.name || "Student"}</p>
                            <p className="text-[11px] text-white/40">{b.student?.email || "Student"}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${statusInfo.classes}`}>
                            {statusInfo.icon && <statusInfo.icon size={10} />}
                            {statusInfo.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </motion.div>

            {/* Sessions + Rating */}
            <motion.div variants={FADE_UP} className="col-span-12 sm:col-span-7 rounded-[16px] bg-[#1A1A1A] border border-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.06em]">Sessions</h3>
                <div className="flex gap-0.5 bg-white/[0.04] rounded-[10px] p-0.5">
                  <button onClick={() => setTab("upcoming")}
                    className={`px-3 py-1.5 text-[11px] font-semibold rounded-[8px] transition-all duration-150 ${tab === "upcoming" ? "bg-[#232326] text-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]" : "text-white/40 hover:text-white"}`}>Upcoming</button>
                  <button onClick={() => setTab("past")}
                    className={`px-3 py-1.5 text-[11px] font-semibold rounded-[8px] transition-all duration-150 ${tab === "past" ? "bg-[#232326] text-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]" : "text-white/40 hover:text-white"}`}>Past</button>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-4">
                {/* Session list */}
                <div className="col-span-7 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
                  {loading ? (
                    <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[48px] rounded-[10px]" />)}</div>
                  ) : filtered.length === 0 ? (
                    <div className="py-8 text-center">
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="h-12 w-12 rounded-full bg-[#E8573A]/6 flex items-center justify-center mx-auto mb-3"
                      >
                        <CalendarDays size={22} className="text-[#E8573A]/30" />
                      </motion.div>
                      <p className="text-[14px] font-semibold text-white">
                        {tab === "upcoming" ? "No upcoming sessions" : "No past sessions"}
                      </p>
                      <p className="text-[12px] text-white/40 mt-1">
                        {tab === "upcoming"
                          ? (dashboardMode === "student" ? "Book a session with a mentor to get started." : "Your upcoming scheduled sessions will appear here.")
                          : "Your completed sessions will appear here."}
                      </p>
                      {tab === "upcoming" && dashboardMode === "student" && (
                        <Link href="/browse">
                          <Button className="mt-4 bg-[#E8573A] text-white hover:bg-[#D44A2E] rounded-[10px] text-[13px] h-9 px-4 transition-all duration-150">
                            <Sparkles size={14} className="mr-1.5" /> Browse mentors
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {filtered.slice(0, 6).map((booking, i) => {
                        const statusInfo = formatBadge(booking.status);
                        const isUrgent = booking.status === "confirmed" && new Date(booking.scheduledStartAt).getTime() - Date.now() < 86400000;
                        return (
                          <motion.div key={booking.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.25 }}
                            className="flex items-start justify-between gap-3 py-2.5 border-b border-white/5/50 last:border-b-0"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0">
                                <img src={dashboardMode === "student"
                                  ? (booking.alumni?.user?.image ?? booking.alumni?.profilePhotoUrl ?? `https://picsum.photos/seed/${booking.alumniId}/80/80`)
                                  : (booking.student?.image ?? `https://picsum.photos/seed/${booking.studentId}/80/80`)}
                                  alt={dashboardMode === "student" ? (booking.alumni?.fullName || "Mentor") : (booking.student?.studentProfile?.fullName || "Student")}
                                  className="h-8 w-8 rounded-full object-cover" />
                                <span className="absolute -inset-0.5 rounded-full border-2" style={{ borderColor: statusRingColor(booking.status), opacity: 0.5 }} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-white truncate">
                                  {dashboardMode === "student" ? (booking.alumni?.fullName || "Mentor") : (booking.student?.studentProfile?.fullName || "Student")}
                                </p>
                                <p className="text-[11px] text-white/40">
                                  {new Date(booking.scheduledStartAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  {" · "}
                                  {new Date(booking.scheduledStartAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                              {tab === "upcoming" && (
                                <>
                                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono tabular-nums ${
                                    isUrgent ? "border-[#D97706]/20 bg-[#D97706]/5 text-[#D97706]" : "border-border/60 bg-muted/40 text-muted-foreground"
                                  }`}>
                                    {isUrgent && <span className="h-1.5 w-1.5 rounded-full bg-[#D97706] animate-pulse" />}
                                    <CountdownTimer target={booking.scheduledStartAt} />
                                  </span>
                                  {booking.meetLink && (
                                    <a href={booking.meetLink} target="_blank" rel="noreferrer">
                                      <Button variant="accent" size="sm" className="h-7 text-[11px] px-2.5 rounded-[8px]">Join</Button>
                                    </a>
                                  )}
                                </>
                              )}
                              {tab === "past" && (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.classes}`}>
                                  {statusInfo.icon && <statusInfo.icon size={10} />}
                                  {statusInfo.label}
                                </span>
                              )}
                              {tab === "past" && !booking.review && booking.status === "completed" && (
                                <ReviewForm bookingId={booking.id} onSubmitted={() =>
                                  setBookings((old) => old.map((item) =>
                                    item.id === booking.id ? { ...item, review: { id: "pending", rating: 0, text: null } } : item
                                  ))
                                } />
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                  {!loading && filtered.length > 6 && (
                    <div className="pt-2 mt-1 border-t border-white/5">
                      <Link href="/bookings" className="text-[11px] text-[#E8573A] hover:text-[#D44A2E] transition-colors flex items-center gap-1 justify-center font-medium py-1">
                        View all {filtered.length} sessions <ArrowRight size={11} />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Rating donut */}
                <div className="col-span-5 pl-4 border-l border-white/5">
                  <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.06em] mb-3">Rating breakdown</h4>
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={ratingData} cx="50%" cy="50%" innerRadius={34} outerRadius={62} paddingAngle={2} dataKey="count"
                          animationBegin={400} animationDuration={600}
                        >
                          {ratingData.map((entry, i) => (
                            <Cell key={i} fill={entry.color}
                              className="transition-all duration-150 hover:opacity-80"
                              style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.05))" }}
                            />
                          ))}
                          <Label value={`${chartAvgRating > 0 ? chartAvgRating.toFixed(1) : "—"}`}
                            position="center"
                            className="text-[22px] font-bold tabular-nums"
                            fill="#FFFFFF"
                            style={{ fontSize: 22, fontWeight: 700, dominantBaseline: "central" }}
                          />
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {ratingData.map((r) => {
                      const total = ratingData.reduce((s, x) => s + x.count, 0);
                      const pct = total ? Math.round((r.count / total) * 100) : 0;
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
                  {chartTotalRatings === 0 && (
                    <p className="mt-3 text-[11px] text-center text-muted-foreground">No ratings yet</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} value="" onChange={(v) => { router.push(`/browse${v ? `?search=${encodeURIComponent(v)}` : ""}`); }} />
    </div>
  );
}
