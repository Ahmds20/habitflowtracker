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
import { useI18n, useServerMessage } from "@/i18n/client";
import { ApiError } from "@/lib/api-client";
import {
  habitCategories,
  type HabitCategory,
  type ScheduleType,
} from "@/modules/habits/habits.schema";
import { weekdayLabel } from "@/modules/habits/labels";
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
  const { t } = useI18n();
  const translate = useServerMessage();
  const dlg = t.habits.dialog;
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
      toast.success(habit ? dlg.updated : dlg.created);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.details) setErrors(error.details);
      else
        toast.error(
          error instanceof ApiError
            ? translate(error.message)
            : t.common.couldNotSave,
        );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {linked ? dlg.linkedTitle : habit ? dlg.editTitle : dlg.newTitle}
          </DialogTitle>
          {linked && (
            <DialogDescription>{dlg.linkedDescription}</DialogDescription>
          )}
        </DialogHeader>
        <form
          id="habit-form"
          method="post"
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          {!linked && (
            <>
              <Field label={dlg.name} htmlFor="habit-name" errors={errors.name}>
                <Input
                  id="habit-name"
                  name="name"
                  autoFocus
                  placeholder={dlg.namePlaceholder}
                  defaultValue={habit?.name ?? ""}
                  aria-invalid={errors.name ? true : undefined}
                />
              </Field>
              <Field label={dlg.category} htmlFor="habit-category">
                <Select
                  items={t.habits.categories}
                  value={category}
                  onValueChange={(v) => v && setCategory(v as HabitCategory)}
                >
                  <SelectTrigger id="habit-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {habitCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t.habits.categories[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {!habit && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">{dlg.schedule}</span>
                  <Tabs
                    value={scheduleType}
                    onValueChange={(v) => setScheduleType(v as ScheduleType)}
                  >
                    <TabsList className="w-full">
                      <TabsTrigger value="days">{dlg.onDays}</TabsTrigger>
                      <TabsTrigger value="weekly_target">
                        {dlg.perWeek}
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
                {dlg.days}
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
                    {weekdayLabel(t, Number(d))}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {errors.daysOfWeek?.length ? (
                <p className="text-destructive text-xs" role="alert">
                  {translate(errors.daysOfWeek[0])}
                </p>
              ) : null}
            </div>
          ) : (
            <Field
              label={dlg.timesPerWeek}
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
            <Field label={dlg.descriptionLabel} htmlFor="habit-description">
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
            {save.isPending ? t.common.saving : t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
