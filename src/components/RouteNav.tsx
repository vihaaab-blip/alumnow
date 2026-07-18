"use client";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { DockNav } from "./DockNav";

function DockNavFallback() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
      <div className="w-full max-w-5xl h-[60px] rounded-2xl bg-[#0D0D0D]/70 backdrop-blur-md border border-white/5" />
    </div>
  );
}

export function RouteNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard") || pathname.startsWith("/account"))
    return null;
  return (
    <Suspense fallback={<DockNavFallback />}>
      <DockNav />
    </Suspense>
  );
}
