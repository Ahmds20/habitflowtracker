import Link from "next/link";
import { Suspense } from "react";
import {
  UserBadge,
  requireUserOrRedirect,
} from "@/components/app/current-user";
import { LogoutButton } from "@/components/app/logout-button";
import { BottomNav, SidebarNav } from "@/components/app/nav";
import { Providers } from "@/components/providers";

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
        {/* The nav reads the URL (usePathname). On dynamic routes like
            /applications/[id] that is only known at request time, so it
            needs a Suspense boundary to keep the rest of the shell static. */}
        <Suspense fallback={<NavFallback count={5} />}>
          <SidebarNav />
        </Suspense>
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
          <Providers>{children}</Providers>
        </main>
      </div>

      <Suspense>
        <BottomNav />
      </Suspense>
    </div>
  );
}

function NavFallback({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-1" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-muted/60 h-9 animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

async function MobileGuard() {
  await requireUserOrRedirect();
  return null;
}
