import Link from "next/link";
import { Suspense } from "react";
import { BrandMark } from "@/components/app/brand";
import { PreferenceBar } from "@/components/app/preference-bar";
import { DemoButton } from "@/components/landing/demo-button";
import { WeekStrip } from "@/components/landing/week-strip";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary, getLocale } from "@/i18n/server";
import { getCurrentUser } from "@/modules/auth/session";

// Accent per value point, matching the dashboard stat cards.
const pointAccent = [
  "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-300",
  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
  "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
];

// The page reads the visitor's language (cookie or Accept-Language), so the
// content renders at request time inside <Suspense>.
export default function Home() {
  return (
    <Suspense>
      <Landing />
    </Suspense>
  );
}

async function Landing() {
  const t = getDictionary(await getLocale());
  const l = t.landing;
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <BrandMark />
        <div className="flex items-center gap-3">
          <PreferenceBar />
          <nav className="flex items-center gap-1">
            <Suspense fallback={<GuestLinks t={t} />}>
              <HeaderLinks t={t} />
            </Suspense>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-16">
          <div className="flex flex-col gap-6">
            <h1 className="text-[2.6rem] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance sm:text-6xl">
              {l.headline}
            </h1>
            <p className="text-muted-foreground max-w-[34rem] text-lg leading-relaxed text-pretty">
              {l.lead}
            </p>
            <div className="flex flex-wrap items-start gap-3">
              <DemoButton className="shadow-lg shadow-emerald-600/25" />
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-5 text-base"
                render={<Link href="/register" />}
              >
                {l.createAccount}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">{l.demoNote}</p>
          </div>
          <div className="flex justify-center md:justify-end">
            <WeekStrip t={t} />
          </div>
        </section>

        <section className="bg-muted/50 border-t">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-3">
            {l.points.map((point, i) => (
              <div
                key={point.title}
                className="bg-card flex flex-col gap-3 rounded-2xl border p-6 shadow-sm"
              >
                <span
                  className={`flex size-9 items-center justify-center rounded-xl border text-sm font-bold ${pointAccent[i]}`}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <h2 className="text-lg font-bold tracking-tight">
                  {point.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-sm sm:px-6">
        <p className="text-muted-foreground">
          {l.footer}{" "}
          <a
            href="https://github.com/Ahmds20/habitflowtracker"
            className="text-foreground underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            {l.source}
          </a>
        </p>
      </footer>
    </div>
  );
}

function GuestLinks({ t }: { t: Dictionary }) {
  return (
    <>
      <Button variant="ghost" render={<Link href="/login" />}>
        {t.landing.login}
      </Button>
      <Button variant="outline" render={<Link href="/register" />}>
        {t.landing.signup}
      </Button>
    </>
  );
}

// Logged-in visitors get a link back into the app instead of sign-up buttons.
async function HeaderLinks({ t }: { t: Dictionary }) {
  const user = await getCurrentUser();
  if (!user) return <GuestLinks t={t} />;
  return (
    <Button render={<Link href="/dashboard" />}>
      {t.landing.goToDashboard}
    </Button>
  );
}
