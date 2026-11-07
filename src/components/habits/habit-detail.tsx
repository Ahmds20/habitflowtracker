"use client";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ArrowLeftIcon,
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
import { errorMessage } from "@/components/applications/use-applications";
import { ApiError } from "@/lib/api-client";
import { formatLocalDate } from "@/modules/applications/labels";
import type { DayStatus } from "@/modules/habits/streak";
import { categoryLabels, describeSchedule } from "@/modules/habits/labels";
import type { HabitDetail } from "@/modules/habits/types";
import { cn } from "@/lib/utils";
import { HabitDialog } from "./habit-dialog";
import { useArchiveHabit, useDeleteHabit, useHabit } from "./use-habits";

export function HabitDetailView({ id }: { id: string }) {
  const { data: habit, isPending, error, refetch } = useHabit(id);

  if (isPending) {
    return (
      <div
        className="flex flex-col gap-6"
        aria-busy="true"
        aria-label="Loading"
      >
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (error) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <div className="flex flex-col items-start gap-3">
        <BackLink />
        <p className="text-sm">
          {missing
            ? "This habit does not exist or was deleted."
            : "Could not load this habit."}
        </p>
        {!missing && (
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        )}
      </div>
    );
  }
  return <Loaded habit={habit} />;
}

function BackLink() {
  return (
    <Link
      href="/habits"
      className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
    >
      <ArrowLeftIcon className="size-4" aria-hidden />
      Habits
    </Link>
  );
}

function Loaded({ habit }: { habit: HabitDetail }) {
  const [editing, setEditing] = useState(false);
  const archive = useArchiveHabit();
  const linked = habit.source === "applications";
  const archived = habit.archivedAt !== null;
  const unit = habit.scheduleType === "weekly_target" ? "week" : "day";

  return (
    <div className="flex flex-col gap-6">
      <BackLink />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight break-words">
            {habit.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            {linked
              ? "Counts the applications you send each week"
              : `${describeSchedule(habit)} · ${categoryLabels[habit.category]} · since ${formatLocalDate(habit.startDate)}`}
          </p>
          {archived && (
            <p className="mt-1 text-sm font-medium">This habit is archived.</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <PencilIcon aria-hidden />
            {linked ? "Change goal" : "Edit"}
          </Button>
          {!linked && (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={archived ? "Unarchive habit" : "Archive habit"}
                disabled={archive.isPending}
                onClick={() =>
                  archive.mutate(
                    { id: habit.id, archived: !archived },
                    {
                      onSuccess: () =>
                        toast.success(
                          archived ? "Habit restored" : "Habit archived",
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

      <div className="grid grid-cols-3 gap-3">
        <Stat
          icon={<FlameIcon className="size-4 text-orange-500" aria-hidden />}
          label={`Current ${unit} streak`}
          value={habit.streak.current}
        />
        <Stat
          icon={<TrophyIcon className="size-4 text-amber-500" aria-hidden />}
          label={`Longest ${unit} streak`}
          value={habit.streak.longest}
        />
        <Stat
          label={linked ? "Applications this week" : "This week"}
          value={`${habit.week.done}/${habit.week.target}`}
        />
      </div>

      <section className="flex flex-col gap-3 rounded-xl border p-4">
        <h2 className="font-medium">Last 30 days</h2>
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

function Stat({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border p-3">
      <span className="flex items-center gap-1 text-2xl font-semibold tabular-nums">
        {icon}
        {value}
      </span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}

const statusStyle: Record<DayStatus, string> = {
  done: "bg-emerald-500",
  missed: "bg-red-400/70",
  pending: "border-2 border-dashed border-emerald-500/60",
  unscheduled: "bg-muted",
};

const statusText: Record<DayStatus, string> = {
  done: "done",
  missed: "missed",
  pending: "not done yet",
  unscheduled: "no check-in planned",
};

// 30 days, oldest first: 10 per row on phones, 15 on wider screens.
function HistoryGrid({ history }: { history: HabitDetail["history"] }) {
  return (
    <ol
      className="grid grid-cols-10 gap-1.5 sm:grid-cols-15"
      aria-label="Check-in history"
    >
      {history.map(({ date, status }) => (
        <li
          key={date}
          title={`${formatLocalDate(date)}: ${statusText[status]}`}
          className={cn("aspect-square rounded-md", statusStyle[status])}
        >
          <span className="sr-only">
            {formatLocalDate(date)}: {statusText[status]}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Legend({ weekly }: { weekly: boolean }) {
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
          {weekly && status === "unscheduled" ? "not done" : statusText[status]}
        </li>
      ))}
    </ul>
  );
}

function DeleteButton({ habit }: { habit: HabitDetail }) {
  const [open, setOpen] = useState(false);
  const remove = useDeleteHabit();
  const router = useRouter();
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete habit"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon aria-hidden />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this habit?</DialogTitle>
            <DialogDescription>
              {habit.name} and all its check-ins will be deleted. This cannot be
              undone. To keep the history, archive it instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(habit.id, {
                  onSuccess: () => {
                    toast.success(`Deleted ${habit.name}`);
                    router.push("/habits");
                  },
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
            >
              {remove.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
