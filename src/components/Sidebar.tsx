"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Search,
  CalendarDays,
  Star,
  Users,
  Menu,
  X,
} from "lucide-react";


const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/browse", icon: Search, label: "Marketplace" },
  { href: "/bookings", icon: CalendarDays, label: "Bookings" },
  { href: "/browse?view=saved", icon: Star, label: "Saved" },
  { href: "/alumni/profile", icon: Users, label: "Profile" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href.includes("?"))
      return pathname === href.split("?")[0] && pathname !== "/dashboard";
    return pathname.startsWith(href) && href !== "/dashboard";
  };

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-40 h-9 w-9 rounded-[10px] bg-white border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] flex items-center justify-center"
        onClick={() => setOpen(true)}
      >
        <Menu size={18} className="text-[var(--text-primary)]" />
      </button>
      {open && <div className="md:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />}
      <aside className={`fixed left-0 top-0 z-50 h-screen w-[240px] bg-white border-r border-[var(--border-subtle)] flex flex-col transition-transform duration-200 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <button className="md:hidden absolute top-4 right-4" onClick={() => setOpen(false)}>
          <X size={18} className="text-[var(--text-primary)]" />
        </button>
        <div className="h-[72px] flex items-center px-5 border-b border-[var(--border-subtle)] shrink-0">
          <span className="text-[18px] font-bold text-[var(--text-primary)]">
            alum<span className="text-[var(--accent)]">now</span>.
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">General</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] font-medium transition-all duration-150 ${
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon
                  size={16}
                  className={active ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 space-y-1 border-t border-[var(--border-subtle)] pt-3 shrink-0">
          {session?.user && (
            <div className="flex items-center gap-3 px-3 py-2.5">
              <img
                src={
                  session.user.image ??
                  `https://picsum.photos/seed/${session.user.id}/80/80`
                }
                alt={session.user.name ?? ""}
                className="h-7 w-7 rounded-[6px] object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">
                  {session.user.name}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
