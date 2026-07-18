"use client";

import { useEffect, useState } from "react";
import { Compass, MessageCircle, Sparkles } from "lucide-react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const steps = [
  {
    icon: Compass,
    label: "01",
    title: "Start with context",
    body: "Find an alumnus who took the same path — the same university shortlist, the same career fork. Their context is the map you need.",
  },
  {
    icon: MessageCircle,
    label: "02",
    title: "Have the real conversation",
    body: "Ask what a brochure will never tell you: the day-to-day reality, the surprising trade-offs, the things they wish they knew before choosing.",
  },
  {
    icon: Sparkles,
    label: "03",
    title: "Leave with direction",
    body: "Turn one honest conversation into one clear next step — whether that's a university, a major, an internship, or simply knowing which door to open first.",
  },
];

export function SectionBridge() {
  const [visible, setVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.2 }
    );
    const el = document.getElementById("how-it-works");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const show = visible || reducedMotion;

  return (
    <section
      id="how-it-works"
      aria-label="From search to conversation"
      className="relative overflow-hidden bg-[#0D0D0D]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/5" />

      <div className="relative mx-auto max-w-[1500px] px-6 py-16 sm:px-10 sm:py-24 lg:px-16 lg:py-32">
        <div className="max-w-3xl">
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.34em] text-white/30 transition-all duration-500 ${
              show ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            From finding to talking
          </p>
          <h2
            className={`mt-5 text-4xl leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl font-semibold font-heading transition-all duration-500 delay-75 ${
              show ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            The search should not end at a page.
            <span className="text-coral">
              {" "}
              It should open a conversation.
            </span>
          </h2>
          <p
            className={`mt-5 max-w-2xl text-base leading-7 text-white/40 sm:text-lg transition-all duration-500 delay-100 ${
              show ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            Every graduate carries answers students are still searching for.
            AlumNow closes that gap with a single, honest call.
          </p>
        </div>

        <div className="mt-14 grid gap-4 lg:mt-20 lg:grid-cols-3">
          {steps.map(({ icon: Icon, label, title, body }, index) => (
            <article
              key={title}
              className={`rounded-2xl border border-white/5 bg-white/[0.03] p-7 transition-all duration-500 hover:-translate-y-1 ${
                show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
              style={{ transitionDelay: `${140 + index * 90}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-white/20">
                  {label}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-coral">
                  <Icon size={18} />
                </div>
              </div>
              <h3 className="mt-11 text-xl font-semibold tracking-[-0.03em] text-white">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/40">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
