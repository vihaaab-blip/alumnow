"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts(onSearchOpen: () => void) {
  const router = useRouter();
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === "k") { e.preventDefault(); onSearchOpen(); }
      if (isMod && e.key === "b") { e.preventDefault(); router.push("/browse"); }
      if (isMod && e.key === "d") { e.preventDefault(); router.push("/dashboard"); }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSearchOpen, router]);
}
