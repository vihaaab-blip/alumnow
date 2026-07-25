import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

export function AdminStatCard({ label, value, detail, change, changeType, href, icon: Icon, tint = "coral" }: {
  label: string
  value: string | number
  detail?: string
  change?: string
  changeType?: "increase" | "decrease"
  href?: string
  icon?: LucideIcon
  tint?: "coral" | "blue" | "green" | "amber"
}) {
  const tints: Record<string, { bg: string; text: string }> = {
    coral: { bg: "bg-coral/12", text: "text-coral" },
    blue: { bg: "bg-[#3B82F6]/12", text: "text-[#60A5FA]" },
    green: { bg: "bg-[#16A34A]/12", text: "text-[#4ADE80]" },
    amber: { bg: "bg-[#D97706]/12", text: "text-[#FBBF24]" },
  };
  const t = tints[tint] ?? tints.coral!;

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
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${changeType === "increase" ? "text-[#4ADE80]" : "text-red-400"}`}>
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
