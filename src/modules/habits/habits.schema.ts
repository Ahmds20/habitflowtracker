import { z } from "zod";
import { isLocalDate } from "@/lib/date";

export const habitCategories = [
  "learning",
  "health",
  "productivity",
  "career",
  "personal",
] as const;
export type HabitCategory = (typeof habitCategories)[number];

export const scheduleTypes = ["days", "weekly_target"] as const;
export type ScheduleType = (typeof scheduleTypes)[number];

// How far back a check-in may be added or removed (decision D8).
export const CHECKIN_WINDOW_DAYS = 7;

const localDate = z
  .string()
  .refine(isLocalDate, "Use a valid date (YYYY-MM-DD)");

const name = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(80, "Name must be at most 80 characters");

const description = z
  .string()
  .trim()
  .max(500, "Must be at most 500 characters")
  .transform((value) => value || null)
  .nullable()
  .optional();

const daysOfWeek = z
  .array(z.int().min(1).max(7))
  .min(1, "Pick at least one day")
  .max(7)
  // Store each weekday once, Monday first.
  .transform((days) => [...new Set(days)].sort((a, b) => a - b));

const targetPerWeek = z
  .int("Use a whole number")
  .min(1, "At least once a week")
  .max(50, "At most 50 times a week");

// The schedule is one of two shapes. Changing the type later is not allowed
// (create a new habit instead), so only the fields of the current type can be edited.
const daysHabit = z.object({
  scheduleType: z.literal("days"),
  daysOfWeek,
});
const weeklyHabit = z.object({
  scheduleType: z.literal("weekly_target"),
  targetPerWeek,
});

const common = {
  name,
  description,
  category: z.enum(habitCategories),
  startDate: localDate.optional(),
};

// Manual habits only. The linked (applications) habit is created during onboarding (M4).
export const createHabitSchema = z.discriminatedUnion("scheduleType", [
  daysHabit.extend(common).strict(),
  weeklyHabit.extend(common).strict(),
]);

export const updateHabitSchema = z
  .object({
    name: name.optional(),
    description,
    category: z.enum(habitCategories).optional(),
    daysOfWeek: daysOfWeek.optional(),
    targetPerWeek: targetPerWeek.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nothing to update",
  });

export const listHabitsQuery = z.object({
  archived: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export const checkinDateParam = localDate;

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
