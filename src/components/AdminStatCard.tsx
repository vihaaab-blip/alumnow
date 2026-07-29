import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

export function AdminStatCard({ label, value, detail, change, changeType, href, icon: Icon, featured = false }: {
  label: string
  value: string | number
  detail?: string
  change?: string
  changeType?: "increase" | "decrease"
  href?: string
  icon?: LucideIcon
  tint?: "coral" | "blue" | "green" | "amber"
  /** The one card in the row that carries the headline number — sized and weighted differently, not just recolored. */
  featured?: boolean
}) {
  const inner = (
    <Card
      interactive={Boolean(href)}
      className={`relative overflow-hidden ${featured ? "p-6" : "p-5"} h-full flex flex-col justify-between`}
    >
      {featured && (
        <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-coral/10 blur-[50px]" />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <p className={`font-semibold uppercase tracking-wider text-white/40 ${featured ? "text-[11px]" : "text-[10px]"}`}>{label}</p>
        {Icon && (
          <span className={`flex shrink-0 items-center justify-center rounded-[10px] ${featured ? "h-10 w-10 bg-coral/15 text-coral" : "h-8 w-8 bg-white/[0.05] text-white/50"}`}>
            <Icon size={featured ? 18 : 15} />
          </span>
        )}
      </div>

      <div className="relative mt-4 flex items-baseline gap-2.5">
        <p className={`font-semibold leading-none tracking-[-0.02em] text-white tabular-nums ${featured ? "text-[40px]" : "text-[26px]"}`}>
          {value}
        </p>
        {change && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${changeType === "increase" ? "text-[#4ADE80]" : "text-[#F87171]"}`}>
            {changeType === "increase" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>
      {detail && <p className="relative mt-2 text-xs text-white/35">{detail}</p>}
    </Card>
  );

  if (href) return <Link href={href} className={featured ? "sm:row-span-2" : undefined}>{inner}</Link>;
  return inner;
}
