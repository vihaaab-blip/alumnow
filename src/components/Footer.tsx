"use client";
import Link from "next/link";
import { useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import Hls from "hls.js";

const HLS_SRC =
  "https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8";

function CtaSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(HLS_SRC);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HLS_SRC;
    }
  }, []);

  return (
    <section className="relative py-32 px-6 md:px-16 lg:px-24 text-center overflow-hidden">
      {/* Background HLS Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Top fade */}
      <div
        className="absolute top-0 left-0 right-0 z-[1] pointer-events-none"
        style={{ height: "200px", background: "linear-gradient(to bottom, black, transparent)" }}
      />
      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[1] pointer-events-none"
        style={{ height: "200px", background: "linear-gradient(to top, black, transparent)" }}
      />

      {/* Content */}
      <div className="relative z-10">
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading italic text-white tracking-tight leading-[0.85] max-w-3xl mx-auto mb-4">
          Your next chapter starts here.
        </h2>
        <p className="text-white/60 font-body font-light text-sm md:text-base max-w-xl mx-auto mb-8">
          Book a free strategy call. See what AI&#8209;powered alumni mentoring can do. No commitment, no pressure. Just possibilities.
        </p>
        <div className="flex items-center justify-center gap-6">
          <Link
            href="/browse"
            className="liquid-glass-strong rounded-full px-6 py-3 text-sm font-medium text-white flex items-center gap-2 hover:bg-white/10 transition-all font-body"
          >
            Find a mentor
            <ArrowUpRight className="h-5 w-5" />
          </Link>
          <Link
            href="/apply"
            className="bg-white text-black rounded-full px-6 py-3 text-sm font-medium flex items-center gap-2 hover:bg-white/90 transition-colors font-body"
          >
            Become a mentor
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-32 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold tracking-[-0.03em] text-white">
            Alum<span className="text-accent">Now</span>
            <sup className="ml-0.5 text-xs text-white/30">&reg;</sup>
          </Link>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Contact"].map((label) => (
              <Link
                key={label}
                href={`/${label.toLowerCase()}`}
                className="text-white/40 hover:text-white/70 font-body font-light text-xs transition-colors"
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
    <footer className="bg-black text-white border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-xl font-bold tracking-[-0.03em] text-white">
            Alum<span className="text-accent">Now</span>
            <sup className="ml-0.5 text-xs text-white/30">&reg;</sup>
          </Link>
          <div className="flex gap-5 text-xs text-white/35">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <a href="mailto:hello@alumnow.com" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
        <div className="mt-8 border-t border-white/5 pt-6 text-xs text-white/25">
          <p>&copy; 2026 AlumNow. All rights reserved.</p>
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
    <footer className="relative bg-black">
      <CtaSection />
    </footer>
  );
}
