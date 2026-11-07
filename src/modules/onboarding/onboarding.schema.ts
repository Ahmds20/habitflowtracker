import { z } from "zod";
import type { HabitCategory } from "@/modules/habits/habits.schema";

// Starter habits offered on the onboarding screen. Each is a simple
// "every weekday" or "N times a week" habit the user can edit later.
export const starterHabits = {
  practice_coding: {
    name: "Practice coding",
    category: "learning",
    schedule: { scheduleType: "days", daysOfWeek: [1, 2, 3, 4, 5] },
  },
  update_portfolio: {
    name: "Update portfolio or CV",
    category: "career",
    schedule: { scheduleType: "weekly_target", targetPerWeek: 1 },
  },
  study_english: {
    name: "Study English",
    category: "learning",
    schedule: { scheduleType: "days", daysOfWeek: [1, 2, 3, 4, 5] },
  },
  exercise: {
    name: "Exercise for 30 minutes",
    category: "health",
    schedule: { scheduleType: "weekly_target", targetPerWeek: 3 },
  },
} as const satisfies Record<
  string,
  {
    name: string;
    category: HabitCategory;
    schedule:
      | { scheduleType: "days"; daysOfWeek: readonly number[] }
      | { scheduleType: "weekly_target"; targetPerWeek: number };
  }
>;

export type StarterHabitKey = keyof typeof starterHabits;
const starterKeys = Object.keys(starterHabits) as [
  StarterHabitKey,
  ...StarterHabitKey[],
];

export const DEFAULT_WEEKLY_TARGET = 5;

export const onboardingSchema = z
  .object({
    weeklyTarget: z
      .int("Use a whole number")
      .min(1, "At least 1 application a week")
      .max(50, "At most 50 applications a week"),
    starterHabits: z
      .array(z.enum(starterKeys))
      .max(starterKeys.length)
      .default([])
      // Ignore duplicates.
      .transform((keys) => [...new Set(keys)]),
  })
  .strict();

export type OnboardingInput = z.infer<typeof onboardingSchema>;
