import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 text-sm text-white outline-none placeholder:text-white/30 transition-[border-color,box-shadow] duration-150 focus:border-coral/50 focus:ring-4 focus:ring-coral/10 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/30",
        className
      )}
      {...props}
    />
  );
}
