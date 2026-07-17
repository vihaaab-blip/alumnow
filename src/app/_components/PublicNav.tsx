"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";

const sections = ["hero", "how-it-works"];

export function PublicNav() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-80px 0px -50% 0px" }
    );
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  if (session?.user) return null;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 transition-[background-color,box-shadow] duration-200 ${
        scrolled
          ? "bg-[#0D0D0D]/95 backdrop-blur-md shadow-sm border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <button
            onClick={() => jump("how-it-works")}
            className={`${
              active === "how-it-works"
                ? "text-white border-b-2 border-coral"
                : "text-white/50 hover:text-white"
            }`}
          >
            How it works
          </button>
          <Link href="/about" className="text-white/50 hover:text-white">
            About
          </Link>
          <Link href="/apply" className="text-white/50 hover:text-white">
            For alumni
          </Link>
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/login"
            className="text-sm font-semibold text-white/70 hover:text-coral transition-colors"
          >
            Log in
          </Link>
          <Link href="/register">
            <Button variant="accent">Find your mentor</Button>
          </Link>
        </div>
        <button
          className="rounded-md p-2 text-white/50 md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-white/5 bg-[#0D0D0D]/98 backdrop-blur-md px-6 py-4 space-y-3">
          <button
            onClick={() => jump("how-it-works")}
            className="block w-full text-left text-sm text-white/60 hover:text-white py-2"
          >
            How it works
          </button>
          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className="block text-sm text-white/60 hover:text-white py-2"
          >
            About
          </Link>
          <Link
            href="/apply"
            onClick={() => setOpen(false)}
            className="block text-sm text-white/60 hover:text-white py-2"
          >
            For alumni
          </Link>
          <hr className="border-white/5" />
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="block text-sm font-semibold text-white/70 py-2"
          >
            Log in
          </Link>
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="block text-sm font-semibold text-white py-2"
          >
            Get started
          </Link>
        </div>
      )}
    </header>
  );
}
