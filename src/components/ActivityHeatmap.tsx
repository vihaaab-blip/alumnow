"use client";
import { useMemo } from "react";

export function ActivityHeatmap({ bookings }: { bookings: any[] }) {
  const cells = useMemo(() => {
    const days: { date: Date; count: number }[] = [];
    const today = new Date();
    for (let i = 111; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const count = bookings.filter((b: any) => {
        const t = new Date(b.scheduledStartAt);
        return t >= d && t < next && b.status === "completed";
      }).length;
      days.push({ date: d, count });
    }
    return days;
  }, [bookings]);

  const weeks = useMemo(() => {
    const w: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7));
    return w;
  }, [cells]);

  const colorFor = (count: number) => {
    if (count === 0) return "var(--bg-card-sunken)";
    if (count === 1) return "#E8573A33";
    if (count === 2) return "#E8573A77";
    return "#E8573A";
  };

  return (
    <div className="flex gap-[3px]">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((cell, di) => (
            <div
              key={di}
              title={`${cell.date.toLocaleDateString()}: ${cell.count} session${cell.count !== 1 ? "s" : ""}`}
              className="w-[10px] h-[10px] rounded-[2px] transition-colors"
              style={{ backgroundColor: colorFor(cell.count) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
