import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { DemoButton } from "@/components/landing/demo-button";
import { WeekStrip } from "@/components/landing/week-strip";
import { getCurrentUser } from "@/modules/auth/session";

const points = [
  {
    title: "Every application in one place",
    body: "Track each company from wishlist to offer on a board, with interviews, follow-ups, and the full history of every move.",
  },
  {
    title: "A weekly goal that counts itself",
    body: "Set how many applications you want to send each week. Every application you add moves the goal forward.",
  },
  {
    title: "Habits that keep you going",
    body: "Practice coding, study, update your CV. Check in with one tap and keep your streak through a long search.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="text-lg font-semibold tracking-tight">HabitFlow</span>
        <nav className="flex items-center gap-1">
          <Suspense fallback={<GuestLinks />}>
            <HeaderLinks />
          </Suspense>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-16">
          <div className="flex flex-col gap-6">
            <h1 className="text-[2.6rem] leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
              Stay consistent until you land the job.
            </h1>
            <p className="text-muted-foreground max-w-[34rem] text-lg leading-relaxed text-pretty">
              HabitFlow tracks your job applications and the small daily habits
              behind them, so a long search keeps moving week after week.
            </p>
            <div className="flex flex-wrap items-start gap-3">
              <DemoButton />
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-5 text-base"
                render={<Link href="/register" />}
              >
                Create an account
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              The demo opens with sample data. No sign-up needed.
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <WeekStrip />
          </div>
        </section>

        <section className="border-t bg-slate-50/60 dark:bg-transparent">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3">
            {points.map((point) => (
              <div key={point.title} className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold tracking-tight">
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
          Built by Ahmad Jazil Faiz as a portfolio project.{" "}
          <a
            href="https://github.com/Ahmds20/habitflowtracker"
            className="text-foreground underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            View the source on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

function GuestLinks() {
  return (
    <>
      <Button variant="ghost" render={<Link href="/login" />}>
        Log in
      </Button>
      <Button variant="outline" render={<Link href="/register" />}>
        Sign up
      </Button>
    </>
  );
}

// Logged-in visitors get a link back into the app instead of sign-up buttons.
async function HeaderLinks() {
  const user = await getCurrentUser();
  if (!user) return <GuestLinks />;
  return <Button render={<Link href="/dashboard" />}>Go to dashboard</Button>;
}
