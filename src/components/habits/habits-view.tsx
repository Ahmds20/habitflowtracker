"use client";

import {
  BriefcaseIcon,
  CheckIcon,
  FlameIcon,
  ListChecksIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/i18n/client";
import { categoryBadgeClass, describeSchedule } from "@/modules/habits/labels";
import type { Habit } from "@/modules/habits/types";
import { cn } from "@/lib/utils";
import { HabitDialog } from "./habit-dialog";
import { useHabits, useToggleCheckin } from "./use-habits";

export function HabitsView() {
  const { t } = useI18n();
  const h = t.habits;
  const [archived, setArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const { data, isPending, isError, refetch } = useHabits(archived);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 shadow-sm">
        <Tabs
          value={archived ? "archived" : "active"}
          onValueChange={(v) => setArchived(v === "archived")}
        >
          <TabsList>
            <TabsTrigger value="active">{h.active}</TabsTrigger>
            <TabsTrigger value="archived">{h.archived}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setCreating(true)}>
          <PlusIcon aria-hidden />
          {h.new}
        </Button>
      </div>

      {isPending ? (
        <div
          className="flex flex-col gap-3"
          aria-busy="true"
          aria-label={t.common.loading}
        >
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm">{h.loadFailed}</p>
          <Button variant="outline" onClick={() => refetch()}>
            {t.common.tryAgain}
          </Button>
        </div>
      ) : data.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
          <span className="bg-secondary text-secondary-foreground flex size-12 items-center justify-center rounded-2xl">
            <ListChecksIcon className="size-6" aria-hidden />
          </span>
          <p className="max-w-sm text-sm">
            {archived ? h.emptyArchived : h.empty}
          </p>
          {!archived && (
            <Button variant="outline" onClick={() => setCreating(true)}>
              {h.create}
            </Button>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((habit) => (
            <HabitRow key={habit.id} habit={habit} />
          ))}
        </ul>
      )}

      <HabitDialog
        key={creating ? "open" : "closed"}
        habit={null}
        open={creating}
        onOpenChange={setCreating}
      />
    </div>
  );
}

function HabitRow({ habit }: { habit: Habit }) {
  const { t } = useI18n();
  const h = t.habits;
  const toggle = useToggleCheckin();
  const linked = habit.source === "applications";
  const archived = habit.archivedAt !== null;
  const canCheckIn = !linked && !archived && habit.today.scheduled;
  const unit =
    habit.scheduleType === "weekly_target"
      ? h.streakUnit.week
      : h.streakUnit.day;
  const done = habit.today.done;
  const pct = Math.min(
    100,
    (habit.week.done / Math.max(1, habit.week.target)) * 100,
  );

  return (
    <li
      className={cn(
        "flex items-center gap-4 rounded-2xl border p-4 shadow-sm transition-colors",
        done && canCheckIn
          ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20"
          : "bg-card",
      )}
    >
      {canCheckIn ? (
        <button
          type="button"
          onClick={() => toggle(habit, habit.today.date, !done)}
          aria-pressed={done}
          aria-label={done ? h.undoDone(habit.name) : h.markDone(habit.name)}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl border-2 transition-all",
            done
              ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
              : "border-slate-300 bg-white hover:border-teal-500 dark:border-slate-600 dark:bg-slate-800",
          )}
        >
          {done && <CheckIcon className="size-5 stroke-[3]" aria-hidden />}
        </button>
      ) : (
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            linked
              ? "bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400"
              : "bg-muted text-muted-foreground",
          )}
          aria-hidden
        >
          {linked ? (
            <BriefcaseIcon className="size-5" />
          ) : (
            <ListChecksIcon className="size-5" />
          )}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <Link
          href={`/habits/${habit.id}`}
          className={cn(
            "block truncate font-semibold hover:underline",
            done && canCheckIn && "text-muted-foreground line-through",
          )}
        >
          {habit.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {linked ? (
            <span className="text-muted-foreground">{h.linkedNote}</span>
          ) : (
            <>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  categoryBadgeClass[habit.category],
                )}
              >
                {h.categories[habit.category]}
              </span>
              <span className="text-muted-foreground">
                {describeSchedule(t, habit)}
                {!archived && !habit.today.scheduled && ` · ${h.restDay}`}
              </span>
            </>
          )}
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <div
            className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
            role="progressbar"
            aria-label={h.weekLabel(habit.name)}
            aria-valuemin={0}
            aria-valuemax={habit.week.target}
            aria-valuenow={habit.week.done}
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width]",
                linked ? "bg-teal-500" : "bg-emerald-500",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {h.thisWeek(habit.week.done, habit.week.target)}
          </span>
        </div>
      </div>

      <div
        className="flex shrink-0 flex-col items-center"
        title={h.longest(habit.streak.longest, unit)}
      >
        <span className="flex items-center gap-1 text-lg font-bold tabular-nums">
          <FlameIcon
            className={cn(
              "size-4",
              habit.streak.current > 0
                ? "fill-amber-500 text-amber-500"
                : "text-muted-foreground",
            )}
            aria-hidden
          />
          {habit.streak.current}
        </span>
        <span className="text-muted-foreground text-[11px]">{unit}</span>
      </div>
    </li>
  );
}
