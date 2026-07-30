"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, UserRound, Shield, ArrowRight } from "lucide-react";
import { useSession, signOut } from "@/hooks/useSession";
import { Button } from "./ui/Button";
import { Logo } from "./Logo";

/**
 * Primary site navigation.
 *
 * A single solid black pill that gains a hairline coral-tinted border and a
 * slightly denser background once the page scrolls — no blur, no glass, no
 * light-mode flip. The site is dark-mode only, so the nav stays dark at
 * every scroll position; "scrolled" only nudges opacity/shadow for depth.
 */

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/browse" as const, label: "Network" },
    { href: "/dashboard" as const, label: "Dashboard" },
    { href: "/about" as const, label: "About" },
  ];

  const userLinks: { href: "/admin"; label: string }[] = [];
  if (session?.user && (session.user as any).role === "admin") userLinks.push({ href: "/admin", label: "Admin" });

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 px-4">
      <div
        className={`relative flex w-full max-w-4xl items-center justify-between rounded-full border px-5 py-2.5 text-white transition-all duration-300 ease-out ${
          scrolled
            ? "border-white/10 bg-[#0D0D0D]/95 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            : "border-white/5 bg-[#0D0D0D]/70 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        }`}
      >
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
                  ? "bg-coral/15 text-coral"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="relative z-10 hidden md:flex items-center gap-2">
          {session?.user ? (
            <>
              <span className="flex items-center gap-1.5 text-sm text-white/70">
                <UserRound size={15} />
                {session.user.name ?? "Account"}
              </span>
              {userLinks.map((link) => (
                <Link key={link.href} href={link.href} className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors">
                  <Shield size={15} />{link.label}
                </Link>
              ))}
              <button onClick={() => signOut({ redirectTo: "/" })} className="p-1.5 text-sm text-white/60 hover:text-white transition-colors">
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold px-3 py-1.5 text-white/85 hover:text-white transition-colors">
                Log in
              </Link>
              <Link href="/register">
                <Button variant="accent" className="rounded-full text-sm px-5 py-1.5">
                  Get started <ArrowRight size={14} className="ml-1" />
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
          className="relative z-10 rounded-full p-2 text-white hover:bg-white/10 transition-colors md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-4 right-4 mt-2 md:hidden">
          <div className="rounded-2xl border border-white/10 bg-[#141414] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(link.href) ? "bg-coral/15 text-coral" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                  {link.label}
                </Link>
              ))}
              {userLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                  <Shield size={15} />{link.label}
                </Link>
              ))}
              <hr className="my-2 border-white/10" />
              {session?.user ? (
                <button onClick={() => { signOut({ redirectTo: "/" }); setOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                  <LogOut size={15} /> Log out
                </button>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link href="/login" onClick={() => setOpen(false)}
                    className="flex-1 text-center text-sm font-semibold text-white py-2.5 rounded-lg border border-white/15 hover:bg-white/5 transition-colors">
                    Log in
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)}
                    className="flex-1 text-center text-sm font-semibold text-white bg-coral hover:bg-coral-light transition-colors py-2.5 rounded-lg">
                    Get started
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
