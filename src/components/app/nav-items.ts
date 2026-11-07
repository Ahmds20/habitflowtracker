import {
  BriefcaseIcon,
  CalendarClockIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  MoreHorizontalIcon,
  SettingsIcon,
} from "lucide-react";

// `key` names the label in the dictionary (t.nav[key]).
export const sidebarItems = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboardIcon },
  { href: "/applications", key: "applications", icon: BriefcaseIcon },
  { href: "/interviews", key: "interviews", icon: CalendarClockIcon },
  { href: "/habits", key: "habits", icon: ListChecksIcon },
  { href: "/settings", key: "settings", icon: SettingsIcon },
] as const;

// Mobile bottom bar has room for four items; Interviews and Settings live under "More".
export const bottomNavItems = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboardIcon },
  { href: "/applications", key: "applications", icon: BriefcaseIcon },
  { href: "/habits", key: "habits", icon: ListChecksIcon },
  {
    href: "/more",
    key: "more",
    icon: MoreHorizontalIcon,
    also: ["/interviews", "/settings"],
  },
] as const;
