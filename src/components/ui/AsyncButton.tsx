"use client";
import { useState } from "react";
import { Button } from "./Button";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "success";

export function AsyncButton({ onAction, children, className, ...props }: {
  onAction: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
} & Omit<React.ComponentProps<typeof Button>, "onClick">) {
  const [status, setStatus] = useState<Status>("idle");

  const handleClick = async () => {
    if (status !== "idle") return;
    setStatus("loading");
    try {
      await onAction();
      setStatus("success");
      setTimeout(() => setStatus("idle"), 1200);
    } catch {
      setStatus("idle");
    }
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      disabled={status !== "idle"}
      className={cn("relative overflow-hidden", className)}
    >
      <span
        className="flex items-center gap-2 transition-transform duration-200"
        style={{ transform: status === "idle" ? "translateY(0)" : "translateY(-24px)", opacity: status === "idle" ? 1 : 0 }}
      >
        {children}
      </span>
      {status === "loading" && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={16} className="animate-spin" />
        </span>
      )}
      {status === "success" && (
        <span className="absolute inset-0 flex items-center justify-center animate-[stagger-in_var(--dur-fast)_var(--ease-spring)_both]">
          <Check size={16} />
        </span>
      )}
    </Button>
  );
}
