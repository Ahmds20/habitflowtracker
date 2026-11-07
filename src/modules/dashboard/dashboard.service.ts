import "server-only";
import { addDays, startOfWeek, todayIn } from "@/lib/date";
import {
  countByStatus,
  listDueFollowUps,
} from "@/modules/applications/applications.service";
import type { SessionUser } from "@/modules/auth/session";
import { listHabits } from "@/modules/habits/habits.service";
import { listInterviews } from "@/modules/interviews/interviews.service";

// The dashboard only reads from other modules and owns no data (decision D17).
// One endpoint returns everything so the daily loop is a single request.

const UPCOMING_LIMIT = 5;

export async function getDashboard(user: SessionUser, now = new Date()) {
  const today = todayIn(user.timezone, now);
  const weekStart = startOfWeek(today);

  const [habits, pipeline, interviews, followUps] = await Promise.all([
    listHabits(user, { archived: false }, now),
    countByStatus(user.id),
    listInterviews(user.id, "upcoming", now),
    listDueFollowUps(user.id, today),
  ]);

  const linked = habits.find((h) => h.source === "applications") ?? null;
  const manual = habits.filter((h) => h.source === "manual");

  // Consistency = manual check-ins done this week / planned this week.
  // A weekly-target habit counts at most its target, so overachieving one
  // habit cannot hide a missed one.
  const planned = manual.reduce((sum, h) => sum + h.week.target, 0);
  const done = manual.reduce(
    (sum, h) => sum + Math.min(h.week.done, h.week.target),
    0,
  );

  // The habit with the longest running streak, for the dashboard stat card.
  const bestStreak = manual.reduce<(typeof manual)[number] | null>(
    (best, h) => (h.streak.current > (best?.streak.current ?? 0) ? h : best),
    null,
  );

  return {
    today,
    // First name for the greeting; the full name is in the sidebar.
    firstName: user.name.trim().split(/\s+/)[0] || user.name,
    bestStreak: bestStreak
      ? {
          name: bestStreak.name,
          current: bestStreak.streak.current,
          unit:
            bestStreak.scheduleType === "weekly_target"
              ? ("week" as const)
              : ("day" as const),
        }
      : null,
    week: {
      start: weekStart,
      end: addDays(weekStart, 6),
      applications: linked
        ? { done: linked.week.done, target: linked.week.target }
        : null,
      habitConsistency:
        planned === 0 ? null : Math.round((done / planned) * 100),
    },
    // Habits planned for today: days habits scheduled today, and weekly-target
    // habits that have not reached their target yet (or were done today).
    todayHabits: manual.filter(
      (h) =>
        h.today.scheduled &&
        (h.scheduleType === "days" ||
          h.today.done ||
          h.week.done < h.week.target),
    ),
    pipeline,
    upcomingInterviews: interviews.slice(0, UPCOMING_LIMIT),
    followUps,
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;
