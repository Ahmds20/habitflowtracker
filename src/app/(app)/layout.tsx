import { Suspense } from "react";
import { BrandMark } from "@/components/app/brand";
import { AppGuard, UserBadge } from "@/components/app/current-user";
import { DemoBanner } from "@/components/app/demo-banner";
import { LogoutButton } from "@/components/app/logout-button";
import { BottomNav, SidebarNav } from "@/components/app/nav";
import { Providers } from "@/components/providers";
import {
  LanguageControl,
  ThemeControl,
} from "@/components/theme/preference-controls";

// Shell for every logged-in page: sidebar on desktop, bottom bar on mobile.
// The user badge reads the session, so it streams in behind <Suspense>;
// it also redirects to /login when the session cookie is invalid.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1">
      {/* The sidebar column stretches with the page; the panel inside stays
          pinned to the viewport while the content scrolls. */}
      <div className="bg-sidebar hidden w-64 shrink-0 border-r md:block">
        <aside className="sticky top-0 flex h-dvh flex-col">
          <div className="border-b px-4 py-4">
            <BrandMark href="/dashboard" />
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {/* The nav reads the URL (usePathname). On dynamic routes like
              /applications/[id] that is only known at request time, so it
              needs a Suspense boundary to keep the rest of the shell static. */}
            <Suspense fallback={<NavFallback count={5} />}>
              <SidebarNav />
            </Suspense>
          </div>
          <div className="flex flex-col gap-3 border-t p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <ThemeControl compact />
              <LanguageControl compact />
            </div>
            <Suspense
              fallback={
                <div className="bg-muted h-14 animate-pulse rounded-xl" />
              }
            >
              <UserBadge />
            </Suspense>
            <LogoutButton className="justify-start" />
          </div>
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense>
          <DemoBanner />
        </Suspense>
        {/* Validates the session and onboarding on every app page. */}
        <Suspense>
          <AppGuard />
        </Suspense>
        {/* Mobile top bar: brand plus theme and language, since there is no sidebar. */}
        <div className="bg-card/80 sticky top-0 z-30 flex items-center justify-between gap-2 border-b px-4 py-2.5 backdrop-blur md:hidden">
          <BrandMark href="/dashboard" compact />
          <div className="flex items-center gap-1.5">
            <ThemeControl compact />
            <LanguageControl compact />
          </div>
        </div>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-24 md:px-8 md:pt-8 md:pb-10">
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
        <div key={i} className="bg-muted/60 h-10 animate-pulse rounded-xl" />
      ))}
    </div>
  );
}
