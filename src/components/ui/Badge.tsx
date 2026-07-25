import { cn } from "@/lib/utils";
export function Badge({ children, className, tone = "neutral" }: { children: React.ReactNode; className?: string; tone?: "neutral" | "accent" | "success" | "danger" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        tone === "accent" && "bg-coral/15 text-coral",
        tone === "success" && "bg-[#16A34A]/15 text-[#4ADE80]",
        tone === "danger" && "bg-red-500/15 text-red-400",
        tone === "neutral" && "bg-white/[0.06] text-white/70",
        className
      )}
    >
      {children}
    </span>
  );
}
