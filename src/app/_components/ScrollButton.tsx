"use client";
import { ArrowDown } from "lucide-react";
import { ScrollSmoother } from "@/lib/gsap";

export function ScrollButton({
  target = "how-it-works",
}: {
  target?: string;
}) {
  return (
    <button
      onClick={() => {
        const el = document.getElementById(target);
        if (!el) return;
        const smoother = ScrollSmoother.get();
        if (smoother) smoother.scrollTo(el, true, "top top");
        else el.scrollIntoView({ behavior: "smooth" });
      }}
      className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
    >
      See how it works
      <ArrowDown size={16} />
    </button>
  );
}
