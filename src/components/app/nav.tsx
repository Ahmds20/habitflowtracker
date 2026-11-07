"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { bottomNavItems, sidebarItems } from "./nav-items";

function isActive(
  pathname: string,
  href: string,
  also: readonly string[] = [],
) {
  return [href, ...also].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav aria-label={t.nav.main} className="flex flex-col gap-1">
      {sidebarItems.map(({ href, key, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-md shadow-emerald-600/20"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-[18px] shrink-0" aria-hidden />
            {t.nav[key]}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav
      aria-label={t.nav.main}
      className="bg-card/95 fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {bottomNavItems.map((item) => {
        const { href, key, icon: Icon } = item;
        const active = isActive(
          pathname,
          href,
          "also" in item ? item.also : [],
        );
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-xs font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {t.nav[key]}
          </Link>
        );
      })}
    </nav>
  );
}
