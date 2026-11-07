// Pure streak rules. No database or framework code, so every rule is unit tested.
//
// Rules:
// - Only scheduled days count. Unscheduled days neither add to nor break a streak.
// - Today never breaks a streak: the day is not over yet. It adds to it once done.
// - Days before the habit's start date do not exist for the streak.
// - Weekly-target habits count streaks in weeks (Monday start). The current week
//   counts once its target is met and never breaks the streak while it is running.

import {
  addDays,
  daysBetween,
  isoWeekday,
  startOfWeek,
  type LocalDate,
} from "@/lib/date";

export type DaysSchedule = {
  daysOfWeek: number[]; // ISO weekdays, 1 = Monday ... 7 = Sunday
  startDate: LocalDate;
};

export type WeeklySchedule = {
  target: number;
  startDate: LocalDate;
};

export type Streaks = { current: number; longest: number };

export type DayStatus = "done" | "missed" | "pending" | "unscheduled";

// Safety limit: never walk more than ~5 years of days.
const MAX_DAYS = 5 * 366;

export function isScheduled(schedule: DaysSchedule, date: LocalDate) {
  return (
    date >= schedule.startDate && schedule.daysOfWeek.includes(isoWeekday(date))
  );
}

export function dayStatus(
  schedule: DaysSchedule,
  done: ReadonlySet<LocalDate>,
  date: LocalDate,
  today: LocalDate,
): DayStatus {
  if (!isScheduled(schedule, date)) return "unscheduled";
  if (done.has(date)) return "done";
  return date === today ? "pending" : "missed";
}

export function dailyStreaks(
  schedule: DaysSchedule,
  checkins: Iterable<LocalDate>,
  today: LocalDate,
): Streaks {
  const done = new Set(checkins);
  const first =
    daysBetween(schedule.startDate, today) > MAX_DAYS
      ? addDays(today, -MAX_DAYS)
      : schedule.startDate;

  let run = 0;
  let longest = 0;
  // Walk forward from the start so `longest` sees every run.
  for (let date = first; date <= today; date = addDays(date, 1)) {
    const status = dayStatus(schedule, done, date, today);
    if (status === "done") {
      run += 1;
      longest = Math.max(longest, run);
    } else if (status === "missed") {
      run = 0;
    }
    // "unscheduled" and "pending" (today) leave the run as it is.
  }
  return { current: run, longest };
}

// `counts` maps each week's Monday to how many times the habit was done that week.
export function weeklyStreaks(
  schedule: WeeklySchedule,
  counts: ReadonlyMap<LocalDate, number>,
  today: LocalDate,
): Streaks {
  const thisWeek = startOfWeek(today);
  const firstWeek = startOfWeek(schedule.startDate);
  const earliest = startOfWeek(addDays(today, -MAX_DAYS));
  const start = firstWeek < earliest ? earliest : firstWeek;

  let run = 0;
  let longest = 0;
  for (let week = start; week <= thisWeek; week = addDays(week, 7)) {
    const met = (counts.get(week) ?? 0) >= schedule.target;
    if (met) {
      run += 1;
      longest = Math.max(longest, run);
    } else if (week !== thisWeek) {
      run = 0;
    }
  }
  return { current: run, longest };
}
