"use client";
import { useRouter, useSearchParams } from "next/navigation";

const PERIODS = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "All", value: "all" },
];

export function AdminPeriodSelector() {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("period") ?? "30d";

  return (
    <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => router.push(`/admin?period=${p.value}`)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            active === p.value ? "bg-coral text-white" : "text-white/40 hover:text-white hover:bg-white/5"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
