"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScrollButton } from "./ScrollButton";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] overflow-hidden bg-[#0D0D0D] text-white"
    >
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(232,87,58,0.06),transparent_60%)]" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1500px] flex-col px-6 py-6 sm:px-10 lg:px-16">
        <div className="flex flex-1 flex-col justify-center">
          <div className="max-w-4xl">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-white/40 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-coral shadow-[0_0_0_5px_rgba(232,87,58,0.25)]" />
              Alumni-Student Connect Platform
            </p>
            <h1 className="text-6xl leading-[.94] tracking-tight font-semibold sm:text-7xl md:text-8xl lg:text-[6.5rem] font-heading">
              A clearer path{" "}
              <span className="text-coral">to what comes next.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/50 sm:text-lg">
              Meet verified alumni who can help you choose universities, shape
              applications, and make your next big decision with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/browse">
                <Button
                  variant="accent"
                  className="h-12 rounded-full px-6 text-base"
                >
                  Find your mentor{" "}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
              <ScrollButton target="how-it-works" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-white/5 pb-2 pt-5">
          <span className="text-xs text-white/20 max-sm:hidden">
            From where you are. To where you want to be.
          </span>
        </div>
      </div>
    </section>
  );
}
