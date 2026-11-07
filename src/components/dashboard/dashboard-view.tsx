"use client";

import {
  BellIcon,
  BriefcaseIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  FlameIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddApplicationDialog } from "@/components/applications/add-application-dialog";
import { useToggleCheckin } from "@/components/habits/use-habits";
import { useI18n } from "@/i18n/client";
import { formatDateTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/modules/applications/applications.schema";
import { formatLocalDate, statusDotClass } from "@/modules/applications/labels";
import type { Dashboard } from "@/modules/dashboard/types";
import { categoryBadgeClass } from "@/modules/habits/labels";
import { useDashboard } from "./use-dashboard";

const pipelineOrder: ApplicationStatus[] = [
  "wishlist",
  "applied",
  "assessment",
  "interview",
  "offer",
  "closed",
];

export function DashboardView() {
  const { t } = useI18n();
  const { data, isPending, isError, refetch } = useDashboard();

  if (isPending) {
    return (
      <div
        className="flex flex-col gap-6"
        aria-busy="true"
        aria-label={t.common.loading}
      >
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm">{t.dashboard.loadFailed}</p>
        <Button variant="outline" onClick={() => refetch()}>
          {t.common.tryAgain}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Greeting data={data} />
      <StatCards data={data} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <TodayHabits data={data} className="lg:col-span-7" />
        <Upcoming data={data} className="lg:col-span-5" />
      </div>
      <Pipeline data={data} />
    </div>
  );
}

// Time of day in the browser, read once per mount (never during render).
type DayPart = "morning" | "afternoon" | "evening";

function useGreetingPart(): DayPart {
  const [part] = useState<DayPart>(() => {
    const hour = new Date().getHours();
    return hour < 11 ? "morning" : hour < 18 ? "afternoon" : "evening";
  });
  return part;
}

function Greeting({ data }: { data: Dashboard }) {
  const { t, intl } = useI18n();
  const d = t.dashboard;
  const part = useGreetingPart();
  const done = data.todayHabits.filter((h) => h.today.done).length;
  const apps = data.week.applications;
  const pct = apps
    ? Math.min(100, (apps.done / Math.max(1, apps.target)) * 100)
    : 0;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-700 p-6 text-white shadow-xl shadow-emerald-900/10 md:p-8">
      <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
          <p className="text-sm font-medium text-emerald-50/90">
            {d.weekRange(
              formatLocalDate(data.week.start, intl),
              formatLocalDate(data.week.end, intl),
            )}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            {d.greeting[part](data.firstName)}
          </h2>
          <p className="text-sm leading-relaxed text-emerald-50">
            {d.summary(
              done,
              data.todayHabits.length,
              data.upcomingInterviews.length,
            )}
          </p>
          {apps && (
            <div className="mt-2 flex flex-col gap-1.5">
              <p className="font-semibold">
                {d.applicationsSent(apps.done, apps.target)}
                {apps.done >= apps.target && ` · ${d.goalReached}`}
              </p>
              <div
                className="h-2 w-full max-w-md overflow-hidden rounded-full bg-white/25"
                role="progressbar"
                aria-label={d.applicationsSent(apps.done, apps.target)}
                aria-valuemin={0}
                aria-valuemax={apps.target}
                aria-valuenow={apps.done}
              >
                <div
                  className="h-full rounded-full bg-white transition-[width]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="shrink-0 [&_button]:bg-white [&_button]:text-emerald-700 [&_button]:hover:bg-emerald-50">
          <AddApplicationDialog />
        </div>
      </div>
      {/* Decorative slanted panel from the design reference. */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-amber-400/25 blur-2xl"
        aria-hidden
      />
    </section>
  );
}

const statTone = {
  emerald: {
    card: "border-emerald-100 dark:border-emerald-950/80",
    icon: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-400",
    note: "text-emerald-700 dark:text-emerald-400",
  },
  amber: {
    card: "border-amber-100 dark:border-amber-950/80",
    icon: "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900 dark:bg-amber-950/80 dark:text-amber-400",
    note: "text-amber-700 dark:text-amber-400",
  },
  teal: {
    card: "border-teal-100 dark:border-teal-950/80",
    icon: "border-teal-200 bg-teal-50 text-teal-600 dark:border-teal-900 dark:bg-teal-950/80 dark:text-teal-400",
    note: "text-teal-700 dark:text-teal-400",
  },
  rose: {
    card: "border-rose-100 dark:border-rose-950/80",
    icon: "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/80 dark:text-rose-400",
    note: "text-rose-700 dark:text-rose-400",
  },
} as const;

function StatCard({
  tone,
  label,
  value,
  note,
  icon,
}: {
  tone: keyof typeof statTone;
  label: string;
  value: React.ReactNode;
  note: string;
  icon: React.ReactNode;
}) {
  const c = statTone[tone];
  return (
    <div
      className={cn(
        "bg-card flex items-center justify-between gap-3 rounded-2xl border p-5 shadow-sm",
        c.card,
      )}
    >
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
        <p className={cn("mt-1 truncate text-xs font-medium", c.note)}>
          {note}
        </p>
      </div>
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-2xl border",
          c.icon,
        )}
        aria-hidden
      >
        {icon}
      </span>
    </div>
  );
}

function StatCards({ data }: { data: Dashboard }) {
  const { t } = useI18n();
  const s = t.dashboard.stats;
  const p = data.pipeline;
  const total = Object.values(p).reduce((a, b) => a + b, 0);
  const active = total - p.closed - p.wishlist;
  const streak = data.bestStreak;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        tone="emerald"
        label={s.consistency}
        value={
          data.week.habitConsistency === null
            ? "–"
            : `${data.week.habitConsistency}%`
        }
        note={s.consistencyNote}
        icon={<CheckCircle2Icon className="size-6" />}
      />
      <StatCard
        tone="amber"
        label={s.streak}
        value={streak ? streak.current : 0}
        note={streak ? streak.name : s.streakNone}
        icon={<FlameIcon className="size-6" />}
      />
      <StatCard
        tone="teal"
        label={s.active}
        value={active}
        note={s.activeNote(total)}
        icon={<BriefcaseIcon className="size-6" />}
      />
      <StatCard
        tone="rose"
        label={s.interviews}
        value={p.interview}
        note={s.interviewsNote(p.offer)}
        icon={<ClockIcon className="size-6" />}
      />
    </div>
  );
}

function Panel({
  title,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "bg-card flex min-w-0 flex-col gap-4 rounded-2xl border p-5 shadow-sm md:p-6",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b pb-4">
        <h2 className="flex items-center gap-2 font-bold">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function PanelLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="text-primary flex items-center gap-0.5 text-xs font-semibold hover:underline"
    >
      {children}
      <ChevronRightIcon className="size-3.5" aria-hidden />
    </Link>
  );
}

function TodayHabits({
  data,
  className,
}: {
  data: Dashboard;
  className?: string;
}) {
  const { t } = useI18n();
  const d = t.dashboard;
  const toggle = useToggleCheckin();
  const remaining = data.todayHabits.filter((h) => !h.today.done).length;

  return (
    <Panel
      className={className}
      title={d.todayHabits}
      icon={<CheckCircle2Icon className="text-primary size-5" aria-hidden />}
      action={
        data.todayHabits.length > 0 ? (
          <span className="text-muted-foreground text-xs font-medium">
            {remaining === 0 ? d.allDone : d.left(remaining)}
          </span>
        ) : (
          <PanelLink href="/habits">{d.manageHabits}</PanelLink>
        )
      }
    >
      {data.todayHabits.length === 0 ? (
        <p className="text-muted-foreground text-sm">{d.nothingToday}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {data.todayHabits.map((habit) => {
            const done = habit.today.done;
            return (
              <li key={habit.id}>
                <button
                  type="button"
                  onClick={() => toggle(habit, habit.today.date, !done)}
                  aria-pressed={done}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-colors",
                    done
                      ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                      : "bg-muted/40 hover:border-slate-300 dark:hover:border-slate-700",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg border transition-all",
                      done
                        ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                        : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800",
                    )}
                    aria-hidden
                  >
                    {done && <CheckIcon className="size-4 stroke-[3]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate font-semibold",
                        done && "text-muted-foreground line-through",
                      )}
                    >
                      {habit.name}
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          categoryBadgeClass[habit.category],
                        )}
                      >
                        {t.habits.categories[habit.category]}
                      </span>
                      {habit.streak.current > 0 && (
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <FlameIcon
                            className="size-3.5 fill-amber-500 text-amber-500"
                            aria-hidden
                          />
                          {d.streakLabel(habit.streak.current)}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function Upcoming({
  data,
  className,
}: {
  data: Dashboard;
  className?: string;
}) {
  const { t, intl } = useI18n();
  const d = t.dashboard;
  const empty =
    data.upcomingInterviews.length === 0 && data.followUps.length === 0;
  return (
    <Panel
      className={className}
      title={d.comingUp}
      icon={
        <CalendarClockIcon
          className="size-5 text-teal-600 dark:text-teal-400"
          aria-hidden
        />
      }
      action={<PanelLink href="/interviews">{d.allInterviews}</PanelLink>}
    >
      {empty ? (
        <p className="text-muted-foreground text-sm">{d.nothingDue}</p>
      ) : (
        <ul className="flex flex-col gap-2.5 text-sm">
          {data.upcomingInterviews.map((interview) => (
            <li
              key={interview.id}
              className="bg-muted/40 flex items-start gap-3 rounded-xl border p-3.5"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <CalendarClockIcon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <Link
                  href={`/applications/${interview.applicationId}`}
                  className="font-semibold hover:underline"
                >
                  {interview.application.company}
                </Link>
                <p className="text-muted-foreground truncate text-xs">
                  {formatDateTime(interview.scheduledAt, intl)}
                  {interview.title && ` · ${interview.title}`}
                </p>
              </div>
            </li>
          ))}
          {data.followUps.map((app) => (
            <li
              key={app.id}
              className="bg-muted/40 flex items-start gap-3 rounded-xl border p-3.5"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
                <BellIcon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <Link
                  href={`/applications/${app.id}`}
                  className="font-semibold hover:underline"
                >
                  {d.followUpWith(app.company)}
                </Link>
                <p className="text-muted-foreground truncate text-xs">
                  {app.followUpDate === data.today
                    ? d.dueToday
                    : d.dueSince(formatLocalDate(app.followUpDate!, intl))}{" "}
                  · {app.position}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Pipeline({ data }: { data: Dashboard }) {
  const { t } = useI18n();
  const d = t.dashboard;
  const total = Object.values(data.pipeline).reduce((a, b) => a + b, 0);
  return (
    <Panel
      title={d.pipeline}
      icon={
        <BriefcaseIcon
          className="size-5 text-teal-600 dark:text-teal-400"
          aria-hidden
        />
      }
      action={<PanelLink href="/applications">{d.openBoard}</PanelLink>}
    >
      {total === 0 ? (
        <p className="text-muted-foreground text-sm">{d.noApplications}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {pipelineOrder.map((status) => (
            <li
              key={status}
              className="bg-muted/40 flex flex-col gap-1 rounded-xl border p-3"
            >
              <span className="text-2xl font-bold tabular-nums">
                {data.pipeline[status]}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                <span
                  className={cn("size-2 rounded-full", statusDotClass[status])}
                  aria-hidden
                />
                {t.status[status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
