import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

export function AdminStatCard({ label, value, detail, change, changeType, href, icon: Icon }: {
  label: string
  value: string | number
  detail?: string
  change?: string
  changeType?: "increase" | "decrease"
  href?: string
  icon?: LucideIcon
  tint?: "coral" | "blue" | "green" | "amber"
}) {
  // Every stat shares the same coral-on-black language — variety comes from
  // the icon and copy, not a rainbow of hues.
  const t = { bg: "bg-coral/12", text: "text-coral" };

  const inner = (
    <Card
      interactive={Boolean(href)}
      className="relative overflow-hidden p-5"
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{label}</p>
        {Icon && (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${t.bg} ${t.text}`}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <p className="font-mono text-[32px] font-bold leading-none tracking-tight text-white">{value}</p>
        {change && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${changeType === "increase" ? "text-white/70" : "text-red-400/80"}`}>
            {changeType === "increase" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>
      {detail && <p className="mt-2 text-xs text-white/35">{detail}</p>}
    </Card>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
