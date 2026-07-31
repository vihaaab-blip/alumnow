"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { ScrollButton } from "./ScrollButton";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const LightPillar = dynamic(() => import("@/components/LightPillar/LightPillar"), { ssr: false });

export function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const introRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!introRef.current || reducedMotion) return;
    const targets = introRef.current.querySelectorAll("[data-hero-in]");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.12, delay: 0.1 }
      );
    }, introRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] overflow-hidden bg-[#0D0D0D] text-white"
    >
      {/* Three.js light pillar backdrop */}
      <div className="absolute inset-0">
        <LightPillar
          topColor="#F97316"
          bottomColor="#000000"
          intensity={0.6}
          rotationSpeed={0.3}
          glowAmount={0.005}
          pillarWidth={3.0}
          pillarHeight={0.4}
          noiseIntensity={0.5}
          pillarRotation={0}
          interactive={false}
          quality="medium"
          mixBlendMode="normal"
        />
      </div>

      {/* Ambient depth glow, kept subtle so it never competes with the pillar or the headline */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,0,0,0.35),transparent_45%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-[#0D0D0D]/40" />

      <style>{`
        @keyframes tagPing {
          0% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>

      <div ref={introRef} className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1500px] flex-col px-6 py-6 pt-28 sm:px-10 sm:pt-32 lg:px-16">
        <div className="flex flex-1 flex-col justify-center">
          <div className="max-w-4xl">
            <p data-hero-in className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.20em] text-white/50 sm:text-sm">
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="absolute inset-0 rounded-full bg-coral" style={{ animation: mounted ? "tagPing 2.4s ease-out infinite" : "none" }} />
                <span className="absolute inset-0 rounded-full bg-coral shadow-[0_0_0_6px_rgba(232,87,58,0.20)]" />
              </span>
              Alumni-Student Connect Platform
            </p>
            <h1
              data-hero-in
              className="text-[clamp(2.8rem,7.5vw,6.5rem)] leading-[.94] tracking-[-0.04em] font-bold font-heading text-white [text-shadow:0_2px_40px_rgba(0,0,0,0.6)]"
            >
              A clearer path to what comes next<span className="text-coral">.</span>
            </h1>
            <p data-hero-in className="mt-6 max-w-[42rem] text-[clamp(1rem,1.8vw,1.2rem)] leading-relaxed text-white/50 sm:text-lg font-light tracking-wide">
              Meet verified alumni who can help you choose universities, shape
              applications, and make your next big decision with confidence.
            </p>
            <div data-hero-in className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/browse"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-coral px-7 text-sm font-semibold text-white transition-all duration-300 hover:bg-coral-light"
              >
                Find your mentor
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <ScrollButton target="how-it-works" />
            </div>
          </div>
        </div>

        <div data-hero-in className="flex flex-col gap-5 border-t border-white/8 pb-2 pt-6 mt-8 sm:flex-row sm:items-center sm:justify-end">
          <span className="text-xs text-white/20 font-mono tracking-wider">
            From where you are. To where you want to be.
          </span>
        </div>
      </div>
    </section>
  );
}
