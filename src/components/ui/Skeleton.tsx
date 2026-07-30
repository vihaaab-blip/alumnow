import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-white/[0.06] bg-[length:200%_100%]",
        className
      )}
      style={{ animation: "shimmer 1.6s ease-in-out infinite" }}
    />
  );
}
