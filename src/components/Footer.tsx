"use client";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4";
const GRASS_SRC =
  "https://res.cloudinary.com/dy5er7kv5/image/upload/q_auto/f_auto/v1780586778/cta-bg_mlwy5s.png";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}

interface FadeUpProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}
function FadeUp({ children, delay = 0, y = 24, className }: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedText({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-flex overflow-hidden h-[1.2em]">
      <span className="group-hover:-translate-y-full transition-transform duration-200 ease-in-out">
        {children}
      </span>
      <span className="absolute top-full group-hover:-translate-y-full transition-transform duration-200 ease-in-out">
        {children}
      </span>
    </span>
  );
}

interface PrimaryButtonProps {
  as?: "a" | "button";
  href?: string;
  children: React.ReactNode;
  className?: string;
}
function PrimaryButton({ as: Tag = "a", href, children, className = "" }: PrimaryButtonProps) {
  const cls =
    "group inline-flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-black h-12 px-9 text-sm font-medium leading-none transition-colors " +
    className;
  if (Tag === "button") {
    return (
      <button type="button" className={cls}>
        <AnimatedText>{children}</AnimatedText>
      </button>
    );
  }
  return (
    <a href={href} className={cls}>
      <AnimatedText>{children}</AnimatedText>
    </a>
  );
}

function AlumNowHeroPreview() {
  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-2xl"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <video
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 z-[1]" />

      <div className="relative z-10 flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
        <span className="text-white text-sm sm:text-base md:text-lg font-bold tracking-[-0.03em]">
          Alum<span className="text-accent">Now</span>
        </span>
        <div className="hidden md:flex items-center gap-4 text-[9px] lg:text-[10px] text-white/50">
          {["Home", "Mentors", "About", "Blog", "Contact"].map((l, i) => (
            <span key={l} className={i === 0 ? "text-white" : "hover:text-white cursor-default transition-colors"}>
              {l}
            </span>
          ))}
        </div>
        <span className="liquid-glass rounded-full px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] text-white">
          Find mentor
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-3 sm:px-4 pt-3 sm:pt-5 md:pt-7 pb-6">
        <h1
          className="animate-fade-rise font-semibold leading-[0.95] tracking-[-0.03em] text-white text-lg sm:text-2xl md:text-3xl lg:text-4xl max-w-[90%]"
        >
          Where alumni wisdom <em className="not-italic text-white/50">meets your next chapter.</em>
        </h1>
        <p className="animate-fade-rise-delay text-white/50 text-[9px] sm:text-[11px] md:text-xs leading-relaxed max-w-[80%] sm:max-w-sm md:max-w-md mt-2 sm:mt-3 md:mt-4">
          Real conversations with verified JBCN alumni who&apos;ve been exactly where you are. Book a call, ask anything.
        </p>
        <button className="animate-fade-rise-delay-2 liquid-glass rounded-full px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 md:py-2.5 text-[9px] sm:text-[10px] text-white mt-3 sm:mt-4 md:mt-5 hover:bg-white/10 transition-colors">
          Find a mentor
        </button>
      </div>
    </div>
  );
}

function CtaDashboardMock() {
  return (
    <div className="liquid-glass w-full max-w-[1100px] aspect-[3/4] sm:aspect-[16/10] lg:aspect-[16/9] rounded-2xl mx-auto overflow-hidden p-2 sm:p-3">
      <div className="h-full">
        <AlumNowHeroPreview />
      </div>
    </div>
  );
}

function CtaSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const dashboardY = useTransform(scrollYProgress, [0, 1], ["120px", "-120px"]);
  const grassY = useTransform(
    scrollYProgress,
    [0, 1],
    isMobile ? ["80px", "-40px"] : ["200px", "-200px"]
  );

  return (
    <section
      ref={sectionRef}
      id="cta"
      className="relative w-full overflow-hidden bg-black"
    >
      <div className="relative mx-auto max-w-[1080px] px-4 sm:px-6 pt-24 sm:pt-32 md:pt-40 pb-[440px] sm:pb-[520px] md:pb-[440px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-start">
          <div className="relative z-20 max-w-[400px]">
            <FadeUp delay={0.05}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/30 mb-6">
                Built for you
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-[-0.02em] leading-[1.05] text-white">
                Built for the conversation after the search.
              </h2>
            </FadeUp>
            <FadeUp delay={0.15}>
              <p className="mt-6 text-white/55 text-base sm:text-lg leading-[1.6] max-w-[380px]">
                Honest alumni guidance, thoughtful design, and a calmer way to make the next move.
              </p>
            </FadeUp>
            <FadeUp delay={0.25}>
              <div className="mt-6 flex flex-wrap gap-3">
                {["Verified mentors", "Video sessions", "Personal guidance"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </FadeUp>
            <FadeUp delay={0.35} className="mt-10">
              <PrimaryButton as="a" href="/browse">
                Find your mentor
              </PrimaryButton>
            </FadeUp>
          </div>
        </div>
      </div>

      <motion.div
        style={{ y: dashboardY }}
        className="absolute top-[440px] sm:top-[460px] md:top-[380px] lg:top-16 left-4 right-4 sm:left-auto sm:-right-[8%] md:-right-[10%] lg:-right-[12%] z-10 sm:w-[85%] md:w-[80%] lg:w-[68%]"
      >
        <CtaDashboardMock />
      </motion.div>

      <motion.img
        src={GRASS_SRC}
        alt=""
        aria-hidden
        style={{ y: grassY }}
        className="pointer-events-none select-none absolute left-0 right-0 bottom-[-40px] sm:bottom-[-80px] lg:bottom-[-140px] w-full z-30 object-cover"
      />
    </section>
  );
}

function FooterBar() {
  return (
    <div className="relative z-40 w-full bg-black">
      <div className="mx-auto max-w-[1080px] px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-10 items-start">
          <div>
            <Link href="/" className="text-2xl font-bold tracking-[-0.03em] text-white">
              Alum<span className="text-accent">Now</span>
              <sup className="ml-0.5 text-xs text-white/30">®</sup>
            </Link>
            <p className="mt-3 text-sm text-white/35 max-w-[260px] leading-relaxed">
              One thoughtful step at a time.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/25 mb-5">
              Navigate
            </p>
            <div className="grid gap-3 text-sm text-white/55">
              <Link href="/browse" className="hover:text-white transition-colors">Find a mentor</Link>
              <Link href="/apply" className="hover:text-white transition-colors">Become a mentor</Link>
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/25 mb-5">
              Legal
            </p>
            <div className="grid gap-3 text-sm text-white/55">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/25">
          <p>&copy; 2026 AlumNow. Built for the next chapter.</p>
          <p>From search to certainty.</p>
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (!isHome) {
    return (
      <footer className="bg-black text-white border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-xl font-bold tracking-[-0.03em] text-white">
              Alum<span className="text-accent">Now</span>
              <sup className="ml-0.5 text-xs text-white/30">®</sup>
            </Link>
            <div className="flex gap-5 text-xs text-white/35">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <a href="mailto:hello@alumnow.com" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 border-t border-white/5 pt-6 text-xs text-white/25">
            <p>&copy; 2026 AlumNow. Built for the next chapter.</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative bg-black">
      <CtaSection />
      <FooterBar />
    </footer>
  );
}
