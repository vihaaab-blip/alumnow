"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";

function CtaSection() {
  return (
    <section className="relative py-32 px-6 md:px-16 lg:px-24 text-center overflow-hidden bg-[#0D0D0D]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(232,87,58,0.08),transparent_60%)]" />

      <div className="relative z-10">
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading text-white tracking-tight leading-[0.85] max-w-3xl mx-auto mb-4">
          Your next chapter starts here.
        </h2>
        <p className="text-white/40 font-body font-light text-sm md:text-base max-w-xl mx-auto mb-8">
          Book a free strategy call. See what AI&#8209;powered alumni
          mentoring can do. No commitment, no pressure. Just possibilities.
        </p>
        <div className="flex items-center justify-center gap-6">
          <Link
            href="/browse"
            className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white flex items-center gap-2 hover:bg-white/5 transition-all font-body"
          >
            Find a mentor
            <ArrowUpRight className="h-5 w-5" />
          </Link>
          <Link
            href="/apply"
            className="bg-coral text-white rounded-full px-6 py-3 text-sm font-medium flex items-center gap-2 hover:bg-coral-light transition-colors font-body"
          >
            Become a mentor
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo className="text-2xl" />
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Contact"].map((label) => (
              <Link
                key={label}
                href={`/${label.toLowerCase()}`}
                className="text-white/30 hover:text-white/60 font-body font-light text-xs transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SimpleFooter() {
  return (
    <footer className="bg-[#0D0D0D] text-white border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo className="text-xl" />
          <div className="flex gap-5 text-xs text-white/30">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <a
              href="mailto:hello@alumnow.com"
              className="hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
        <div className="mt-8 border-t border-white/5 pt-6 text-xs text-white/20">
          <p>&copy; 2026 alumnow. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export function Footer() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (!isHome) {
    return <SimpleFooter />;
  }

  return (
    <footer className="relative bg-[#0D0D0D]">
      <CtaSection />
    </footer>
  );
}
