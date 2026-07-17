"use client";
import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, ChevronDown,
  Video, Users, CalendarDays, Clock, Check, Loader2,
} from "lucide-react";
import { createBookingDraft } from "@/actions/booking.actions";
import { getAlumniById } from "@/actions/alumni.actions";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getDurationMinutes } from "@/lib/utils";

/* ───── Types ───── */
type SessionType = {
  id: string;
  type: string;
  pricePaise: number;
  maxParticipants: number;
  descriptionOneLiner: string | null;
};
type Availability = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};
type AlumniData = {
  id: string;
  fullName: string;
  profilePhotoUrl: string | null;
  universityName: string;
  course: string;
  country: string;
  sessionTypes: SessionType[];
  availability: Availability[];
};

const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ACCENT = "#E8573A";

/* ───── Calendar Picker ───── */
function CalendarPicker({
  value,
  onChange,
  minDate,
  onClose,
}: {
  value: string;
  onChange: (d: string) => void;
  minDate: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value ? new Date(value + "T12:00") : new Date();
    return d.getMonth();
  });
  const [viewYear, setViewYear] = useState(() => {
    const d = value ? new Date(value + "T12:00") : new Date();
    return d.getFullYear();
  });
  const min = useMemo(() => new Date(minDate + "T12:00"), [minDate]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1).getDay();
    const total = new Date(viewYear, viewMonth + 1, 0).getDate();
    return { first, total };
  }, [viewMonth, viewYear]);

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }, [viewMonth]);

  const canGoPrev = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    return firstOfMonth >= new Date(min.getFullYear(), min.getMonth(), 1);
  }, [viewYear, viewMonth, min]);

  const selectDay = useCallback((day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${viewYear}-${m}-${d}`);
    onClose();
  }, [viewMonth, viewYear, onChange, onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute left-0 top-full z-50 mt-1.5 w-[292px] overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1A] shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <button
          type="button"
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-primary">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-0 px-4 pb-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="py-1 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0 px-4 pb-4">
        {Array.from({ length: days.first === 0 ? 6 : days.first - 1 }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: days.total }, (_, i) => i + 1).map((day) => {
          const m = String(viewMonth + 1).padStart(2, "0");
          const d = String(day).padStart(2, "0");
          const dateStr = `${viewYear}-${m}-${d}`;
          const isPast = new Date(viewYear, viewMonth, day) < min;
          const isSelected = value === dateStr;
          return (
            <button
              key={day}
              type="button"
              disabled={isPast}
              onClick={() => selectDay(day)}
              className={`relative flex h-9 w-full items-center justify-center rounded-lg text-sm transition-all duration-[180ms] ${
                isSelected
                  ? "text-white font-semibold"
                  : isPast
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : "text-primary hover:bg-muted"
              }`}
              style={isSelected ? { backgroundColor: ACCENT } : {}}
            >
              {day}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ───── Main Content ───── */
function BookSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const alumniId = searchParams.get("alumniId") ?? "";

  const [alumni, setAlumni] = useState<AlumniData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOffering, setSelectedOffering] = useState<SessionType | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!alumniId) { setLoading(false); return; }
    getAlumniById(alumniId)
      .then((d) => d ? setAlumni(d as AlumniData) : setError("Alumni not found."))
      .catch(() => setError("Failed to load."))
      .finally(() => setLoading(false));
  }, [alumniId]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const groupedAvailability = useMemo(() => {
    if (!alumni?.availability) return [];
    const map: Record<number, { start: string; end: string }[]> = {};
    alumni.availability.forEach((a) => {
      const key = a.dayOfWeek;
      if (!map[key]) map[key] = [];
      map[key].push({ start: a.startTime.slice(0, 5), end: a.endTime.slice(0, 5) });
    });
    return Object.entries(map)
      .map(([day, slots]) => ({ day: Number(day), slots }))
      .sort((a, b) => a.day - b.day);
  }, [alumni?.availability]);

  const selectedDateDay = date ? new Date(date + "T12:00").getDay() : -1;

  const availableSlots = useMemo(() => {
    if (!date) return [];
    const day = new Date(date + "T12:00").getDay();
    const group = groupedAvailability.find((g) => g.day === day);
    return group ? group.slots : [];
  }, [date, groupedAvailability]);

  const isDateInPast = date ? new Date(date + "T23:59") < new Date() : false;
  const duration = selectedOffering ? getDurationMinutes(selectedOffering.type) : 30;

  /* grouped by time of day */
  const slotGroups = useMemo(() => {
    const morning: typeof availableSlots = [];
    const afternoon: typeof availableSlots = [];
    const evening: typeof availableSlots = [];
    availableSlots.forEach((s) => {
      const h = parseInt(s.start, 10);
      if (h < 12) morning.push(s);
      else if (h < 17) afternoon.push(s);
      else evening.push(s);
    });
    return [
      { label: "Morning", slots: morning },
      { label: "Afternoon", slots: afternoon },
      { label: "Evening", slots: evening },
    ].filter((g) => g.slots.length > 0);
  }, [availableSlots]);

  /* formatted display date */
  const formattedDate = useMemo(() => {
    if (!date) return "";
    const d = new Date(date + "T12:00");
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  }, [date]);

  const handleSubmit = async () => {
    if (!selectedOffering) { setError("Select a session type."); return; }
    if (!date) { setError("Choose a date."); return; }
    if (!time) { setError("Choose a time slot."); return; }
    if (isDateInPast) { setError("Date cannot be in the past."); return; }
    setSubmitting(true);
    setError("");
    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + duration * 60 * 1000);
    try {
      const result = await createBookingDraft({
        alumniId: alumni!.id,
        sessionTypeOfferingId: selectedOffering.id,
        scheduledStartAt: start.toISOString(),
        scheduledEndAt: end.toISOString(),
      });
      if (!result.success || !result.data) {
        setError(result.error ?? "Could not create booking.");
        setSubmitting(false);
      } else {
        router.push(`/book/${result.data.id}`);
      }
    } catch {
      setError("Could not create booking. Please refresh and try again.");
      setSubmitting(false);
    }
  };

  /* ────── Loading ────── */
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0D0D0D]">
        <aside className="hidden w-80 shrink-0 border-r border-white/5 bg-[#0D0D0D] p-6 lg:block">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="mt-4 h-5 w-36" />
          <Skeleton className="mt-1 h-4 w-28" />
          <div className="mt-8 space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[68px] w-full rounded-xl" />)}
          </div>
        </aside>
        <div className="flex-1 p-6 lg:p-10">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-8 w-72" />
          <Skeleton className="mt-8 h-44 w-full rounded-2xl" />
          <Skeleton className="mt-5 h-44 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  /* ────── Error / Missing ────── */
  if (!alumniId || error || !alumni) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="text-muted-foreground">{error || "No alumni selected."}</p>
        <Button className="mt-4" style={{ backgroundColor: ACCENT }} onClick={() => router.push("/browse")}>
          Browse alumni
        </Button>
      </main>
    );
  }

  const priceDisplay = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;
  const sessionIcons: Record<string, React.ReactNode> = {
    one_on_one_video: <Video size={18} />,
    group_session: <Users size={18} />,
  };

  return (
    <div className="flex min-h-screen bg-[#0D0D0D]">
      {/* ─── Sidebar ─── */}
      <aside className="hidden w-80 shrink-0 border-r border-white/5 bg-[#0D0D0D] lg:flex lg:flex-col">
        {/* Profile header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-5">
          <div className="relative shrink-0">
            <img
              src={alumni.profilePhotoUrl ?? `https://picsum.photos/seed/${alumni.id}/100/100`}
              alt={alumni.fullName}
              className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold text-primary">
              {alumni.fullName}
            </h2>
            <p className="truncate text-sm text-muted-foreground">{alumni.universityName}</p>
            <p className="text-xs text-muted-foreground/70 mt-px">
              {alumni.course} · {alumni.country}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {/* ── Session types — card list ── */}
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Session types
          </p>
          <div className="space-y-2.5">
            {alumni.sessionTypes.map((st) => {
              const active = selectedOffering?.id === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => { setSelectedOffering(st); setError(""); }}
                  className={`group relative w-full rounded-xl border p-4 text-left transition-all duration-[180ms] ${
                    active
                      ? "border-[#E8573A] bg-[#E8573A]/[0.06]"
                      : "border-white/10 bg-[#1A1A1A] hover:border-[#E8573A]/30 hover:bg-[#E8573A]/[0.02]"
                  }`}
                  style={active ? { borderColor: ACCENT } : {}}
                >
                  {active && (
                    <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ backgroundColor: ACCENT }} />
                  )}
                  <div className="flex items-start gap-3 pl-1">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-[180ms] ${
                        active ? "text-white" : "text-muted-foreground bg-muted group-hover:bg-muted/80"
                      }`}
                      style={active ? { backgroundColor: ACCENT } : {}}
                    >
                      {sessionIcons[st.type] ?? <Video size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold capitalize leading-snug transition-colors duration-[180ms] ${
                          active ? "text-[#E8573A]" : "text-primary"
                        }`}>
                          {st.type.replaceAll("_", " ")}
                        </p>
                        <p className={`shrink-0 font-mono text-sm font-semibold tabular-nums transition-colors duration-[180ms] ${
                          active ? "text-[#E8573A]" : "text-primary"
                        }`}>
                          {priceDisplay(st.pricePaise)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {st.descriptionOneLiner && (
                          <span className="text-xs text-muted-foreground truncate">
                            {st.descriptionOneLiner}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground/60 shrink-0">
                          {getDurationMinutes(st.type)} min
                        </span>
                      </div>
                    </div>
                  </div>
                  {active && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: ACCENT }}>
                      <Check size={11} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Availability ── */}
          {groupedAvailability.length > 0 && (
            <div className="mt-7">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Availability
              </p>
              <div className="rounded-xl border border-border/50 bg-muted/40 p-4">
                <div className="space-y-3">
                  {groupedAvailability.map(({ day, slots }) => {
                    const isActiveDay = date && selectedDateDay === day;
                    return (
                      <div key={day}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {isActiveDay && (
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
                          )}
                          <span className={`text-xs font-semibold ${
                            isActiveDay ? "text-[#E8573A]" : "text-primary"
                          }`}>
                            {DAY_NAMES_SHORT[day]}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {slots.map((s, i) => (
                            <span
                              key={i}
                              className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-relaxed ${
                                isActiveDay
                                  ? "border-[#E8573A]/20 bg-[#E8573A]/5 text-[#E8573A]"
                                  : "border-white/10 text-muted-foreground"
                              }`}
                            >
                              {s.start}–{s.end}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main panel ─── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[640px] px-6 py-7 lg:px-10 lg:py-9">
          {/* Breadcrumb */}
          <nav className="mb-7 flex items-center gap-1.5 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => router.push("/browse")}
              className="hover:text-primary transition-colors"
            >
              Browse
            </button>
            <ChevronRight size={13} className="text-muted-foreground/50" />
            <span className="text-primary font-medium truncate">
              Book {alumni.fullName.split(" ")[0]}
            </span>
          </nav>

          <h1 className="text-[26px] font-bold leading-tight text-primary lg:text-[30px]">
            Book a session
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            with {alumni.fullName} · {alumni.universityName}
          </p>

          {/* Mobile session cards */}
          <div className="mt-8 lg:hidden">
            <p className="mb-3 text-sm font-semibold text-primary">Select a session type</p>
            <div className="space-y-2.5">
              {alumni.sessionTypes.map((st) => {
                const active = selectedOffering?.id === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => { setSelectedOffering(st); setError(""); }}
                    className={`group relative w-full rounded-xl border p-4 text-left transition-all duration-[180ms] ${
                      active
                        ? "border-[#E8573A] bg-[#E8573A]/[0.06]"
                        : "border-white/10 bg-[#1A1A1A] hover:border-[#E8573A]/30"
                    }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ backgroundColor: ACCENT }} />
                    )}
                    <div className="flex items-start gap-3 pl-1">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          active ? "text-white" : "text-muted-foreground bg-muted"
                        }`}
                        style={active ? { backgroundColor: ACCENT } : {}}
                      >
                        {sessionIcons[st.type] ?? <Video size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold capitalize ${active ? "text-[#E8573A]" : "text-primary"}`}>
                            {st.type.replaceAll("_", " ")}
                          </p>
                          <p className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${active ? "text-[#E8573A]" : "text-primary"}`}>
                            {priceDisplay(st.pricePaise)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {st.descriptionOneLiner && (
                            <span className="text-xs text-muted-foreground truncate">{st.descriptionOneLiner}</span>
                          )}
                          <span className="text-xs text-muted-foreground/60">{getDurationMinutes(st.type)} min</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Booking form ── */}
          <AnimatePresence mode="wait">
            {selectedOffering ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mt-8"
              >
                {/* Selected session summary card */}
                <div
                  className="rounded-2xl border p-5"
                  style={{ borderColor: `${ACCENT}20`, backgroundColor: `${ACCENT}04` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${ACCENT}12` }}>
                        {sessionIcons[selectedOffering.type] ?? <Video size={22} style={{ color: ACCENT }} />}
                      </div>
                      <div>
                        <p className="font-semibold text-primary capitalize leading-snug">
                          {selectedOffering.type.replaceAll("_", " ")}
                        </p>
                        {selectedOffering.descriptionOneLiner && (
                          <p className="mt-0.5 text-sm text-muted-foreground">{selectedOffering.descriptionOneLiner}</p>
                        )}
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-medium tabular-nums">{duration} min</span>
                          <span className="h-3 w-px bg-border" />
                          <span className="font-mono font-semibold tabular-nums" style={{ color: ACCENT }}>
                            {priceDisplay(selectedOffering.pricePaise)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOffering(null)}
                      className="shrink-0 text-xs font-medium transition-colors"
                      style={{ color: ACCENT }}
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-7 border-t border-white/10" />

                {/* Date & time selection */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarDays size={16} style={{ color: ACCENT }} />
                    <span className="text-sm font-semibold text-primary">Select date & time</span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Date picker trigger */}
                    <div className="relative">
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Date</label>
                      <button
                        type="button"
                        onClick={() => setCalendarOpen(!calendarOpen)}
                        className="flex h-11 w-full items-center gap-2 rounded-xl border border-white/10 bg-[#1A1A1A] px-3.5 text-left text-sm transition-all duration-[180ms] hover:border-[#E8573A]/40"
                      >
                        <CalendarDays size={15} className="shrink-0 text-muted-foreground" />
                        <span className={date ? "text-primary font-medium" : "text-muted-foreground"}>
                          {date ? formattedDate : "Select a date"}
                        </span>
                        <ChevronDown size={14} className="ml-auto shrink-0 text-muted-foreground" />
                      </button>
                      <AnimatePresence>
                        {calendarOpen && (
                          <CalendarPicker
                            value={date}
                            onChange={setDate}
                            minDate={today}
                            onClose={() => setCalendarOpen(false)}
                          />
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Selected time chip */}
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Time</label>
                      <div className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-[#1A1A1A] px-3.5 text-sm">
                        <Clock size={15} className="shrink-0 text-muted-foreground" />
                        {time ? (
                          <span className="font-medium text-primary">{time} – {(() => {
                            const parts = time.split(":").map(Number);
                            const h = parts[0] ?? 0;
                            const m = parts[1] ?? 0;
                            const endMin = m + duration;
                            const endH = h + Math.floor(endMin / 60);
                            const endM = endMin % 60;
                            return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
                          })()}</span>
                        ) : (
                          <span className="text-muted-foreground">Choose a slot below</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Duration + timezone trust line */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground/70">
                    <span className="tabular-nums">{duration} min</span>
                    <span className="h-3 w-px bg-border/60" />
                    <span>IST (UTC+5:30)</span>
                    {date && <><span className="h-3 w-px bg-border/60" /><span className="capitalize">{DAY_NAMES_FULL[selectedDateDay]}</span></>}
                  </div>
                </div>

                {/* Available slots */}
                {date && (
                  <div className="mt-6">
                    {availableSlots.length > 0 ? (
                      <>
                        <p className="mb-3 text-xs font-medium text-muted-foreground">
                          {availableSlots.length} slot{availableSlots.length > 1 ? "s" : ""} available on {formattedDate}
                        </p>
                        <div className="space-y-3">
                          {slotGroups.map((group) => (
                            <div key={group.label}>
                              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                                {group.label}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {group.slots.map((slot) => {
                                  const active = time === slot.start;
                                  return (
                                    <button
                                      key={slot.start}
                                      type="button"
                                      onClick={() => setTime(slot.start)}
                                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-[180ms] ${
                                        active
                                          ? "text-white border-transparent shadow-sm"
                                          : "border-white/10 bg-[#1A1A1A] text-white hover:border-[#E8573A]/40 hover:bg-[#E8573A]/[0.03]"
                                      }`}
                                      style={active ? { backgroundColor: ACCENT } : {}}
                                    >
                                      {slot.start} – {slot.end}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/10 bg-muted/20 px-5 py-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          No available slots on this day
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground/60">
                          Choose another date to see available times
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {isDateInPast && (
                  <p className="mt-4 text-sm" style={{ color: "#dc2626" }}>Selected date is in the past.</p>
                )}
                {error && (
                  <p className="mt-4 text-sm" style={{ color: "#dc2626" }}>{error}</p>
                )}

                {/* ── CTA ── */}
                <div className="mt-8">
                  <button
                    type="button"
                    disabled={submitting || !date || !time || isDateInPast}
                    onClick={() => void handleSubmit()}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-6 text-base font-bold text-white transition-all duration-[180ms] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      height: 54,
                      backgroundColor: submitting ? ACCENT : ACCENT,
                    }}
                    onMouseEnter={(e) => {
                      if (!submitting) e.currentTarget.style.backgroundColor = "#D44A2E";
                    }}
                    onMouseLeave={(e) => {
                      if (!submitting) e.currentTarget.style.backgroundColor = ACCENT;
                    }}
                    onMouseDown={(e) => {
                      if (!submitting) e.currentTarget.style.transform = "scale(0.98)";
                    }}
                    onMouseUp={(e) => {
                      if (!submitting) e.currentTarget.style.transform = "";
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Creating booking…</span>
                      </>
                    ) : (
                      <>
                        <span>Book session</span>
                        <span className="font-mono tabular-nums opacity-90">
                          · {priceDisplay(selectedOffering.pricePaise)}
                        </span>
                      </>
                    )}
                  </button>
                  <p className="mt-2.5 text-center text-xs text-muted-foreground/60">
                    You won&apos;t be charged until {alumni.fullName.split(" ")[0]} confirms the session
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-20 hidden text-center lg:block"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <ChevronRight size={28} className="text-muted-foreground" />
                </div>
                <p className="mt-5 text-base font-medium text-muted-foreground">
                  Select a session type from the sidebar
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ───── Export ───── */
export default function NewBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-[#0D0D0D]">
          <aside className="hidden w-80 shrink-0 border-r border-white/5 bg-[#0D0D0D] p-6 lg:block">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="mt-4 h-5 w-36" />
            <Skeleton className="mt-1 h-4 w-28" />
            <div className="mt-8 space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[68px] w-full rounded-xl" />)}
            </div>
          </aside>
          <div className="flex-1 p-6 lg:p-10">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-8 w-72" />
            <Skeleton className="mt-8 h-44 w-full rounded-2xl" />
            <Skeleton className="mt-5 h-44 w-full rounded-2xl" />
          </div>
        </div>
      }
    >
      <BookSessionContent />
    </Suspense>
  );
}
