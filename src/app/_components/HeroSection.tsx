"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScrollButton } from "./ScrollButton";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const heroVideo = "https://cdn.sceneai.art/Flawers/0fd3804f-c1dd-4759-b121-d1e1ce3be548.mp4";

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reducedMotion]);

  return (
    <section id="hero" className="relative min-h-[100dvh] overflow-hidden bg-black text-white">
      {/* Video background with parallax */}
      <div
        className="absolute inset-0 will-change-transform"
        style={reducedMotion ? undefined : { transform: `translate3d(0, ${Math.min(scrollY * 0.12, 72)}px, 0) scale(1.04)` }}
      >
        <video src={heroVideo} autoPlay muted loop playsInline preload="auto" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      </div>

      {/* Top gradient fade — blends into black above */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/60 to-transparent z-[1] pointer-events-none" />

      {/* Bottom gradient fade — blends into black below */}
      <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-black via-black/60 to-transparent z-[1] pointer-events-none" />

      {/* Subtle overlay for contrast */}
      <div className="absolute inset-0 bg-black/20 z-[1] pointer-events-none" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1500px] flex-col px-6 py-6 sm:px-10 lg:px-16">
        <div className="flex flex-1 flex-col justify-center">
          <div className="max-w-4xl">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-white/60 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_0_5px_rgba(91,79,233,0.25)]" />
              Real guidance, from people who have done it
            </p>
            <h1 className="text-6xl leading-[.94] tracking-tight font-semibold sm:text-7xl md:text-8xl lg:text-[6.5rem]">
              A clearer path <span className="text-accent">to what comes next.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
              Meet verified JBCN alumni who can help you choose universities, shape applications, and make your next big decision with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/browse"><Button variant="accent" className="h-12 rounded-full px-6 text-base">Find your mentor <ArrowRight size={16} className="ml-2" /></Button></Link>
              <ScrollButton target="how-it-works" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-white/10 pb-2 pt-5">
          <span className="text-xs text-white/30 max-sm:hidden">JBCN alumni network · Mumbai to the world</span>
        </div>
      </div>
    </section>
  );
}
