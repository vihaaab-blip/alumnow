"use client";

import { useEffect, useState } from "react";
import {
  Compass,
  MessageCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import Link from "next/link";

export function SectionBridge() {
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = document.getElementById("how-it-works");
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible && !reducedMotion) return;

    const timer = setInterval(() => {
      setStage((s) => (s < 3 ? s + 1 : s));
    }, 200);

    const clear = () => clearInterval(timer);
    if (reducedMotion) {
      setStage(3);
      clear();
    }

    setTimeout(() => clear(), 600);
    return () => clearInterval(timer);
  }, [visible, reducedMotion]);

  const show = (index: number) => {
    if (reducedMotion) return true;
    return visible && stage >= index;
  };

  return (
    <section
      id="how-it-works"
      aria-label="From search to conversation"
      className="relative overflow-hidden bg-[#0D0D0D] text-white"
    >
      {/* Section dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

      {/* Ambient glow */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[900px] rounded-full bg-coral/5 blur-[140px] pointer-events-none" />

      {/* Decorative grid lines — subtle */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative mx-auto max-w-[1500px] px-6 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-36">
        {/* Header group */}
        <div className="max-w-4xl">
          <span
            className={`inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/30 transition-all duration-700 ${
              show(0)
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
            style={{
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <span className="inline-block h-3 w-[1px] bg-coral/40" />
            How it works
          </span>

          <h2
            className={`mt-5 text-[clamp(2.2rem,6vw,4.8rem)] leading-[0.92] tracking-[-0.04em] font-bold font-heading text-white transition-all duration-700 delay-75 ${
              show(0)
                ? "translate-y-0 opacity-100"
                : "translate-y-5 opacity-0"
            }`}
            style={{
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            The search should not end at a page.
            <br />
            <span className="text-coral text-glow-coral">
              It should open a conversation.
            </span>
          </h2>

          <p
            className={`mt-5 max-w-[50ch] text-[clamp(0.95rem,1.3vw,1.1rem)] leading-[1.7] text-white/40 font-light transition-all duration-700 delay-100 ${
              show(0)
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
            style={{
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            Every graduate carries answers students are still searching for.
            alumnow closes that gap with a single, honest call.
          </p>
        </div>

        {/* Steps — staggered asymmetric layout */}
        <div className="mt-16 lg:mt-24 space-y-14 lg:space-y-20">
          {/* Step 01 — left */}
          <div
            className={`relative transition-all duration-800 ${
              show(1)
                ? "translate-x-0 opacity-100"
                : "-translate-x-8 opacity-0"
            }`}
            style={{
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDuration: "800ms",
            }}
          >
            <StepCard
              number="01"
              icon={Compass}
              title="Start with context"
              body="Find an alumnus who took the same path — the same university shortlist, the same career fork. Their context is the map you need."
              accent="coral"
            />
          </div>

          {/* Step 02 — right offset */}
          <div
            className={`relative lg:ml-12 xl:ml-20 transition-all duration-800 ${
              show(2)
                ? "translate-x-0 opacity-100"
                : "translate-x-8 opacity-0"
            }`}
            style={{
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDuration: "800ms",
            }}
          >
            <StepCard
              number="02"
              icon={MessageCircle}
              title="Have the real conversation"
              body="Ask what a brochure will never tell you: the day-to-day reality, the surprising trade-offs, the things they wish they knew before choosing."
              accent="amber"
            />
          </div>

          {/* Step 03 — left */}
          <div
            className={`relative transition-all duration-800 ${
              show(3)
                ? "translate-x-0 opacity-100"
                : "-translate-x-8 opacity-0"
            }`}
            style={{
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDuration: "800ms",
            }}
          >
            <StepCard
              number="03"
              icon={Sparkles}
              title="Leave with direction"
              body="Turn one honest conversation into one clear next step — whether that's a university, a major, an internship, or simply knowing which door to open first."
              accent="green"
            />
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          className={`mt-14 lg:mt-20 flex items-center justify-center transition-all duration-700 delay-500 ${
            show(3) ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <Link
            href="/browse"
            className="group inline-flex h-12 items-center gap-2.5 rounded-full border border-white/[0.12] px-6 text-sm font-semibold text-white/70 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.03] hover:text-white"
          >
            Browse verified alumni
            <ArrowRight
              size={15}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Step Card Component ─────────────────────────────────────── */
function StepCard({
  number,
  icon: Icon,
  title,
  body,
  accent,
}: {
  number: string;
  icon: React.ElementType;
  title: string;
  body: string;
  accent: "coral" | "amber" | "green";
}) {
  const accentMap = {
    coral:
      "from-[#e8573a]/25 via-[#e8573a]/10 to-transparent",
    amber:
      "from-[#d97706]/25 via-[#d97706]/10 to-transparent",
    green:
      "from-[#16a34a]/25 via-[#16a34a]/10 to-transparent",
  };

  const dotMap = {
    coral: "bg-coral shadow-[0_0_0_4px_rgba(232,87,58,0.12)]",
    amber: "bg-amber-500 shadow-[0_0_0_4px_rgba(217,119,6,0.12)]",
    green: "bg-green-500 shadow-[0_0_0_4px_rgba(22,163,74,0.12)]",
  };

  return (
    <article className="group relative overflow-hidden rounded-[20px] border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 sm:p-8 lg:p-10 transition-all duration-500 hover:border-white/[0.12] hover:shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
      {/* Accent gradient — diagonal corner */}
      <div
        className={`pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br opacity-60 blur-[80px] ${accentMap[accent]}`}
      />

      {/* Top accent bar */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${accentMap[accent]}`}
      />

      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        {/* Number badge */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
          <span className="font-heading text-lg font-bold tracking-tight text-white/80">
            {number}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${dotMap[accent]}`}
            >
              <Icon size={15} className="text-white" />
            </div>
            <h3 className="font-heading text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
              {title}
            </h3>
          </div>
          <p className="text-sm leading-[1.7] text-white/40 sm:text-[15px] max-w-[55ch] font-light">
            {body}
          </p>
        </div>
      </div>
    </article>
  );
}
