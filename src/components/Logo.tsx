"use client";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-baseline ${className}`}>
      <span className="font-logo font-black text-white tracking-tight">
        alum
      </span>
      <span className="font-logo font-black text-coral tracking-tight">
        now.
      </span>
    </Link>
  );
}

export function LogoTagline({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-sm text-white/50 font-body ${className}`}
    >
      <span className="text-coral">From</span> where you are.{" "}
      <span className="text-coral">To</span> where you want to be.
    </p>
  );
}
