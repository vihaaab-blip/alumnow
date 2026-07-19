"use client";
import { useState } from "react";
import { Filter, ChevronDown, Check } from "lucide-react";

const RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "This year", days: 365 },
];

export function DateRangeFilter({ onChange }: { onChange: (days: number) => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{ label: string; days: number }>({ label: "Last 30 days", days: 30 });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-[10px] border border-[var(--border-subtle)] bg-white px-3 h-8 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-medium)] transition-colors focus-ring"
      >
        <Filter size={13} /> {selected.label} <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-44 rounded-[12px] border border-[var(--border-subtle)] bg-white shadow-[var(--shadow-lg)] p-1.5 z-20">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => { setSelected(r); onChange(r.days); setOpen(false); }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-[8px] text-[13px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                {r.label}
                {selected.label === r.label && <Check size={14} className="text-[var(--accent)]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
