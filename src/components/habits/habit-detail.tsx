"use client";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ArrowLeftIcon,
  CalendarCheckIcon,
  FlameIcon,
  PencilIcon,
  TrophyIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useErrorMessage } from "@/components/applications/use-applications";
import { useI18n } from "@/i18n/client";
import { ApiError } from "@/lib/api-client";
import { formatLocalDate } from "@/modules/applications/labels";
import type { DayStatus } from "@/modules/habits/streak";
import { categoryBadgeClass, describeSchedule } from "@/modules/habits/labels";
import type { HabitDetail } from "@/modules/habits/types";
import { cn } from "@/lib/utils";
import { HabitDialog } from "./habit-dialog";
import { useArchiveHabit, useDeleteHabit, useHabit } from "./use-habits";

export function HabitDetailView({ id }: { id: string }) {
  const { t } = useI18n();
  const { data: habit, isPending, error, refetch } = useHabit(id);

  if (isPending) {
    return (
      <div
        className="flex flex-col gap-6"
        aria-busy="true"
        aria-label={t.common.loading}
      >
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }
  if (error) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <div className="flex flex-col items-start gap-3">
        <BackLink />
        <p className="text-sm">
          {missing ? t.habits.detail.missing : t.habits.detail.loadFailed}
        </p>
        {!missing && (
          <Button variant="outline" onClick={() => refetch()}>
            {t.common.tryAgain}
          </Button>
        )}
      </div>
    );
  }
  return <Loaded habit={habit} />;
}

function BackLink() {
  const { t } = useI18n();
  return (
    <Link
      href="/habits"
      className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
    >
      <ArrowLeftIcon className="size-4" aria-hidden />
      {t.habits.detail.back}
    </Link>
  );
}

function Loaded({ habit }: { habit: HabitDetail }) {
  const { t, intl } = useI18n();
  const d = t.habits.detail;
  const errorMessage = useErrorMessage();
  const [editing, setEditing] = useState(false);
  const archive = useArchiveHabit();
  const linked = habit.source === "applications";
  const archived = habit.archivedAt !== null;
  const unit = habit.scheduleType === "weekly_target" ? d.unitWeek : d.unitDay;

  return (
    <div className="flex flex-col gap-6">
      <BackLink />
      <header className="bg-card flex flex-wrap items-start justify-between gap-4 rounded-2xl border p-5 shadow-sm">
        <div className="min-w-0">
          {!linked && (
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                categoryBadgeClass[habit.category],
              )}
            >
              {t.habits.categories[habit.category]}
            </span>
          )}
          <h1 className="mt-2 text-2xl font-bold tracking-tight break-words">
            {habit.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            {linked
              ? d.linkedSubtitle
              : `${describeSchedule(t, habit)} · ${d.since(formatLocalDate(habit.startDate, intl))}`}
          </p>
          {archived && (
            <p className="mt-1 text-sm font-semibold">{d.archivedNote}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <PencilIcon aria-hidden />
            {linked ? d.changeGoal : t.common.edit}
          </Button>
          {!linked && (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={archived ? d.unarchive : d.archive}
                disabled={archive.isPending}
                onClick={() =>
                  archive.mutate(
                    { id: habit.id, archived: !archived },
                    {
                      onSuccess: () =>
                        toast.success(
                          archived ? d.restoredToast : d.archivedToast,
                        ),
                      onError: (e) => toast.error(errorMessage(e)),
                    },
                  )
                }
              >
                {archived ? (
                  <ArchiveRestoreIcon aria-hidden />
                ) : (
                  <ArchiveIcon aria-hidden />
                )}
              </Button>
              <DeleteButton habit={habit} />
            </>
          )}
        </div>
      </header>

      {habit.description && <p className="text-sm">{habit.description}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          tone="amber"
          icon={<FlameIcon className="size-5" aria-hidden />}
          label={d.current(unit)}
          value={habit.streak.current}
        />
        <Stat
          tone="emerald"
          icon={<TrophyIcon className="size-5" aria-hidden />}
          label={d.longest(unit)}
          value={habit.streak.longest}
        />
        <Stat
          tone="teal"
          icon={<CalendarCheckIcon className="size-5" aria-hidden />}
          label={linked ? d.applicationsThisWeek : d.thisWeek}
          value={`${habit.week.done}/${habit.week.target}`}
        />
      </div>

      <section className="bg-card flex flex-col gap-3 rounded-2xl border p-5 shadow-sm">
        <h2 className="font-bold">{d.last30}</h2>
        <HistoryGrid history={habit.history} />
        <Legend weekly={habit.scheduleType === "weekly_target"} />
      </section>

      <HabitDialog
        key={editing ? "open" : "closed"}
        habit={habit}
        open={editing}
        onOpenChange={setEditing}
      />
    </div>
  );
}

const toneClass = {
  amber:
    "border-amber-100 dark:border-amber-950/80 [&_[data-icon]]:bg-amber-50 [&_[data-icon]]:text-amber-600 dark:[&_[data-icon]]:bg-amber-950/70 dark:[&_[data-icon]]:text-amber-400",
  emerald:
    "border-emerald-100 dark:border-emerald-950/80 [&_[data-icon]]:bg-emerald-50 [&_[data-icon]]:text-emerald-600 dark:[&_[data-icon]]:bg-emerald-950/70 dark:[&_[data-icon]]:text-emerald-400",
  teal: "border-teal-100 dark:border-teal-950/80 [&_[data-icon]]:bg-teal-50 [&_[data-icon]]:text-teal-600 dark:[&_[data-icon]]:bg-teal-950/70 dark:[&_[data-icon]]:text-teal-400",
} as const;

function Stat({
  tone,
  icon,
  label,
  value,
}: {
  tone: keyof typeof toneClass;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-card flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm",
        toneClass[tone],
      )}
    >
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      </div>
      <span
        data-icon
        className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
      >
        {icon}
      </span>
    </div>
  );
}

