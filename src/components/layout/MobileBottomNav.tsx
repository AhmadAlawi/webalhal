"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, MessageSquareText, UserRound } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useHeaderBadges } from "@/hooks/useHeaderBadges";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  badge?: "chat" | "notifications";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/chat", label: "المحادثات", icon: MessageSquareText, badge: "chat" },
  { href: "/notifications", label: "الإشعارات", icon: Bell, badge: "notifications" },
  { href: "/account", label: "الحسابات", icon: UserRound },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const { chatCount, notifCount } = useHeaderBadges(
    isAuthenticated,
    user?.roleId,
    user?.userId,
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#D7D9E2] bg-white/95 shadow-[0_-10px_30px_rgba(0,6,109,0.08)] backdrop-blur-md md:hidden">
      <div className="mx-auto grid h-20 max-w-[680px] grid-cols-4 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const badge =
            item.badge === "chat"
              ? chatCount
              : item.badge === "notifications"
                ? notifCount
                : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "relative flex flex-col items-center justify-center gap-1 text-xs font-bold transition-colors",
                active ? "text-[#00066D]" : "text-[#777B8F]",
              )}
            >
              <span className="relative">
                <Icon className="h-6 w-6" strokeWidth={active ? 3 : 2.25} />
                {badge > 0 && (
                  <span className="absolute -start-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C91822] px-1 text-[10px] font-bold leading-none text-white">
                    {badge > 99 ? "+99" : badge}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
