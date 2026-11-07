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
import { categoryLabels, describeSchedule } from "@/modules/habits/labels";
import type { Habit } from "@/modules/habits/types";
import { cn } from "@/lib/utils";
import { HabitDialog } from "./habit-dialog";
import { useHabits, useToggleCheckin } from "./use-habits";

export function HabitsView() {
  const [archived, setArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const { data, isPending, isError, refetch } = useHabits(archived);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={archived ? "archived" : "active"}
          onValueChange={(v) => setArchived(v === "archived")}
        >
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setCreating(true)}>
          <PlusIcon aria-hidden />
          New habit
        </Button>
      </div>

      {isPending ? (
        <div
          className="flex flex-col gap-3"
          aria-busy="true"
          aria-label="Loading"
        >
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm">Could not load your habits.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <ListChecksIcon
            className="text-muted-foreground size-8"
            aria-hidden
          />
          <p className="text-sm">
            {archived
              ? "No archived habits."
              : "No habits yet. Start with one small thing that helps your job hunt."}
          </p>
          {!archived && (
            <Button variant="outline" onClick={() => setCreating(true)}>
              Create a habit
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
  const toggle = useToggleCheckin();
  const linked = habit.source === "applications";
  const archived = habit.archivedAt !== null;
  const canCheckIn = !linked && !archived && habit.today.scheduled;
  const unit = habit.scheduleType === "weekly_target" ? "week" : "day";
  const pct = Math.min(
    100,
    (habit.week.done / Math.max(1, habit.week.target)) * 100,
  );

  return (
    <li className="bg-card flex items-center gap-4 rounded-xl border p-4">
      {canCheckIn ? (
        <button
          type="button"
          onClick={() => toggle(habit, habit.today.date, !habit.today.done)}
          aria-pressed={habit.today.done}
          aria-label={`${habit.name}: ${habit.today.done ? "done today, undo" : "mark done today"}`}
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            habit.today.done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-muted-foreground/30 hover:border-emerald-500",
          )}
        >
          {habit.today.done && <CheckIcon className="size-5" aria-hidden />}
        </button>
      ) : (
        <span
          className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full"
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
          className="block truncate font-medium hover:underline"
        >
          {habit.name}
        </Link>
        <p className="text-muted-foreground truncate text-xs">
          {linked
            ? "Updates when you add applications"
            : `${describeSchedule(habit)} · ${categoryLabels[habit.category]}`}
          {!linked && !archived && !habit.today.scheduled && " · Rest day"}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div
            className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
            role="progressbar"
            aria-label={`${habit.name} this week`}
            aria-valuemin={0}
            aria-valuemax={habit.week.target}
            aria-valuenow={habit.week.done}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {habit.week.done}/{habit.week.target} this week
          </span>
        </div>
      </div>

      <div
        className="flex shrink-0 flex-col items-center"
        title={`Longest: ${habit.streak.longest} ${unit}s`}
      >
        <span className="flex items-center gap-1 font-semibold tabular-nums">
          <FlameIcon
            className={cn(
              "size-4",
              habit.streak.current > 0
                ? "text-orange-500"
                : "text-muted-foreground",
            )}
            aria-hidden
          />
          {habit.streak.current}
        </span>
        <span className="text-muted-foreground text-xs">{unit} streak</span>
      </div>
    </li>
  );
}
