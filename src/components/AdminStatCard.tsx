import { Sparkline } from "./Sparkline";

export function AdminStatCard({ label, value, change, changeType, icon: Icon, color = "#E8573A", sparkData = [] }: {
  label: string; value: string | number; change?: string; changeType?: "increase" | "decrease";
  icon: any; color?: string; sparkData?: number[];
}) {
  return (
    <div className="relative overflow-hidden rounded-[16px] bg-white border border-[var(--border-subtle)] p-5 shadow-[var(--shadow-xs)]">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: color }} />
      <div className="flex items-center justify-between mb-3">
        <div className="h-9 w-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: `${color}14` }}>
          <Icon size={16} style={{ color }} />
        </div>
        {change && (
          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
            changeType === "increase" ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--danger)]/10 text-[var(--danger)]"
          }`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.06em]">{label}</p>
      <div className="flex items-end justify-between mt-1.5">
        <p className="font-mono text-[28px] font-bold text-[var(--text-primary)] tracking-[-0.02em]">{value}</p>
        {sparkData.length > 0 && <Sparkline data={sparkData} color={color} />}
      </div>
    </div>
  );
}
