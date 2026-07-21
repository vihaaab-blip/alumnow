"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, UserRound, Menu, X } from "lucide-react";
import { useSession, signOut } from "@/hooks/useSession";
import { Logo } from "@/components/Logo";

export function DockNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  const links = [
    { href: "/browse", label: "Marketplace" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/5 shadow-sm"
          : "bg-[#0D0D0D]/85 backdrop-blur-sm border-b border-white/3"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Logo className="text-[17px]" />

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                pathname === link.href ||
                pathname.startsWith(link.href + "/")
                  ? "text-coral bg-coral/10"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
              {(pathname === link.href ||
                pathname.startsWith(link.href + "/")) && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-coral"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {session?.user ? (
            <>
              <Link
                href="/account"
                className={`text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 ${
                  pathname === "/account"
                    ? "text-coral bg-coral/10"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <UserRound size={14} />
                {session.user.name ?? "Account"}
              </Link>
              {(session.user as any).role === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => signOut({ redirectTo: "/" })}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-white/70 hover:text-coral transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold text-[#0D0D0D] bg-white px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-white/50 hover:text-white transition-colors"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden border-t border-white/5 bg-[#0D0D0D]/98 backdrop-blur-md"
          >
            <div className="px-6 py-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    pathname === link.href
                      ? "text-coral bg-coral/10"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-white/5" />

              {session?.user ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className={`px-3 py-2.5 text-sm rounded-lg flex items-center gap-2 ${
                      pathname === "/account"
                        ? "text-coral bg-coral/10"
                        : "text-white/50 hover:bg-white/5"
                    }`}
                  >
                    <UserRound size={14} /> {session.user.name ?? "Account"}
                  </Link>
                  {(session.user as any).role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2.5 text-sm text-white/50 rounded-lg hover:bg-white/5"
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut({ redirectTo: "/" });
                      setMobileOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm text-white/50 rounded-lg hover:bg-white/5 flex items-center gap-2"
                  >
                    <LogOut size={14} /> Log out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center text-sm font-semibold text-white py-2.5 rounded-lg border border-white/10"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center text-sm font-semibold text-[#0D0D0D] bg-white py-2.5 rounded-lg hover:bg-white/90"
                  >
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
