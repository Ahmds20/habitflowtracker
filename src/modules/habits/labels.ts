import type { HabitCategory } from "./habits.schema";

export const categoryLabels: Record<HabitCategory, string> = {
  learning: "Learning",
  health: "Health",
  productivity: "Productivity",
  career: "Career",
  personal: "Personal",
};

// ISO weekday -> short label.
export const weekdayLabels: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

export function describeSchedule(habit: {
  scheduleType: "days" | "weekly_target";
  daysOfWeek: number[];
  targetPerWeek: number | null;
}) {
  if (habit.scheduleType === "weekly_target") {
    return `${habit.targetPerWeek}× per week`;
  }
  if (habit.daysOfWeek.length === 7) return "Every day";
  if (habit.daysOfWeek.join() === "1,2,3,4,5") return "Weekdays";
  return habit.daysOfWeek.map((d) => weekdayLabels[d]).join(", ");
}
