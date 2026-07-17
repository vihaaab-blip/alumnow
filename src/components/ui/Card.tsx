import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({
  className,
  interactive = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-white/5 bg-white/[0.03] shadow-sm",
        interactive &&
          "transition-[box-shadow,transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-coral/20 hover:shadow-md",
        className
      )}
      {...props}
    />
  );
}
