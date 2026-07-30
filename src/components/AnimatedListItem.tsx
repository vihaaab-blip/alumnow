"use client";
import { useState, useRef, useEffect } from "react";

export function AnimatedListItem({ children, isRemoving, onRemoved }: { children: React.ReactNode; isRemoving: boolean; onRemoved: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useEffect(() => {
    if (isRemoving && ref.current) {
      setHeight(ref.current.offsetHeight);
      requestAnimationFrame(() => setHeight(0));
      const timer = setTimeout(onRemoved, 320);
      return () => clearTimeout(timer);
    }
  }, [isRemoving, onRemoved]);

  return (
    <div
      style={{
        height,
        overflow: "hidden",
        opacity: isRemoving ? 0 : 1,
        transform: isRemoving ? "scale(0.97)" : "scale(1)",
        transition: "height var(--dur-base) var(--ease-in-out-quart), opacity var(--dur-fast) ease-out, transform var(--dur-base) var(--ease-out-expo)",
      }}
      ref={ref}
    >
      {children}
    </div>
  );
}
