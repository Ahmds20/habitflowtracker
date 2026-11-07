import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  addDays,
  fromDbDate,
  startOfWeek,
  todayIn,
  toDbDate,
  type LocalDate,
} from "@/lib/date";
import { AppError } from "@/lib/errors";
import { countAppliedInRange } from "@/modules/applications/applications.service";
import type { SessionUser } from "@/modules/auth/session";
import {
  CHECKIN_WINDOW_DAYS,
  type CreateHabitInput,
  type UpdateHabitInput,
} from "./habits.schema";
import {
  dailyStreaks,
  dayStatus,
  isScheduled,
  weeklyStreaks,
  type DayStatus,
} from "./streak";

// Habits have a user_id; check-ins do not. Check-ins are always reached
// through their habit (`habit: { userId }`), so ownership cannot be skipped.

const HISTORY_DAYS = 30;
const notFound = () => new AppError("NOT_FOUND", "Habit not found");

const habitSelect = {
  id: true,
  name: true,
  description: true,
  category: true,
  scheduleType: true,
  daysOfWeek: true,
  targetPerWeek: true,
  source: true,
  startDate: true,
  archivedAt: true,
  createdAt: true,
} satisfies Prisma.HabitSelect;

type HabitRow = Prisma.HabitGetPayload<{ select: typeof habitSelect }>;

// ---------- Progress ----------

// Done dates for a manual habit, or applied dates for the linked habit.
async function loadDoneDates(
  userId: string,
  habit: HabitRow,
  from: LocalDate,
): Promise<LocalDate[]> {
  if (habit.source === "applications") {
    // The goal is weekly, so count the whole week the habit started in:
    // applications sent on Monday still count after onboarding on Wednesday.
    const rows = await db.application.findMany({
      where: {
        userId,
        status: { not: "wishlist" },
        appliedDate: { gte: toDbDate(startOfWeek(from)) },
      },
      select: { appliedDate: true },
    });
    return rows.map((r) => fromDbDate(r.appliedDate!));
  }
  const rows = await db.habitCheckin.findMany({
    where: { habitId: habit.id, date: { gte: toDbDate(from) } },
    select: { date: true },
  });
  return rows.map((r) => fromDbDate(r.date));
}

function weekCounts(dates: LocalDate[]) {
  const counts = new Map<LocalDate, number>();
  for (const date of dates) {
    const week = startOfWeek(date);
    counts.set(week, (counts.get(week) ?? 0) + 1);
  }
  return counts;
}

function toProgress(habit: HabitRow, done: LocalDate[], today: LocalDate) {
  const startDate = fromDbDate(habit.startDate);
  const doneSet = new Set(done);
  const thisWeek = startOfWeek(today);
  const doneThisWeek = done.filter((d) => d >= thisWeek && d <= today).length;

  if (habit.scheduleType === "days") {
    const schedule = { daysOfWeek: habit.daysOfWeek, startDate };
    // Target for a days habit = scheduled days this week (from its start).
    let target = 0;
    for (let d = thisWeek; d <= addDays(thisWeek, 6); d = addDays(d, 1)) {
      if (isScheduled(schedule, d)) target += 1;
    }
    const weekDone = done.filter(
      (d) => d >= thisWeek && d <= today && isScheduled(schedule, d),
    ).length;
    return {
      // `date` is today in the user's timezone; the client checks in with it.
      today: {
        date: today,
        scheduled: isScheduled(schedule, today),
        done: doneSet.has(today),
      },
      week: { done: weekDone, target },
      streak: dailyStreaks(schedule, done, today),
    };
  }

  const target = habit.targetPerWeek!;
  return {
    today: { date: today, scheduled: true, done: doneSet.has(today) },
    week: { done: doneThisWeek, target },
    streak: weeklyStreaks({ target, startDate }, weekCounts(done), today),
  };
}

function toHabit(habit: HabitRow) {
  return {
    ...habit,
    startDate: fromDbDate(habit.startDate),
    targetPerWeek: habit.targetPerWeek,
  };
}

export type HabitWithProgress = ReturnType<typeof toHabit> &
  ReturnType<typeof toProgress>;

async function withProgress(
  user: SessionUser,
  habit: HabitRow,
  today: LocalDate,
): Promise<HabitWithProgress> {
  const done = await loadDoneDates(user.id, habit, fromDbDate(habit.startDate));
  return { ...toHabit(habit), ...toProgress(habit, done, today) };
}

// ---------- Queries ----------

export async function listHabits(
  user: SessionUser,
  { archived }: { archived: boolean },
  now = new Date(),
) {
  const today = todayIn(user.timezone, now);
  const habits = await db.habit.findMany({
    where: {
      userId: user.id,
      archivedAt: archived ? { not: null } : null,
    },
    select: habitSelect,
    // Linked habit first, then oldest first so the order stays stable.
    orderBy: [{ source: "desc" }, { createdAt: "asc" }],
  });
  return Promise.all(habits.map((habit) => withProgress(user, habit, today)));
}

async function findOwned(userId: string, id: string) {
  const habit = await db.habit.findFirst({
    where: { id, userId },
    select: habitSelect,
  });
  if (!habit) throw notFound();
  return habit;
}

