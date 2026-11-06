import {
  BriefcaseIcon,
  CalendarClockIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  MoreHorizontalIcon,
  SettingsIcon,
} from "lucide-react";

export const sidebarItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/applications", label: "Applications", icon: BriefcaseIcon },
  { href: "/interviews", label: "Interviews", icon: CalendarClockIcon },
  { href: "/habits", label: "Habits", icon: ListChecksIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

// Mobile bottom bar has room for four items; Interviews and Settings live under "More".
export const bottomNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/applications", label: "Applications", icon: BriefcaseIcon },
  { href: "/habits", label: "Habits", icon: ListChecksIcon },
  {
    href: "/more",
    label: "More",
    icon: MoreHorizontalIcon,
    also: ["/interviews", "/settings"],
  },
] as const;