const statusStyle: Record<DayStatus, string> = {
  done: "bg-emerald-500",
  missed: "bg-rose-400/70 dark:bg-rose-500/50",
  pending: "border-2 border-dashed border-emerald-500/60",
  unscheduled: "bg-muted",
};

// 30 days, oldest first: 10 per row on phones, 15 on wider screens.
function HistoryGrid({ history }: { history: HabitDetail["history"] }) {
  const { t, intl } = useI18n();
  const d = t.habits.detail;
  return (
    <ol
      className="grid grid-cols-10 gap-1.5 sm:grid-cols-15"
      aria-label={d.historyLabel}
    >
      {history.map(({ date, status }) => {
        const text = `${formatLocalDate(date, intl)}: ${d.dayStatus[status]}`;
        return (
          <li
            key={date}
            title={text}
            className={cn("aspect-square rounded-md", statusStyle[status])}
          >
            <span className="sr-only">{text}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Legend({ weekly }: { weekly: boolean }) {
  const { t } = useI18n();
  const labels = t.habits.detail.dayStatus;
  const items: DayStatus[] = weekly
    ? ["done", "unscheduled"]
    : ["done", "missed", "pending", "unscheduled"];
  return (
    <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {items.map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          <span
            className={cn("size-3 rounded-sm", statusStyle[status])}
            aria-hidden
          />
          {weekly && status === "unscheduled" ? labels.notDone : labels[status]}
        </li>
      ))}
    </ul>
  );
}

function DeleteButton({ habit }: { habit: HabitDetail }) {
  const { t } = useI18n();
  const d = t.habits.detail;
  const errorMessage = useErrorMessage();
  const [open, setOpen] = useState(false);
  const remove = useDeleteHabit();
  const router = useRouter();
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={d.deleteLabel}
        onClick={() => setOpen(true)}
      >
        <Trash2Icon aria-hidden />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{d.deleteTitle}</DialogTitle>
            <DialogDescription>{d.deleteBody(habit.name)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(habit.id, {
                  onSuccess: () => {
                    toast.success(d.deleted(habit.name));
                    router.push("/habits");
                  },
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
            >
              {remove.isPending ? t.common.deleting : t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
