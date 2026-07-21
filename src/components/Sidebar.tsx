"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import {
  LayoutDashboard,
  Search,
  CalendarDays,
  Star,
  Users,
} from "lucide-react";
import { Logo } from "@/components/Logo";

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

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href.includes("?"))
      return pathname === href.split("?")[0] && pathname !== "/dashboard";
    return pathname.startsWith(href) && href !== "/dashboard";
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-full w-[240px] bg-[#0D0D0D] flex flex-col border-r border-white/5">
      <div className="h-[72px] flex items-center px-5 border-b border-white/5 shrink-0">
        <Logo className="text-[17px]" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] font-medium transition-all duration-150 ${
                active
                  ? "bg-coral/10 text-white"
                  : "text-white/45 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <Icon
                size={16}
                className={active ? "text-coral" : "text-white/30"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-1 border-t border-white/5 pt-3 shrink-0">
        {session?.user && (
          <div className="flex items-center gap-3 px-3 py-2.5">
            <img
              src={`https://picsum.photos/seed/${session.user.id}/80/80`}
              alt={session.user.name ?? ""}
              className="h-7 w-7 rounded-[6px] object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-white/80 truncate">
                {session.user.name}
              </p>
              <p className="text-[10px] text-white/30 truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
