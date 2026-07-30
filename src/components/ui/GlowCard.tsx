"use client";
import { useRef } from "react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

export function GlowCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    ref.current!.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
    ref.current!.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
  };

  return (
    <Card
      ref={ref as any}
      onMouseMove={handleMouseMove}
      className={cn("relative overflow-hidden", className)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "radial-gradient(240px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(232,87,58,0.08), transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </Card>
  );
}
