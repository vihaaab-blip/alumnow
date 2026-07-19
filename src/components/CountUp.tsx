"use client";
import { useEffect, useRef, useState } from "react";

export function CountUp({ value, decimals = 0, duration = 900 }: { value: number; decimals?: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const start = prevValue.current;
    if (start === value) return;
    const change = value - start;
    const startTime = performance.now();

    let raf: number;
    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + change * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else prevValue.current = value;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{display.toFixed(decimals)}</>;
}
