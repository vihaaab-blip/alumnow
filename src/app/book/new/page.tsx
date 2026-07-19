"use client";
import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight,
  Video, Users, Clock, Check, Loader2, ShieldCheck,
  Award,
} from "lucide-react";
import { createBookingDraft } from "@/actions/booking.actions";
import { getAlumniById } from "@/actions/alumni.actions";
import { Skeleton } from "@/components/ui/Skeleton";
import { getDurationMinutes } from "@/lib/utils";

/* ─────────────── Types ─────────────── */
type SessionType = {
  id: string;
  type: string;
  pricePaise: number;
  maxParticipants: number;
  descriptionOneLiner: string | null;
};
type Availability = {
  id: string;
  dayOfWeek: number; // 0 = Sun … 6 = Sat
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

type Step = "session" | "datetime" | "confirm";

/* ─────────────── Constants ─────────────── */
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const CORAL = "#E8573A";
const CORAL_GRADIENT = "linear-gradient(135deg, #f06040 0%, #E8573A 60%, #d14a2e 100%)";
const CORAL_GLOW = "0 0 18px rgba(232,87,58,0.35)";

/** Round pricePaise to nearest ₹10, display without decimals */
function formatPrice(paise: number): string {
  const rupees = paise / 100;
  const rounded = Math.round(rupees / 10) * 10;
  return `₹${rounded.toLocaleString("en-IN")}`;
}
function roundedRupees(paise: number): number {
  return Math.round(paise / 100 / 10) * 10;
}

/* ─────────────── Step Progress Bar ─────────────── */
function StepBar({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "session", label: "Session type" },
    { key: "datetime", label: "Date & time" },
    { key: "confirm", label: "Confirm" },
  ];
  const idx = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-0 mb-10">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center" style={{ flex: i < steps.length - 1 ? "1" : "none" }}>
          {/* Circle */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300"
              style={
                i < idx
                  ? { background: "#22c55e", color: "#fff" }
                  : i === idx
                  ? { background: CORAL_GRADIENT, color: "#fff", boxShadow: CORAL_GLOW }
                  : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }
              }
            >
              {i < idx ? <Check size={12} strokeWidth={3} /> : i + 1}
            </div>
            <span
              className="text-[13px] font-medium whitespace-nowrap"
              style={{ color: i <= idx ? "#fff" : "rgba(255,255,255,0.28)" }}
            >
              {s.label}
            </span>
          </div>
          {/* Connector */}
          {i < steps.length - 1 && (
            <div className="flex-1 h-px mx-3" style={{ background: "rgba(255,255,255,0.07)" }}>
              <motion.div
                className="h-full"
                style={{ background: CORAL_GRADIENT, transformOrigin: "left" }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: i < idx ? 1 : 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────── Availability Calendar ─────────────── */
/**
 * Key principle: only days that actually have slots render as interactive.
 * Everything else is visually absent — not grey-disabled, just near-invisible —
 * so the eye is drawn only to what's bookable (Calendly / Cal.com pattern).
 */
function AvailabilityCalendar({
  availableDays, // set of JS day-of-week numbers (0-6) with slots
  selectedDate,
  onSelectDate,
}: {
  availableDays: Set<number>;
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }, [viewMonth]);

  // Can't go back before today's month
  const canGoPrev = !(viewYear === today.getFullYear() && viewMonth === today.getMonth());

  // Build the day grid: [null for blanks, Date for real days]
  const cells = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    // Shift so Monday=0
    const blanks = (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    return [
      ...Array.from({ length: blanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
    ];
  }, [viewYear, viewMonth]);

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-white">Select a date</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            disabled={!canGoPrev}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-20 disabled:pointer-events-none"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "")}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[13px] font-medium text-white/60 w-28 text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "")}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-white/20 pb-1.5">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`b-${i}`} />;

          const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
          const jsDay = day.getDay();
          const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isAvailable = !isPast && availableDays.has(jsDay);
          const isSelected = selectedDate === iso;

          return (
            <button
              key={iso}
              disabled={!isAvailable}
              onClick={() => onSelectDate(iso)}
              className="relative flex flex-col items-center justify-center aspect-square rounded-xl text-[13px] font-medium transition-all duration-200"
              style={{
                color: isSelected
                  ? "#fff"
                  : isAvailable
                  ? "rgba(255,255,255,0.75)"
                  : "rgba(255,255,255,0.10)", // near-invisible unavailable days
                background: isSelected ? CORAL_GRADIENT : "transparent",
                boxShadow: isSelected ? CORAL_GLOW : "none",
                cursor: isAvailable ? "pointer" : "default",
                transform: isAvailable && !isSelected ? undefined : undefined,
              }}
              onMouseEnter={(e) => {
                if (isAvailable && !isSelected) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.transform = "scale(1.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (isAvailable && !isSelected) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "";
                }
              }}
            >
              {day.getDate()}
              {/* Coral dot — only on available, unselected days */}
              {isAvailable && !isSelected && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 block w-1 h-1 rounded-full"
                  style={{ background: CORAL }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <p className="mt-5 flex items-center gap-1.5 text-[11px] text-white/25">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CORAL }} />
        Days with a dot have open slots · other dates have no availability
      </p>
    </div>
  );
}

