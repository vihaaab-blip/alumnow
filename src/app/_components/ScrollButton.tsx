"use client";
import { ArrowDown } from "lucide-react";
import { MetalFx } from "metal-fx";
import { ScrollSmoother } from "@/lib/gsap";

export function ScrollButton({
  target = "how-it-works",
}: {
  target?: string;
}) {
  return (
    <MetalFx preset="chromatic" strength={1} theme="dark">
      <button
        onClick={() => {
          const el = document.getElementById(target);
          if (!el) return;
          const smoother = ScrollSmoother.get();
          if (smoother) smoother.scrollTo(el, true, "top top");
          else el.scrollIntoView({ behavior: "smooth" });
        }}
        className="group inline-flex rounded-full"
      >
        <span className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition-all duration-300 group-hover:border-white/30 group-hover:bg-white/5">
          See how it works
          <ArrowDown size={16} />
        </span>
      </button>
    </MetalFx>
  );
}
