import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";

export function AdminStatCard({ label, value, detail, change, changeType, href }: {
  label: string
  value: string | number
  detail?: string
  change?: string
  changeType?: "increase" | "decrease"
  href?: string
}) {
  const inner = (
    <Card className={`border-l-4 border-l-accent p-5 ${href ? "transition-colors hover:bg-white/[0.03]" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="font-mono text-3xl font-semibold text-primary">{value}</p>
        {change && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${changeType === "increase" ? "text-green-600" : "text-red-600"}`}>
            {changeType === "increase" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>
      {detail && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}
    </Card>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
