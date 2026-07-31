"use client";
import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const CORAL_GRADIENT = "linear-gradient(135deg, #f06040 0%, #E8573A 60%, #d14a2e 100%)";
const CORAL_GLOW = "0 0 18px rgba(232,87,58,0.35)";

/**
 * Same visual pattern as the student-facing booking flow's date picker
 * (src/app/book/new/page.tsx) — reused here so an alumnus picking a one-off
 * availability date gets the same calendar instead of a bare <input type=date>.
 * Unlike the booking picker, every future date is selectable (there's no
 * "days with slots" concept when you're the one defining the slots).
 */
export function DatePickerCalendar({
  selectedDate,
  onSelectDate,
}: {
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

  const canGoPrev = !(viewYear === today.getFullYear() && viewMonth === today.getMonth());

  const cells = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const blanks = (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    return [
      ...Array.from({ length: blanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
    ];
  }, [viewYear, viewMonth]);

  return (
    <div className="rounded-2xl p-6" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-white">Select a date</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            disabled={!canGoPrev}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-20 disabled:pointer-events-none text-white/40 hover:bg-white/[0.06]"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[13px] font-medium text-white/60 w-28 text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg transition-colors text-white/40 hover:bg-white/[0.06]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-white/20 pb-1.5">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`b-${i}`} />;
          const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
          const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isSelected = selectedDate === iso;

          return (
            <button
              key={iso}
              type="button"
              disabled={isPast}
              onClick={() => onSelectDate(iso)}
              className="relative flex flex-col items-center justify-center aspect-square rounded-xl text-[13px] font-medium transition-all duration-200 disabled:cursor-default"
              style={{
                color: isSelected ? "#fff" : isPast ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.75)",
                background: isSelected ? CORAL_GRADIENT : "transparent",
                boxShadow: isSelected ? CORAL_GLOW : "none",
              }}
              onMouseEnter={(e) => {
                if (!isPast && !isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                if (!isPast && !isSelected) e.currentTarget.style.background = "transparent";
              }}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
