"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { Logo } from "@/components/Logo";
import { useSession } from "@/hooks/useSession";
import { getPendingAlumniCount } from "@/actions/admin.actions";
import { LayoutDashboard, GraduationCap, CalendarDays, Users, Star, Settings, ArrowLeft, ShieldCheck, Command, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AdminCommandPalette } from "@/components/AdminCommandPalette";
import { AdminSessionWarning } from "@/components/AdminSessionWarning";
import { AdminPageTransition } from "@/components/AdminPageTransition";

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Alumni", href: "/admin/alumni", icon: GraduationCap },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarDays },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Settings", href: "/admin/settings", icon: Settings },
] as const;

function SidebarNav({ collapsed, toggleCollapse }: { collapsed: boolean; toggleCollapse: () => void }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, opacity: 0 });
  const { data: session } = useSession();
  const initial = (session?.user?.name ?? session?.user?.email ?? "A").charAt(0).toUpperCase();

  // Pending-application count, badged on the Alumni nav item so it's visible
  // from any admin page (not just when already on /admin/alumni). Polled
  // every 60s so a new signup shows up without a manual refresh.
  const [pendingAlumni, setPendingAlumni] = useState<number | null>(null);
  const [pollError, setPollError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      getPendingAlumniCount()
        .then((count) => { if (!cancelled) setPendingAlumni(count); })
        .catch(() => { if (!cancelled) setPollError(true); });
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useLayoutEffect(() => {
    const activeEl = navRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl && navRef.current) {
      const navTop = navRef.current.getBoundingClientRect().top;
      const elTop = activeEl.getBoundingClientRect().top;
      setIndicatorStyle({ top: elTop - navTop + activeEl.offsetHeight / 2 - 10, opacity: 1 });
    }
  }, [pathname]);

  return (
    <aside className={`hidden flex-shrink-0 border-r border-white/[0.06] bg-[#0A0A0B] text-white md:flex md:flex-col transition-[width] duration-200 ${collapsed ? "w-[76px]" : "w-[268px]"}`}>
      <div className="flex h-16 items-center gap-2 px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo className="text-xl" />
        </Link>
        <span className="inline-flex items-center gap-1 rounded-full border border-coral/25 bg-coral/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-coral">
          <ShieldCheck size={11} /> Admin
        </span>
        <span className="ml-auto flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-white/25">
          <Command size={10} />K
        </span>
      </div>

      <div className="mx-4 h-px bg-white/[0.08]" />

      <nav ref={navRef} className="relative flex-1 space-y-0.5 p-4">
        <span
          className="absolute left-4 w-[3px] h-5 rounded-full bg-coral pointer-events-none"
          style={{
            transform: `translateY(${indicatorStyle.top}px)`,
            opacity: indicatorStyle.opacity,
            transition: "transform var(--dur-base) var(--ease-out-expo), opacity var(--dur-fast) ease-out",
          }}
        />
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={isActive}
              className={`group relative flex items-center gap-3 rounded-[10px] px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${isActive ? "bg-coral/10 text-white" : "text-white/45 hover:bg-white/[0.04] hover:text-white/90"}`}
            >
              <Icon className={`h-[18px] w-[18px] flex-shrink-0 transition-colors ${isActive ? "text-coral" : "text-white/35 group-hover:text-white/70"}`} />
              {!collapsed && item.label}
              {item.href === "/admin/alumni" && pendingAlumni !== null && pendingAlumni > 0 && (
                <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                  {pendingAlumni}
                </span>
              )}
              {item.href === "/admin/alumni" && pollError && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" title="Live count unavailable" />
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleCollapse}
        className="mx-4 mb-3 mt-auto flex items-center justify-center rounded-[8px] border border-white/[0.06] p-2 text-white/30 hover:bg-white/[0.04] hover:text-white/70 transition-colors"
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>

      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3 rounded-[12px] bg-white/[0.03] px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral to-[#B8391F] text-xs font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{session?.user?.name ?? "Admin"}</p>
            <p className="truncate text-[11px] text-white/35">{session?.user?.email}</p>
          </div>
        </div>
        <Link
          href="/"
          className="mt-3 flex items-center gap-2 rounded-[10px] px-3 py-2 text-xs font-medium text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/80"
        >
          <ArrowLeft size={14} /> Back to site
        </Link>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin_sidebar_collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("admin_sidebar_collapsed", String(next));
      return next;
    });
  }, []);

  return (
    <AdminGuard>
      <AdminCommandPalette />
      <AdminSessionWarning />
      <div className="flex min-h-[calc(100dvh-64px)] bg-[#0D0D0D]">
        <SidebarNav collapsed={collapsed} toggleCollapse={toggleCollapse} />
        <div className="flex-1 overflow-auto overflow-x-hidden">
          <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-8 md:py-10">
            <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-coral/[0.04] blur-[140px]" />
            <div className="relative"><AdminPageTransition>{children}</AdminPageTransition></div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
