import type { Dictionary } from "@/i18n/dictionaries/en";
import type { HabitCategory } from "./habits.schema";

// Category colours from the design reference, readable in both themes.
export const categoryBadgeClass: Record<HabitCategory, string> = {
  learning:
    "border-emerald-300 bg-emerald-500/15 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400",
  health:
    "border-rose-300 bg-rose-500/15 text-rose-700 dark:border-rose-800 dark:text-rose-400",
  productivity:
    "border-teal-300 bg-teal-500/15 text-teal-700 dark:border-teal-800 dark:text-teal-400",
  career:
    "border-amber-300 bg-amber-500/15 text-amber-800 dark:border-amber-800 dark:text-amber-400",
  personal:
    "border-orange-300 bg-orange-500/15 text-orange-700 dark:border-orange-800 dark:text-orange-400",
};

// ISO weekday (1 = Monday) -> short label in the current language.
export function weekdayLabel(t: Dictionary, isoDay: number) {
  return t.habits.weekdays[isoDay - 1];
}

export function describeSchedule(
  t: Dictionary,
  habit: {
    scheduleType: "days" | "weekly_target";
    daysOfWeek: number[];
    targetPerWeek: number | null;
  },
) {
  if (habit.scheduleType === "weekly_target") {
    return t.habits.schedule.perWeek(habit.targetPerWeek ?? 0);
  }
  if (habit.daysOfWeek.length === 7) return t.habits.schedule.everyDay;
  if (habit.daysOfWeek.join() === "1,2,3,4,5")
    return t.habits.schedule.weekdays;
  return habit.daysOfWeek.map((d) => weekdayLabel(t, d)).join(", ");
}
