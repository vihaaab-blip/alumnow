"use client";
export function GoalProgress({ current, target = 10 }: { current: number; target?: number }) {
  const pct = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);
  return (
    <div className="rounded-[16px] bg-white border border-[var(--border-subtle)] p-5 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.06em]">Monthly goal</h3>
        <span className="text-[11px] font-semibold text-[var(--text-primary)]">{current}/{target} sessions</span>
      </div>
      <div className="h-2.5 rounded-full bg-[var(--bg-card-sunken)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2.5 text-[12px] text-[var(--text-secondary)]">
        {remaining === 0 ? "Goal reached" : `${remaining} more session${remaining !== 1 ? "s" : ""} to hit your goal`}
      </p>
    </div>
  );
}
