"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/applications/interview-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ApiError } from "@/lib/api-client";
import {
  habitCategories,
  type HabitCategory,
  type ScheduleType,
} from "@/modules/habits/habits.schema";
import { categoryLabels, weekdayLabels } from "@/modules/habits/labels";
import type { Habit } from "@/modules/habits/types";
import { useSaveHabit } from "./use-habits";

const allDays = ["1", "2", "3", "4", "5", "6", "7"];

// Create (habit = null) or edit a habit. The schedule type is fixed after
// creation; the linked applications habit only allows editing its target.
export function HabitDialog({
  habit,
  open,
  onOpenChange,
}: {
  habit: Habit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const save = useSaveHabit();
  const linked = habit?.source === "applications";
  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    habit?.scheduleType ?? "days",
  );
  const [days, setDays] = useState<string[]>(
    habit?.scheduleType === "days" ? habit.daysOfWeek.map(String) : allDays,
  );
  const [category, setCategory] = useState<HabitCategory>(
    habit?.category ?? "learning",
  );
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {},
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const form = new FormData(event.currentTarget);
    const target = Number(form.get("targetPerWeek"));

    const schedule =
      scheduleType === "days"
        ? { daysOfWeek: days.map(Number) }
        : { targetPerWeek: target };

    const body = linked
      ? { targetPerWeek: target }
      : {
          name: form.get("name"),
          description: form.get("description"),
          category,
          ...schedule,
          ...(!habit && { scheduleType }),
        };

    try {
      await save.mutateAsync({ id: habit?.id, body });
      toast.success(habit ? "Habit updated" : "Habit created");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.details) setErrors(error.details);
      else
        toast.error(
          error instanceof ApiError ? error.message : "Could not save",
        );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {linked
              ? "Weekly applications goal"
              : habit
                ? "Edit habit"
                : "New habit"}
          </DialogTitle>
          {linked && (
            <DialogDescription>
              Counts applications you send each week. It updates automatically.
            </DialogDescription>
          )}
        </DialogHeader>
        <form
          id="habit-form"
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          {!linked && (
            <>
              <Field label="Name" htmlFor="habit-name" errors={errors.name}>
                <Input
                  id="habit-name"
                  name="name"
                  autoFocus
                  placeholder="Practice coding for 1 hour"
                  defaultValue={habit?.name ?? ""}
                  aria-invalid={errors.name ? true : undefined}
                />
              </Field>
              <Field label="Category" htmlFor="habit-category">
                <Select
                  items={categoryLabels}
                  value={category}
                  onValueChange={(v) => v && setCategory(v as HabitCategory)}
                >
                  <SelectTrigger id="habit-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {habitCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {categoryLabels[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {!habit && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Schedule</span>
                  <Tabs
                    value={scheduleType}
                    onValueChange={(v) => setScheduleType(v as ScheduleType)}
                  >
                    <TabsList className="w-full">
                      <TabsTrigger value="days">On selected days</TabsTrigger>
                      <TabsTrigger value="weekly_target">
                        Times per week
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}
            </>
          )}

          {scheduleType === "days" ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium" id="habit-days-label">
                Days
              </span>
              <ToggleGroup
                multiple
                variant="outline"
                spacing={1}
                value={days}
                onValueChange={(value) => setDays(value as string[])}
                aria-labelledby="habit-days-label"
                className="flex-wrap"
              >
                {allDays.map((d) => (
                  <ToggleGroupItem key={d} value={d} className="min-w-11">
                    {weekdayLabels[Number(d)]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {errors.daysOfWeek?.length ? (
                <p className="text-destructive text-xs" role="alert">
                  {errors.daysOfWeek[0]}
                </p>
              ) : null}
            </div>
          ) : (
            <Field
              label="Times per week"
              htmlFor="habit-target"
              errors={errors.targetPerWeek}
            >
              <Input
                id="habit-target"
                name="targetPerWeek"
                type="number"
                inputMode="numeric"
                min={1}
                max={50}
                defaultValue={habit?.targetPerWeek ?? 3}
                className="w-28"
                aria-invalid={errors.targetPerWeek ? true : undefined}
              />
            </Field>
          )}

          {!linked && (
            <Field label="Description" htmlFor="habit-description">
              <Textarea
                id="habit-description"
                name="description"
                rows={2}
                defaultValue={habit?.description ?? ""}
              />
            </Field>
          )}
        </form>
        <DialogFooter>
          <Button type="submit" form="habit-form" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
