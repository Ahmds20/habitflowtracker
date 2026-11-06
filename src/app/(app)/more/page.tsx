import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarClockIcon,
  ChevronRightIcon,
  SettingsIcon,
} from "lucide-react";
import { LogoutButton } from "@/components/app/logout-button";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "More · HabitFlow" };

const links = [
  { href: "/interviews", label: "Interviews", icon: CalendarClockIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

// Mobile-only menu for pages that do not fit in the bottom bar.
export default function Page() {
  return (
    <>
      <PageHeader title="More" />
      <ul className="divide-y rounded-xl border">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium"
            >
              <Icon className="text-muted-foreground size-4" aria-hidden />
              {label}
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
