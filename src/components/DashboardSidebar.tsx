"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "@/hooks/useSession";
import { Logo } from "./Logo";
import {
  LayoutDashboard, Search, BookOpen, Star, User, Settings,
  LogOut, ChevronRight, GraduationCap
} from "lucide-react";

const sections = [
  {
    label: "General",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/browse", icon: Search, label: "Marketplace" },
      { href: "/bookings", icon: BookOpen, label: "My Bookings" },
      { href: "/browse?tab=saved", icon: Star, label: "Saved" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/alumni/profile", icon: User, label: "Profile" },
      { href: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
          <GraduationCap size={20} className="text-white" />
        </div>
        <Logo className="text-lg" />
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/25">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      active
                        ? "bg-white/12 text-white shadow-sm"
                        : "text-white/45 hover:bg-white/6 hover:text-white/75"
                    }`}
                  >
                    <Icon size={18} className={active ? "text-white" : "text-white/35"} />
                    <span>{item.label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/8 px-3 py-4 space-y-2">
        {session?.user && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <img
              src={`https://picsum.photos/seed/${session.user.id}/80/80`}
              alt={session.user.name ?? "User"}
              className="h-8 w-8 rounded-full border border-white/15 object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{session.user.name}</p>
              <p className="text-[10px] text-white/35 truncate">{session.user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ redirectTo: "/" })}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/35 hover:bg-white/6 hover:text-white/65 transition-colors w-full"
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-[60] lg:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F2240] text-white shadow-lg"
        aria-label="Toggle sidebar"
      >
        <ChevronRight size={18} className={`transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-[58] h-screen w-[220px] bg-[#050505] transition-transform duration-300 ease-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
