import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { interactive?: boolean }>(function Card({
  className,
  interactive = false,
  ...props
}, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-[14px] border border-white/[0.07] bg-[#141416] shadow-[0_1px_2px_rgba(0,0,0,0.4)]",
        interactive &&
          "transition-[box-shadow,transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-coral/25 hover:shadow-[0_8px_24px_rgba(0,0,0,0.45)]",
        className
      )}
      {...props}
    />
  );
});
