"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut, UserRound, Shield, ArrowRight } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "./ui/Button";
import { Logo } from "./Logo";

/**
 * Liquid-glass navbar.
 *
 * How the effect is built (no WebGL needed, cheaper and more reliable):
 * 1. Backdrop blur + saturate for the frosted base (glass-liquid class, CSS below).
 * 2. An SVG feDisplacementMap filter applied to the glass layer using a fractal-noise
 *    map, which bends/refracts whatever is behind it - this is what makes it read as
 *    "glass" rather than flat frosted plastic.
 * 3. A soft specular highlight that drifts slowly left-to-right on a loop, mimicking
 *    the way light catches curved glass.
 * 4. A hairline gradient border to fake the edge refraction/rim light real glass has.
 *
 * All of it is GPU-cheap: one filter, one blur, one animated gradient. No canvas,
 * no WebGL context, so it won't fight with anything else on the page for GPU memory.
 */

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/browse" as const, label: "Marketplace" },
    { href: "/dashboard" as const, label: "Dashboard" },
    { href: "/about" as const, label: "About" },
  ];

  const userLinks: { href: "/admin"; label: string }[] = [];
  if (session?.user && (session.user as any).role === "admin") userLinks.push({ href: "/admin", label: "Admin" });

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 px-4">
      {/* SVG filter definitions - invisible, just supplies the displacement map used below */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <filter id="glass-distortion" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.012"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="2" result="blurredNoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blurredNoise"
              scale="18"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div
        ref={navRef}
        className={`liquid-glass-nav relative flex items-center justify-between w-full max-w-4xl px-5 py-2.5 rounded-full transition-all duration-500 ease-out ${
          scrolled ? "liquid-glass-nav--scrolled text-primary" : "text-white"
        }`}
      >
        {/* distortion layer: sits behind content, refracts whatever is under the navbar */}
        <div className="liquid-glass-distortion" aria-hidden="true" />
        {/* tint + blur layer */}
        <div className="liquid-glass-tint" aria-hidden="true" />
        {/* moving specular highlight */}
        <div className="liquid-glass-sheen" aria-hidden="true" />
        {/* hairline rim light border */}
        <div className="liquid-glass-edge" aria-hidden="true" />

        <Link href="/" className="relative z-10">
          <Logo className="text-lg" />
        </Link>

        <nav className="relative z-10 hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                isActive(link.href)
                  ? scrolled ? "bg-primary/10 text-primary" : "bg-white/15 text-white"
                  : scrolled ? "text-muted-foreground hover:text-primary hover:bg-primary/5" : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="relative z-10 hidden md:flex items-center gap-2">
          {session?.user ? (
            <>
              <span className={`flex items-center gap-1.5 text-sm ${scrolled ? "text-muted-foreground" : "text-white/80"}`}>
                <UserRound size={15} />
                {session.user.name ?? "Account"}
              </span>
              {userLinks.map((link) => (
                <Link key={link.href} href={link.href} className={`flex items-center gap-1 text-sm ${scrolled ? "text-muted-foreground hover:text-primary" : "text-white/70 hover:text-white"}`}>
                  <Shield size={15} />{link.label}
                </Link>
              ))}
              <button onClick={() => signOut({ redirectTo: "/" })} className={`p-1.5 text-sm ${scrolled ? "text-muted-foreground hover:text-primary" : "text-white/70 hover:text-white"}`}>
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={`text-sm font-semibold px-3 py-1.5 ${scrolled ? "text-primary" : "text-white"}`}>
                Log in
              </Link>
              <Link href="/register">
                <Button variant={scrolled ? "accent" : "outline"} className={`rounded-full text-sm px-5 py-1.5 ${!scrolled && "border-white/30 text-white hover:bg-white/15"}`}>
                  Get started <ArrowRight size={14} className="ml-1" />
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
          className={`relative z-10 rounded-full p-2 md:hidden ${scrolled ? "text-primary hover:bg-primary/5" : "text-white hover:bg-white/10"}`}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-4 right-4 mt-2 md:hidden">
          <div className="liquid-glass-sheet rounded-2xl p-4">
            <div className="liquid-glass-distortion" aria-hidden="true" />
            <div className="liquid-glass-tint" aria-hidden="true" />
            <nav className="relative z-10 flex flex-col gap-1">
              {links.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(link.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`}>
                  {link.label}
                </Link>
              ))}
              {userLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5">
                  <Shield size={15} />{link.label}
                </Link>
              ))}
              <hr className="my-2 border-border/50" />
              {session?.user ? (
                <button onClick={() => { signOut({ redirectTo: "/" }); setOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5">
                  <LogOut size={15} /> Log out
                </button>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link href="/login" onClick={() => setOpen(false)}
                    className="flex-1 text-center text-sm font-semibold text-primary py-2.5 rounded-lg border border-border/50">
                    Log in
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)}
                    className="flex-1 text-center text-sm font-semibold text-white bg-primary py-2.5 rounded-lg">
                    Get started
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}

      <style jsx global>{`
        .liquid-glass-nav {
          overflow: hidden;
          isolation: isolate;
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.18),
            0 1px 1px rgba(255, 255, 255, 0.4) inset,
            0 -1px 1px rgba(0, 0, 0, 0.08) inset;
        }

        .liquid-glass-distortion {
          position: absolute;
          inset: 0;
          z-index: 0;
          backdrop-filter: url(#glass-distortion) blur(3px);
          -webkit-backdrop-filter: blur(3px);
        }

        .liquid-glass-tint {
          position: absolute;
          inset: 0;
          z-index: 1;
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.14),
            rgba(255, 255, 255, 0.04)
          );
          transition: background 0.5s ease;
        }

        .liquid-glass-nav--scrolled .liquid-glass-tint {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.55),
            rgba(255, 255, 255, 0.32)
          );
        }

        .liquid-glass-sheen {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent 20%,
            rgba(255, 255, 255, 0.35) 45%,
            rgba(255, 255, 255, 0.55) 50%,
            rgba(255, 255, 255, 0.35) 55%,
            transparent 80%
          );
          background-size: 260% 100%;
          background-position: 100% 0;
          animation: liquid-sheen 7s ease-in-out infinite;
          mix-blend-mode: overlay;
        }

        @keyframes liquid-sheen {
          0% { background-position: 140% 0; }
          50% { background-position: -40% 0; }
          100% { background-position: 140% 0; }
        }

        .liquid-glass-edge {
          position: absolute;
          inset: 0;
          z-index: 3;
          border-radius: inherit;
          pointer-events: none;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.7),
            rgba(255, 255, 255, 0.05) 30%,
            rgba(255, 255, 255, 0.05) 70%,
            rgba(255, 255, 255, 0.5)
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        .liquid-glass-sheet {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          background: rgba(255, 255, 255, 0.55);
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.2),
            0 1px 1px rgba(255, 255, 255, 0.5) inset;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        @media (prefers-reduced-motion: reduce) {
          .liquid-glass-sheen {
            animation: none;
            background-position: 50% 0;
          }
        }

        @supports not (backdrop-filter: blur(1px)) {
          .liquid-glass-tint {
            background: rgba(20, 20, 25, 0.85);
          }
          .liquid-glass-nav--scrolled .liquid-glass-tint {
            background: rgba(255, 255, 255, 0.92);
          }
        }
      `}</style>
    </header>
  );
}