/* ─────────────── Time Slot List ─────────────── */
function TimeSlotList({
  slots,
  selectedSlot,
  onSelectSlot,
  duration,
}: {
  slots: { start: string; end: string }[];
  selectedSlot: string | null;
  onSelectSlot: (t: string) => void;
  duration: number;
}) {
  const tz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone.replace("_", " "),
    []
  );

  // Group by time of day
  const groups = useMemo(() => {
    const morning: typeof slots = [];
    const afternoon: typeof slots = [];
    const evening: typeof slots = [];
    slots.forEach((s) => {
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
  }, [slots]);

  // Compute end time for selected slot
  const endTime = useMemo(() => {
    if (!selectedSlot) return "";
    const [h, m] = selectedSlot.split(":").map(Number);
    const endMin = (m ?? 0) + duration;
    const endH = (h ?? 0) + Math.floor(endMin / 60);
    const endM = endMin % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  }, [selectedSlot, duration]);

  if (slots.length === 0) {
    return (
      <div
        className="mt-4 rounded-2xl px-5 py-8 text-center"
        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-[13px] text-white/35">No slots on this day</p>
        <p className="text-[11px] text-white/20 mt-1">Pick another date with a coral dot</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="mt-4 rounded-2xl p-6"
      style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-white">Available times</h3>
        <div className="flex items-center gap-1.5 text-[11px] text-white/25">
          <Clock size={11} />
          {tz}
        </div>
      </div>

      {selectedSlot && (
        <div
          className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl text-[12px] font-medium text-white"
          style={{
            background: "rgba(232,87,58,0.10)",
            border: "1px solid rgba(232,87,58,0.22)",
          }}
        >
          <Clock size={12} style={{ color: CORAL }} />
          {selectedSlot} – {endTime}
          <span className="text-white/35 ml-1">({duration} min)</span>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.label} className="mb-5 last:mb-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/22 mb-2.5">
            {group.label}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {group.slots.map((s) => {
              const active = selectedSlot === s.start;
              return (
                <button
                  key={s.start}
                  onClick={() => onSelectSlot(s.start)}
                  className="py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150"
                  style={
                    active
                      ? { background: CORAL_GRADIENT, color: "#fff", boxShadow: CORAL_GLOW }
                      : {
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          color: "rgba(255,255,255,0.65)",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.borderColor = "rgba(232,87,58,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >
                  {s.start}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

/* ─────────────── Session Type Cards ─────────────── */
function SessionTypeStep({
  sessionTypes,
  selected,
  onSelect,
}: {
  sessionTypes: SessionType[];
  selected: SessionType | null;
  onSelect: (st: SessionType) => void;
}) {
  return (
    <div>
      <h2 className="text-[22px] font-semibold text-white tracking-tight mb-1">
        Pick a session type
      </h2>
      <p className="text-[13px] text-white/35 mb-7">
        Choose how you want to connect
      </p>

      <div className="space-y-3">
        {sessionTypes.map((st) => {
          const active = selected?.id === st.id;
          const durationMin = getDurationMinutes(st.type);
          const priceRounded = roundedRupees(st.pricePaise);
          const platformFee = Math.round(priceRounded * 0.10 / 10) * 10;
          const isGroup = st.type.includes("group") || st.maxParticipants > 1;

          return (
            <motion.button
              key={st.id}
              onClick={() => onSelect(st)}
              whileTap={{ scale: 0.985 }}
              className="w-full rounded-2xl p-5 text-left transition-all duration-200 relative overflow-hidden"
              style={{
                background: active
                  ? "linear-gradient(135deg, rgba(232,87,58,0.12) 0%, rgba(232,87,58,0.05) 100%)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${active ? "rgba(232,87,58,0.35)" : "rgba(255,255,255,0.07)"}`,
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.borderColor = "rgba(232,87,58,0.2)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
              }}
            >
              {/* Left accent bar */}
              {active && (
                <div
                  className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full"
                  style={{ background: CORAL_GRADIENT }}
                />
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200"
                    style={
                      active
                        ? { background: CORAL_GRADIENT, color: "#fff", boxShadow: CORAL_GLOW }
                        : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }
                    }
                  >
                    {isGroup ? <Users size={17} /> : <Video size={17} />}
                  </div>

                  {/* Info */}
                  <div>
                    <p
                      className="text-[15px] font-semibold leading-snug capitalize mb-0.5"
                      style={{ color: active ? CORAL : "rgba(255,255,255,0.9)" }}
                    >
                      {st.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-[12px] text-white/30">
                      {durationMin} min
                      {st.descriptionOneLiner ? ` · ${st.descriptionOneLiner}` : ""}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <p
                    className="text-[18px] font-bold tabular-nums"
                    style={{ color: active ? CORAL : "rgba(255,255,255,0.85)" }}
                  >
                    {formatPrice(st.pricePaise)}
                  </p>
                  <p className="text-[11px] text-white/25 mt-0.5">
                    + ₹{platformFee} fee
                  </p>
                </div>
              </div>

              {/* Selected checkmark */}
              {active && (
                <div
                  className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: CORAL_GRADIENT }}
                >
                  <Check size={11} className="text-white" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────── Summary Rail ─────────────── */
function SummaryRail({
  alumni,
  sessionType,
  date,
  slot,
  step,
  onNext,
  onBack,
  submitting,
  error,
}: {
  alumni: AlumniData;
  sessionType: SessionType | null;
  date: string | null;
  slot: string | null;
  step: Step;
  onNext: () => void;
  onBack: () => void;
  submitting: boolean;
  error: string;
}) {
  const canContinue =
    step === "session" ? !!sessionType :
    step === "datetime" ? !!(date && slot) :
    true;

  const priceRounded = sessionType ? roundedRupees(sessionType.pricePaise) : 0;
  const platformFee = Math.round(priceRounded * 0.10 / 10) * 10;
  const total = priceRounded + platformFee;

  const formattedDate = useMemo(() => {
    if (!date) return null;
    const d = new Date(date + "T12:00");
    return `${DAY_NAMES_FULL[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
  }, [date]);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.replace("_", " ");
  const initials = alumni.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("");

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div
        className="rounded-2xl p-5 space-y-5"
        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Alumni header */}
        <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="relative shrink-0">
            {alumni.profilePhotoUrl ? (
              <img
                src={alumni.profilePhotoUrl}
                alt={alumni.fullName}
                className="h-11 w-11 rounded-full object-cover"
                style={{ border: "2px solid rgba(255,255,255,0.08)" }}
              />
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold text-white"
                style={{ background: CORAL_GRADIENT }}
              >
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-white truncate">{alumni.fullName}</p>
            <p className="text-[11px] text-white/30 truncate">{alumni.universityName}</p>
          </div>
        </div>

        {/* Selection items */}
        <div className="space-y-3">
          {sessionType ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] text-white/60">
                <Video size={13} className="text-white/25 shrink-0" />
                <span className="capitalize">{sessionType.type.replace(/_/g, " ")}</span>
              </div>
              <span className="text-[13px] font-semibold text-white">{formatPrice(sessionType.pricePaise)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[12px] text-white/20 italic">
              <Video size={12} />
              No session selected
            </div>
          )}

          {date && formattedDate && (
            <div className="flex items-center gap-2 text-[13px] text-white/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/20 w-3">📅</span>
              {formattedDate}
            </div>
          )}

          {slot && (
            <div className="flex items-center gap-2 text-[13px] text-white/60">
              <Clock size={13} className="text-white/25 shrink-0" />
              {slot}
              <span className="text-[11px] text-white/25">· {tz}</span>
            </div>
          )}
        </div>

        {/* Pricing breakdown */}
        {sessionType && (
          <div
            className="space-y-2 pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex justify-between text-[12px] text-white/35">
              <span>Session fee</span>
              <span>₹{priceRounded.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-[12px] text-white/35">
              <span>Platform fee (10%)</span>
              <span>₹{platformFee.toLocaleString("en-IN")}</span>
            </div>
            <div
              className="flex justify-between text-[16px] font-bold text-white pt-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              <span>Total</span>
              <span style={{ color: CORAL }}>₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-[12px] text-red-400 px-1">{error}</p>
        )}

        {/* CTA */}
        <button
          onClick={onNext}
          disabled={!canContinue || submitting}
          className="w-full rounded-xl py-3.5 text-[14px] font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={
            canContinue && !submitting
              ? { background: CORAL_GRADIENT, boxShadow: CORAL_GLOW }
              : { background: "rgba(255,255,255,0.06)" }
          }
          onMouseEnter={(e) => {
            if (canContinue && !submitting)
              e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = ""; }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Creating booking…
            </span>
          ) : step === "confirm" ? (
            "Confirm & pay"
          ) : (
            "Continue →"
          )}
        </button>

        {step !== "session" && (
          <button
            onClick={onBack}
            className="w-full text-[12px] text-white/25 hover:text-white/50 transition-colors"
          >
            ← Go back
          </button>
        )}

        {/* Trust strip */}
        <div
          className="flex items-center justify-center gap-1.5 text-[11px] text-white/20 pt-1"
        >
          <ShieldCheck size={12} style={{ color: "rgba(34,197,94,0.6)" }} />
          Full refund if {alumni.fullName.split(" ")[0]} doesn&apos;t confirm
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Main Content ─────────────── */
function BookSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const alumniId = searchParams.get("alumniId") ?? "";

  const [alumni, setAlumni] = useState<AlumniData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("session");
  const [selectedOffering, setSelectedOffering] = useState<SessionType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!alumniId) { setLoading(false); return; }
    getAlumniById(alumniId)
      .then((d) => d ? setAlumni(d as AlumniData) : setError("Alumni not found."))
      .catch(() => setError("Failed to load."))
      .finally(() => setLoading(false));
  }, [alumniId]);

  // Derive which days-of-week have slots
  const availableDays = useMemo(() => {
    const s = new Set<number>();
    (alumni?.availability ?? []).forEach((a) => s.add(a.dayOfWeek));
    return s;
  }, [alumni]);

  // Derive slot list for selected date
  const slotsForDate = useMemo(() => {
    if (!selectedDate || !alumni) return [];
    const jsDay = new Date(selectedDate + "T12:00").getDay();
    return (alumni.availability ?? [])
      .filter((a) => a.dayOfWeek === jsDay)
      .map((a) => ({
        start: a.startTime.slice(0, 5),
        end: a.endTime.slice(0, 5),
      }))
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [selectedDate, alumni]);

  const duration = selectedOffering ? getDurationMinutes(selectedOffering.type) : 30;

  const handleNext = async () => {
    setError("");
    if (step === "session") {
      if (!selectedOffering) { setError("Please select a session type."); return; }
      setStep("datetime");
      return;
    }
    if (step === "datetime") {
      if (!selectedDate) { setError("Please pick a date."); return; }
      if (!selectedSlot) { setError("Please pick a time slot."); return; }
      setStep("confirm");
      return;
    }
    // step === "confirm" → submit
    if (!selectedOffering || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    const start = new Date(`${selectedDate}T${selectedSlot}:00`);
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
        // Store pending booking in localStorage for the browse banner
        try {
          localStorage.setItem(
            "alumnow-pending-booking",
            JSON.stringify({ id: result.data.id, alumniName: alumni!.fullName })
          );
        } catch { /* ignore */ }
        router.push(`/book/${result.data.id}`);
      }
    } catch {
      setError("Could not create booking. Please refresh and try again.");
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    setError("");
    if (step === "confirm") { setStep("datetime"); return; }
    if (step === "datetime") { setStep("session"); return; }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-40 rounded-lg" />
            <Skeleton className="mt-4 h-[200px] w-full rounded-2xl" />
            <Skeleton className="h-[160px] w-full rounded-2xl" />
          </div>
          <Skeleton className="h-[360px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (!alumniId || !alumni) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 mb-4">{error || "No alumni selected."}</p>
          <button
            onClick={() => router.push("/browse")}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: CORAL_GRADIENT }}
          >
            Browse alumni
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-10">
      {/* Back to browse */}
      <button
        onClick={() => router.push("/browse")}
        className="flex items-center gap-1.5 text-[12px] text-white/25 hover:text-white/55 mb-7 transition-colors"
      >
        <ChevronLeft size={14} /> Browse
      </button>

      <StepBar step={step} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* ── Left: step content ── */}
        <div>
          <AnimatePresence mode="wait">
            {step === "session" && (
              <motion.div
                key="session"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <SessionTypeStep
                  sessionTypes={alumni.sessionTypes}
                  selected={selectedOffering}
                  onSelect={(st) => { setSelectedOffering(st); setError(""); }}
                />
              </motion.div>
            )}

            {step === "datetime" && (
              <motion.div
                key="datetime"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-6">
                  <h2 className="text-[22px] font-semibold text-white tracking-tight mb-1">
                    Pick a date & time
                  </h2>
                  <p className="text-[13px] text-white/35">
                    Only dates with available slots are selectable
                  </p>
                </div>

                <AvailabilityCalendar
                  availableDays={availableDays}
                  selectedDate={selectedDate}
                  onSelectDate={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                />

                {selectedDate && (
                  <TimeSlotList
                    slots={slotsForDate}
                    selectedSlot={selectedSlot}
                    onSelectSlot={setSelectedSlot}
                    duration={duration}
                  />
                )}

                {!selectedDate && availableDays.size > 0 && (
                  <div className="mt-4 px-4 py-3 rounded-xl text-[12px] text-white/25"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}
                  >
                    Select a date above — coral dots show days {alumni.fullName.split(" ")[0]} is available
                  </div>
                )}
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-[22px] font-semibold text-white tracking-tight mb-1">
                  Review & confirm
                </h2>
                <p className="text-[13px] text-white/35 mb-7">
                  Check everything looks right before paying
                </p>

                {/* Confirmation summary card */}
                <div
                  className="rounded-2xl p-6 space-y-4"
                  style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {/* Alumni row */}
                  <div className="flex items-center gap-3">
                    {alumni.profilePhotoUrl ? (
                      <img
                        src={alumni.profilePhotoUrl}
                        alt={alumni.fullName}
                        className="h-12 w-12 rounded-full object-cover shrink-0"
                        style={{ border: "2px solid rgba(255,255,255,0.08)" }}
                      />
                    ) : (
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full shrink-0 text-[14px] font-bold text-white"
                        style={{ background: CORAL_GRADIENT }}
                      >
                        {alumni.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </div>
                    )}
                    <div>
                      <p className="text-[15px] font-semibold text-white">{alumni.fullName}</p>
                      <p className="text-[12px] text-white/35">{alumni.universityName}</p>
                    </div>
                    {/* Tier badge if present */}
                    <span
                      className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: CORAL_GRADIENT }}
                    >
                      <Award size={9} /> Verified
                    </span>
                  </div>

                  {/* Detail rows */}
                  {[
                    { label: "Session", value: selectedOffering?.type.replace(/_/g, " ") ?? "" },
                    { label: "Date", value: selectedDate ? (() => { const d = new Date(selectedDate + "T12:00"); return `${DAY_NAMES_FULL[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`; })() : "" },
                    { label: "Time", value: selectedSlot ? `${selectedSlot} (${Intl.DateTimeFormat().resolvedOptions().timeZone.replace("_", " ")})` : "" },
                    { label: "Duration", value: `${duration} minutes` },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between py-2.5"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <span className="text-[12px] text-white/30">{label}</span>
                      <span className="text-[13px] font-medium text-white/75 capitalize">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Trust callouts */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { icon: <ShieldCheck size={13} style={{ color: "#22c55e" }} />, text: "Full refund if session is cancelled" },
                    { icon: <Clock size={13} className="text-white/25" />, text: "You won't be charged until confirmed" },
                  ].map(({ icon, text }) => (
                    <div
                      key={text}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[11px] text-white/30"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      {icon} {text}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right: sticky summary rail ── */}
        <SummaryRail
          alumni={alumni}
          sessionType={selectedOffering}
          date={selectedDate}
          slot={selectedSlot}
          step={step}
          onNext={() => void handleNext()}
          onBack={handleBack}
          submitting={submitting}
          error={error}
        />
      </div>
    </div>
  );
}

/* ─────────────── Export ─────────────── */
export default function NewBookingPage() {
  return (
    <div className="min-h-screen app-background text-white pt-[72px]">
      <Suspense
        fallback={
          <div className="max-w-[1100px] mx-auto px-6 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
              <div className="space-y-4">
                <Skeleton className="h-8 w-64 rounded-xl" />
                <Skeleton className="h-4 w-40 rounded-lg" />
                <Skeleton className="mt-4 h-[200px] w-full rounded-2xl" />
              </div>
              <Skeleton className="h-[360px] w-full rounded-2xl" />
            </div>
          </div>
        }
      >
        <BookSessionContent />
      </Suspense>
    </div>
  );
}