export async function getHabit(
  user: SessionUser,
  id: string,
  now = new Date(),
) {
  const today = todayIn(user.timezone, now);
  const habit = await findOwned(user.id, id);
  const startDate = fromDbDate(habit.startDate);
  const done = await loadDoneDates(user.id, habit, startDate);
  const doneSet = new Set(done);

  // Oldest first, ending today.
  const history: { date: LocalDate; status: DayStatus }[] = [];
  for (let i = HISTORY_DAYS - 1; i >= 0; i -= 1) {
    const date = addDays(today, -i);
    let status: DayStatus;
    if (date < startDate) status = "unscheduled";
    else if (habit.scheduleType === "days") {
      status = dayStatus(
        { daysOfWeek: habit.daysOfWeek, startDate },
        doneSet,
        date,
        today,
      );
    } else {
      // Weekly targets have no fixed days: a day is done or simply open.
      status = doneSet.has(date) ? "done" : "unscheduled";
    }
    history.push({ date, status });
  }

  return {
    ...toHabit(habit),
    ...toProgress(habit, done, today),
    history,
    // How many applications count this week (linked habit only).
    ...(habit.source === "applications" && {
      linkedCount: await countAppliedInRange(
        user.id,
        startOfWeek(today),
        addDays(startOfWeek(today), 6),
      ),
    }),
  };
}

// ---------- Mutations ----------

export async function createHabit(
  user: SessionUser,
  input: CreateHabitInput,
  now = new Date(),
) {
  const today = todayIn(user.timezone, now);
  const habit = await db.habit.create({
    data: {
      userId: user.id,
      name: input.name,
      description: input.description ?? null,
      category: input.category,
      scheduleType: input.scheduleType,
      daysOfWeek: input.scheduleType === "days" ? input.daysOfWeek : [],
      targetPerWeek:
        input.scheduleType === "weekly_target" ? input.targetPerWeek : null,
      startDate: toDbDate(input.startDate ?? today),
    },
    select: habitSelect,
  });
  return withProgress(user, habit, today);
}

export async function updateHabit(
  user: SessionUser,
  id: string,
  input: UpdateHabitInput,
  now = new Date(),
) {
  const current = await findOwned(user.id, id);

  if (current.scheduleType === "days" && input.targetPerWeek !== undefined) {
    throw new AppError("VALIDATION_ERROR", "Invalid request", {
      targetPerWeek: ["This habit uses selected days, not a weekly target"],
    });
  }
  if (current.scheduleType === "weekly_target" && input.daysOfWeek) {
    throw new AppError("VALIDATION_ERROR", "Invalid request", {
      daysOfWeek: ["This habit uses a weekly target, not selected days"],
    });
  }

  const habit = await db.habit.update({
    where: { id },
    data: input,
    select: habitSelect,
  });
  return withProgress(user, habit, todayIn(user.timezone, now));
}

function assertManual(habit: HabitRow, action: string) {
  if (habit.source === "applications") {
    throw new AppError(
      "CONFLICT",
      `The weekly applications goal cannot be ${action}`,
    );
  }
}

export async function setArchived(
  user: SessionUser,
  id: string,
  archived: boolean,
  now = new Date(),
) {
  const current = await findOwned(user.id, id);
  assertManual(current, "archived");
  const habit = await db.habit.update({
    where: { id },
    data: { archivedAt: archived ? now : null },
    select: habitSelect,
  });
  return withProgress(user, habit, todayIn(user.timezone, now));
}

export async function deleteHabit(user: SessionUser, id: string) {
  const current = await findOwned(user.id, id);
  assertManual(current, "deleted");
  await db.habit.delete({ where: { id } });
}

// Rules shared by check-in and undo.
async function checkinTarget(
  user: SessionUser,
  id: string,
  date: LocalDate,
  now: Date,
) {
  const habit = await findOwned(user.id, id);
  assertManual(habit, "checked in by hand");
  if (habit.archivedAt) {
    throw new AppError("CONFLICT", "Unarchive this habit to check in");
  }

  const today = todayIn(user.timezone, now);
  const invalid = (message: string) =>
    new AppError("VALIDATION_ERROR", message, { date: [message] });
  if (date > today) throw invalid("You cannot check in for a future day");
  if (date < addDays(today, -CHECKIN_WINDOW_DAYS)) {
    throw invalid(
      `Check-ins can only be changed for the last ${CHECKIN_WINDOW_DAYS} days`,
    );
  }
  if (date < fromDbDate(habit.startDate)) {
    throw invalid("This day is before the habit started");
  }
  return { habit, today };
}

// Idempotent: checking in twice for the same day is fine.
export async function checkIn(
  user: SessionUser,
  id: string,
  date: LocalDate,
  now = new Date(),
) {
  const { habit, today } = await checkinTarget(user, id, date, now);
  try {
    await db.habitCheckin.create({
      data: { habitId: id, date: toDbDate(date) },
    });
  } catch (error) {
    const duplicate =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";
    if (!duplicate) throw error;
  }
  return withProgress(user, habit, today);
}

export async function undoCheckIn(
  user: SessionUser,
  id: string,
  date: LocalDate,
  now = new Date(),
) {
  const { habit, today } = await checkinTarget(user, id, date, now);
  await db.habitCheckin.deleteMany({
    where: { habitId: id, date: toDbDate(date) },
  });
  return withProgress(user, habit, today);
}
