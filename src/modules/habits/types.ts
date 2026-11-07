// Client-side shapes of the habits API.
import type { DayStatus, Streaks } from "./streak";
import type { HabitCategory, ScheduleType } from "./habits.schema";

export type Habit = {
  id: string;
  name: string;
  description: string | null;
  category: HabitCategory;
  scheduleType: ScheduleType;
  daysOfWeek: number[];
  targetPerWeek: number | null;
  source: "manual" | "applications";
  startDate: string;
  archivedAt: string | null;
  createdAt: string;
  today: { date: string; scheduled: boolean; done: boolean };
  week: { done: number; target: number };
  streak: Streaks;
};

export type HabitDetail = Habit & {
  history: { date: string; status: DayStatus }[];
  linkedCount?: number;
};
