"use client";

import Link from "next/link";
import {
  CalendarClockIcon,
  ChevronRightIcon,
  SettingsIcon,
} from "lucide-react";
import { useI18n } from "@/i18n/client";
import { LogoutButton } from "./logout-button";
import { PageHeader } from "./page-header";

const links = [
  { href: "/interviews", key: "interviews", icon: CalendarClockIcon },
  { href: "/settings", key: "settings", icon: SettingsIcon },
] as const;

// Mobile-only menu for pages that do not fit in the bottom bar.
export function MoreMenu() {
  const { t } = useI18n();
  return (
    <>
      <PageHeader title={t.more.title} />
      <ul className="bg-card divide-y overflow-hidden rounded-2xl border shadow-sm">
        {links.map(({ href, key, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium"
            >
              <Icon className="text-muted-foreground size-4" aria-hidden />
              {t.nav[key]}
              <ChevronRightIcon
                className="text-muted-foreground ml-auto size-4"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
      <LogoutButton className="mt-4" />
    </>
  );
}
