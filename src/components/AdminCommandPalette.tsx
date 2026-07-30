"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, GraduationCap, CalendarDays, Users, Star, Settings, Search } from "lucide-react";

const commands = [
  { label: "Go to Overview", href: "/admin", icon: LayoutDashboard, keywords: "home dashboard" },
  { label: "Go to Alumni", href: "/admin/alumni", icon: GraduationCap, keywords: "applications review" },
  { label: "Go to Bookings", href: "/admin/bookings", icon: CalendarDays, keywords: "sessions payments" },
  { label: "Go to Users", href: "/admin/users", icon: Users, keywords: "accounts students" },
  { label: "Go to Reviews", href: "/admin/reviews", icon: Star, keywords: "moderation" },
  { label: "Go to Settings", href: "/admin/settings", icon: Settings, keywords: "upi config" },
];

export function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filtered = commands.filter(
    (c) => c.label.toLowerCase().includes(query.toLowerCase()) || c.keywords.includes(query.toLowerCase())
  );

  const go = useCallback((href: string) => {
    router.push(href as any);
    setOpen(false);
    setQuery("");
  }, [router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[15vh]" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg rounded-[14px] border border-white/10 bg-[#1A1A1A] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <Search size={16} className="text-white/30" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a page or action..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/30">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.href}
                onClick={() => go(c.href)}
                className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <Icon size={16} className="text-white/40" />
                {c.label}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-white/30">No matches</p>
          )}
        </div>
      </div>
    </div>
  );
}
