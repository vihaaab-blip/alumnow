"use client";
import Link from "next/link";
import { Logo } from "@/components/Logo";

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
  return <SimpleFooter />;
}
