import Link from "next/link";
import { Suspense } from "react";
import {
  UserBadge,
  requireUserOrRedirect,
} from "@/components/app/current-user";
import { LogoutButton } from "@/components/app/logout-button";
import { BottomNav, SidebarNav } from "@/components/app/nav";

// Shell for every logged-in page: sidebar on desktop, bottom bar on mobile.
// The user badge reads the session, so it streams in behind <Suspense>;
// it also redirects to /login when the session cookie is invalid.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1">
      <aside className="bg-sidebar sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r p-4 md:flex">
        <Link
          href="/dashboard"
          className="px-3 text-lg font-semibold tracking-tight"
        >
          HabitFlow
        </Link>
        <SidebarNav />
        <div className="mt-auto flex flex-col gap-2 border-t pt-4">
          <div className="px-3">
            <Suspense
              fallback={<div className="bg-muted h-9 animate-pulse rounded" />}
            >
              <UserBadge />
            </Suspense>
          </div>
          <LogoutButton className="justify-start" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* On mobile the sidebar is hidden, so validate the session here too. */}
        <div className="md:hidden">
          <Suspense>
            <MobileGuard />
          </Suspense>
        </div>
        <main className="flex-1 px-4 pt-6 pb-24 md:px-8 md:pb-8">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

async function MobileGuard() {
  await requireUserOrRedirect();
  return null;
}
