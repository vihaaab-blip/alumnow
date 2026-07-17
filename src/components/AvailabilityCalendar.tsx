"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAvailability } from "@/lib/hooks/useAvailability";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

type Availability = { id: string; dayOfWeek: number | null; specificDate: Date | string | null; startTime: string; endTime: string; isRecurring: boolean };

function generateDays() {
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

function generateSlots(): string[] {
  const slots: string[] = [];
  for (let h = 9; h <= 18; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 18) slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

const SLOTS = generateSlots();

export function AvailabilityCalendar({
  availability,
  booked,
  alumniId,
}: {
  availability: Availability[];
  booked: Array<{ scheduledStartAt: Date | string; scheduledEndAt: Date | string }>;
  alumniId: string;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [days, setDays] = useState<Date[] | null>(null);

  useEffect(() => {
    setDays(generateDays());
  }, []);

  const { getSlotStatus } = useAvailability(availability, booked, days ?? [], SLOTS);

  if (availability.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-primary">Availability</h2>
        <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No availability set for this week.
        </p>
      </section>
    );
  }

  if (!days) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-primary">Availability</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-[#1A1A1A]">
          <div className="grid min-w-[720px] grid-cols-8 text-xs">
            <div className="border-b border-border p-3 font-semibold text-muted-foreground">IST</div>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="border-b border-l border-border p-3" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const handleSlotClick = (date: Date, time: string) => {
    const status = getSlotStatus(date, time);
    if (status !== "available") return;
    const dateStr = date.toISOString().split("T")[0];
    router.push(`/book/new?alumniId=${encodeURIComponent(alumniId)}&date=${dateStr}&time=${encodeURIComponent(time)}`);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-primary">Availability</h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-[#1A1A1A]">
        <div className="grid min-w-[720px] grid-cols-8 text-xs">
          <div className="border-b border-border p-3 font-semibold text-muted-foreground">IST</div>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={`border-b border-l border-border p-3 text-center font-semibold ${
                day.toDateString() === new Date().toDateString() ? "border-t-2 border-t-primary text-primary" : ""
              }`}
            >
              {day.toLocaleDateString("en-IN", { weekday: "short" })}<br />
              {day.getDate()}
            </div>
          ))}
          {SLOTS.map((time) => (
            <div key={time} className="contents">
              <div className="border-b border-border p-3 text-muted-foreground">{time}</div>
              {days.map((day) => {
                const status = getSlotStatus(day, time);
                const isClickable = status === "available";
                return (
                  <div
                    key={`${time}-${day.toISOString()}`}
                    role={isClickable ? "button" : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    aria-label={
                      status === "available"
                        ? `Available slot ${time} on ${day.toLocaleDateString("en-IN")}`
                        : status === "booked"
                          ? "Booked"
                          : status === "past"
                            ? "This time has passed"
                            : "Not available"
                    }
                    onClick={() => handleSlotClick(day, time)}
                    onKeyDown={(e) => {
                      if (isClickable && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        handleSlotClick(day, time);
                      }
                    }}
                    title={
                      status === "booked"
                        ? "Booked"
                        : status === "past"
                          ? "This time has passed"
                          : status === "available"
                            ? "Click to book"
                            : "Not available"
                    }
                    className={`border-b border-l border-border p-3 ${
                      status === "booked"
                        ? "bg-muted text-muted-foreground line-through"
                        : status === "available"
                          ? "bg-green-900/30 text-green-400 cursor-pointer hover:bg-green-900/50"
                          : status === "past"
                            ? "opacity-50 pointer-events-none bg-white/5 text-white/25"
                            : "bg-[#1A1A1A]"
                    } ${reduced ? "" : "transition-colors duration-150"}`}
                  >
                    {status === "available" ? "Open" : "\u2014"}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
