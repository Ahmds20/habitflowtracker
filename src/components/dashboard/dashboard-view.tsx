"use client";

import {
  BellIcon,
  BriefcaseIcon,
  CalendarClockIcon,
  CheckIcon,
  FlameIcon,
  ListChecksIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddApplicationDialog } from "@/components/applications/add-application-dialog";
import { useToggleCheckin } from "@/components/habits/use-habits";
import { formatDateTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import {
  formatLocalDate,
  statusDotClass,
  statusLabels,
} from "@/modules/applications/labels";
import type { ApplicationStatus } from "@/modules/applications/applications.schema";
import type { Dashboard } from "@/modules/dashboard/types";
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
  const { data, isPending, isError, refetch } = useDashboard();

  if (isPending) {
    return (
      <div
        className="grid gap-4 lg:grid-cols-2"
        aria-busy="true"
        aria-label="Loading"
      >
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm">Could not load your dashboard.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ThisWeek data={data} />
      <div className="grid gap-4 lg:grid-cols-2">
        <TodayHabits data={data} />
        <Upcoming data={data} />
      </div>
      <Pipeline data={data} />
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
      className={cn("flex flex-col gap-3 rounded-xl border p-4", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-medium">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ThisWeek({ data }: { data: Dashboard }) {
  const apps = data.week.applications;
  const pct = apps
    ? Math.min(100, (apps.done / Math.max(1, apps.target)) * 100)
    : 0;
  const reached = apps !== null && apps.done >= apps.target;

  return (
    <section className="grid gap-4 rounded-xl border p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs">
          This week · {formatLocalDate(data.week.start)} –{" "}
          {formatLocalDate(data.week.end)}
        </p>
        {apps ? (
          <>
            <p className="text-lg font-semibold">
              {apps.done} of {apps.target} applications sent
              {reached && (
                <span className="text-emerald-600"> · goal reached</span>
              )}
            </p>
            <div
              className="bg-muted h-2 overflow-hidden rounded-full"
              role="progressbar"
              aria-label="Applications this week"
              aria-valuemin={0}
              aria-valuemax={apps.target}
              aria-valuenow={apps.done}
            >
              <div
                className="h-full rounded-full bg-sky-500 transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm">No weekly goal yet.</p>
        )}
        <p className="text-muted-foreground text-sm">
          {data.week.habitConsistency === null
            ? "Add a habit to track your consistency."
            : `Habit consistency: ${data.week.habitConsistency}% of planned check-ins done.`}
        </p>
      </div>
      <AddApplicationDialog />
    </section>
  );
}

function TodayHabits({ data }: { data: Dashboard }) {
  const toggle = useToggleCheckin();
  const remaining = data.todayHabits.filter((h) => !h.today.done).length;

  return (
    <Panel
      title="Today's habits"
      icon={
        <ListChecksIcon className="text-muted-foreground size-4" aria-hidden />
      }
      action={
        data.todayHabits.length > 0 && (
          <span className="text-muted-foreground text-xs">
            {remaining === 0 ? "All done" : `${remaining} left`}
          </span>
        )
      }
    >
      {data.todayHabits.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nothing planned for today.{" "}
          <Link
            href="/habits"
            className="text-foreground underline underline-offset-4"
          >
            Manage habits
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {data.todayHabits.map((habit) => (
            <li key={habit.id}>
              <button
                type="button"
                onClick={() =>
                  toggle(habit, habit.today.date, !habit.today.done)
                }
                aria-pressed={habit.today.done}
                className="hover:bg-muted/60 flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm"
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                    habit.today.done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-muted-foreground/30",
                  )}
                  aria-hidden
                >
                  {habit.today.done && <CheckIcon className="size-3.5" />}
                </span>
                <span
                  className={cn(
                    "flex-1 truncate",
                    habit.today.done && "text-muted-foreground line-through",
                  )}
                >
                  {habit.name}
                </span>
                {habit.streak.current > 0 && (
                  <span
                    className="text-muted-foreground flex items-center gap-0.5 text-xs tabular-nums"
                    aria-label={`${habit.streak.current} streak`}
                  >
                    <FlameIcon className="size-3 text-orange-500" aria-hidden />
                    {habit.streak.current}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Upcoming({ data }: { data: Dashboard }) {
  const empty =
    data.upcomingInterviews.length === 0 && data.followUps.length === 0;
  return (
    <Panel
      title="Coming up"
      icon={
        <CalendarClockIcon
          className="text-muted-foreground size-4"
          aria-hidden
        />
      }
      action={
        <Link
          href="/interviews"
          className="text-muted-foreground text-xs hover:underline"
        >
          All interviews
        </Link>
      }
    >
      {empty ? (
        <p className="text-muted-foreground text-sm">
          No interviews or follow-ups due.
        </p>
      ) : (
        <ul className="flex flex-col gap-3 text-sm">
          {data.upcomingInterviews.map((interview) => (
            <li key={interview.id} className="flex items-start gap-3">
              <CalendarClockIcon
                className="mt-0.5 size-4 shrink-0 text-amber-500"
                aria-hidden
              />
              <div className="min-w-0">
                <Link
                  href={`/applications/${interview.applicationId}`}
                  className="font-medium hover:underline"
                >
                  {interview.application.company}
                </Link>
                <p className="text-muted-foreground truncate text-xs">
                  {formatDateTime(interview.scheduledAt)}
                  {interview.title && ` · ${interview.title}`}
                </p>
              </div>
            </li>
          ))}
          {data.followUps.map((app) => (
            <li key={app.id} className="flex items-start gap-3">
              <BellIcon
                className="mt-0.5 size-4 shrink-0 text-sky-500"
                aria-hidden
              />
              <div className="min-w-0">
                <Link
                  href={`/applications/${app.id}`}
                  className="font-medium hover:underline"
                >
                  Follow up with {app.company}
                </Link>
                <p className="text-muted-foreground truncate text-xs">
                  {app.followUpDate === data.today
                    ? "Due today"
                    : `Due since ${formatLocalDate(app.followUpDate!)}`}{" "}
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
  const total = Object.values(data.pipeline).reduce((a, b) => a + b, 0);
  return (
    <Panel
      title="Pipeline"
      icon={
        <BriefcaseIcon className="text-muted-foreground size-4" aria-hidden />
      }
      action={
        <Link
          href="/applications"
          className="text-muted-foreground text-xs hover:underline"
        >
          Open board
        </Link>
      }
    >
      {total === 0 ? (
        <p className="text-muted-foreground text-sm">
          No applications yet. Add your first one to start your pipeline.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {pipelineOrder.map((status) => (
            <li
              key={status}
              className="bg-muted/40 flex flex-col gap-1 rounded-lg p-3"
            >
              <span className="text-xl font-semibold tabular-nums">
                {data.pipeline[status]}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span
                  className={cn("size-2 rounded-full", statusDotClass[status])}
                  aria-hidden
                />
                {statusLabels[status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
