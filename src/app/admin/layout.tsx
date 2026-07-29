"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/AdminGuard";
import { Logo } from "@/components/Logo";
import { useSession } from "@/hooks/useSession";
import { LayoutDashboard, GraduationCap, CalendarDays, Users, Star, Settings, ArrowLeft, ShieldCheck } from "lucide-react";

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Alumni", href: "/admin/alumni", icon: GraduationCap },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarDays },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Settings", href: "/admin/settings", icon: Settings },
] as const;

function SidebarNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const initial = (session?.user?.name ?? session?.user?.email ?? "A").charAt(0).toUpperCase();

  return (
    <aside className="hidden w-[268px] flex-shrink-0 border-r border-white/[0.06] bg-[#0A0A0B] text-white md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo className="text-xl" />
        </Link>
        <span className="inline-flex items-center gap-1 rounded-full border border-coral/25 bg-coral/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-coral">
          <ShieldCheck size={11} /> Admin
        </span>
      </div>

      <div className="mx-4 h-px bg-white/[0.08]" />

      <nav className="flex-1 space-y-0.5 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-[10px] px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-coral/10 text-white"
                  : "text-white/45 hover:bg-white/[0.04] hover:text-white/90"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-coral" />
              )}
              <Icon className={`h-[18px] w-[18px] flex-shrink-0 transition-colors ${isActive ? "text-coral" : "text-white/35 group-hover:text-white/70"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

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
  return (
    <AdminGuard>
      <div className="flex min-h-[calc(100dvh-64px)] bg-[#0D0D0D]">
        <SidebarNav />
        <div className="flex-1 overflow-auto">
          <div className="relative mx-auto max-w-7xl px-6 py-10 sm:px-8">
            <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-coral/[0.04] blur-[140px]" />
            <div className="relative">{children}</div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
