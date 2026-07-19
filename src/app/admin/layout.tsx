"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/AdminGuard";
import { Logo } from "@/components/Logo";
import { LayoutDashboard, GraduationCap, CalendarDays, Users, Star, Settings } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Alumni", href: "/admin/alumni", icon: GraduationCap },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarDays },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Settings", href: "/admin/settings", icon: Settings },
] as const;

function SidebarNav() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-[280px] flex-shrink-0 bg-primary text-white md:flex md:flex-col">
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo className="text-xl" />
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">Admin</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-[10px] px-4 py-3 text-sm font-medium transition-all duration-200 hover:translate-x-0.5 hover:bg-white/10 hover:text-white ${
                isActive ? "bg-white/15 text-white font-semibold" : "text-white/70"
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <Link href="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors">
          <span>&larr;</span> Back to site
        </Link>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-[calc(100dvh-64px)]">
        <SidebarNav />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-6 py-10">
            {children}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
