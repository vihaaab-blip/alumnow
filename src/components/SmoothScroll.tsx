"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollSmoother } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * Routes that scroll as one plain document (marketing/content pages) get GSAP
 * ScrollSmoother's inertia-smoothed scrolling. App-shell routes (network,
 * dashboard, admin, account, auth forms) intentionally build their own
 * fixed-viewport layouts with internal scroll containers — hijacking the
 * document scroll there would fight those layouts, so they're left on native
 * scroll instead of trying to force ScrollSmoother everywhere.
 */
const SMOOTH_ROUTES = new Set(["/", "/about", "/privacy", "/terms", "/contact"]);

export function SmoothScroll({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !SMOOTH_ROUTES.has(pathname)) return;
    if (!wrapperRef.current || !contentRef.current) return;

    // ScrollSmoother drives scroll via its own scrollTo/inertia loop; native
    // CSS smooth-scrolling on top of that causes double-easing/jank.
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";

    const smoother = ScrollSmoother.create({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      smooth: 1.1,
      smoothTouch: 0.1,
    });

    return () => {
      smoother.kill();
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
      gsap.ticker.tick();
    };
  }, [pathname, reducedMotion]);

  return (
    <div id="smooth-wrapper" ref={wrapperRef}>
      <div id="smooth-content" ref={contentRef} className="flex min-h-[100dvh] flex-col">
        {children}
      </div>
    </div>
  );
}
