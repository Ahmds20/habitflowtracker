import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  addDays,
  isoWeekday,
  startOfWeek,
  todayIn,
  toDbDate,
  type LocalDate,
} from "@/lib/date";
import type { ApplicationStatus } from "@/modules/applications/applications.schema";
import en, { type Dictionary } from "@/i18n/dictionaries/en";
import { createSession } from "@/modules/auth/session";

// "Try demo" creates a fresh, private demo account per visitor (decision D9),
// filled with realistic data so the dashboard looks alive on the first visit.
// Every date is relative to "today" in the visitor's timezone.

// Demo users are deleted by the cleanup cron after this long.
export const DEMO_TTL_HOURS = 24;

const DEMO_WEEKLY_TARGET = 5;

type Seed = {
  company: string;
  position: string;
  location: string;
  // Status path from first to current; the last entry is the current status.
  path: ApplicationStatus[];
  outcome?: "accepted" | "rejected" | "withdrawn";
  // Days ago the application was sent (null = wishlist, not sent yet).
  appliedDaysAgo: number | null;
  followUpInDays?: number;
  interviewInDays?: number;
  note?: "referralNote" | "offerNote";
};

const applicationSeeds: Seed[] = [
  {
    company: "Tokopedia",
    position: "Frontend Engineer",
    location: "Jakarta",
    path: ["applied", "assessment", "interview"],
    appliedDaysAgo: 16,
    interviewInDays: 2,
    note: "referralNote",
  },
  {
    company: "Gojek",
    position: "Software Engineer, Backend",
    location: "Jakarta",
    path: ["applied", "assessment"],
    appliedDaysAgo: 9,
    followUpInDays: 0,
  },
  {
    company: "Traveloka",
    position: "Full Stack Engineer",
    location: "Tangerang",
    path: ["applied", "assessment", "interview", "offer"],
    appliedDaysAgo: 30,
    note: "offerNote",
  },
  {
    company: "Shopee",
    position: "Software Engineer",
    location: "Jakarta",
    path: ["applied", "interview"],
    appliedDaysAgo: 12,
    interviewInDays: 5,
  },
  {
    company: "Bukalapak",
    position: "React Developer",
    location: "Remote",
    path: ["applied"],
    appliedDaysAgo: 3,
  },
  {
    company: "Blibli",
    position: "Junior Web Developer",
    location: "Jakarta",
    path: ["applied"],
    appliedDaysAgo: 1,
    followUpInDays: 6,
  },
  {
    company: "Xendit",
    position: "Software Engineer, Payments",
    location: "Remote",
    path: ["applied"],
    appliedDaysAgo: 0,
  },
  {
    company: "Ruangguru",
    position: "Frontend Developer",
    location: "Jakarta",
    path: ["applied", "closed"],
    outcome: "rejected",
    appliedDaysAgo: 21,
  },
  {
    company: "Kitabisa",
    position: "Web Engineer",
    location: "Jakarta",
    path: ["applied", "assessment", "closed"],
    outcome: "rejected",
    appliedDaysAgo: 25,
  },
  {
    company: "Mekari",
    position: "Software Engineer Intern",
    location: "Yogyakarta",
    path: ["applied", "closed"],
    outcome: "withdrawn",
    appliedDaysAgo: 18,
  },
  {
    company: "Halodoc",
    position: "Frontend Engineer",
    location: "Jakarta",
    path: ["applied"],
    appliedDaysAgo: 5,
  },
  {
    company: "eFishery",
    position: "Full Stack Developer",
    location: "Bandung",
    path: ["applied", "assessment"],
    appliedDaysAgo: 7,
  },
  {
    company: "Flip",
    position: "Backend Engineer",
    location: "Jakarta",
    path: ["wishlist"],
    appliedDaysAgo: null,
  },
  {
    company: "Stockbit",
    position: "Software Engineer",
    location: "Jakarta",
    path: ["wishlist"],
    appliedDaysAgo: null,
  },
  {
    company: "Pintu",
    position: "Frontend Engineer",
    location: "Remote",
    path: ["wishlist"],
    appliedDaysAgo: null,
  },
];

const habitSeeds = [
  {
    key: "practice_coding",
    category: "learning",
    schedule: { scheduleType: "days", daysOfWeek: [1, 2, 3, 4, 5] },
    hitRate: 0.85,
  },
  {
    key: "study_english",
    category: "learning",
    // Every day, so a visitor always has a habit to check in, even on weekends.
    schedule: { scheduleType: "days", daysOfWeek: [1, 2, 3, 4, 5, 6, 7] },
    hitRate: 0.7,
  },
  {
    key: "update_portfolio",
    category: "career",
    schedule: { scheduleType: "weekly_target", targetPerWeek: 1 },
    hitRate: 0.3,
  },
  {
    key: "exercise",
    category: "health",
    schedule: { scheduleType: "weekly_target", targetPerWeek: 3 },
    hitRate: 0.5,
  },
] as const;

const HISTORY_DAYS = 21;

// Deterministic pseudo-random so every demo looks the same and tests are stable.
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function atLocalHour(date: LocalDate, hourUtc: number) {
  return new Date(`${date}T${String(hourUtc).padStart(2, "0")}:00:00.000Z`);
}

function buildApplications(userId: string, today: LocalDate, t: Dictionary) {
  const applications: Prisma.ApplicationCreateManyInput[] = [];
  const events: Prisma.ApplicationStatusEventCreateManyInput[] = [];
  const interviews: Prisma.InterviewCreateManyInput[] = [];

  applicationSeeds.forEach((seed, index) => {
    const id = crypto.randomUUID();
    const appliedDate =
      seed.appliedDaysAgo === null
        ? null
        : addDays(today, -seed.appliedDaysAgo);
    const status = seed.path.at(-1)!;

    // Spread status changes between the applied date and today.
    const start = seed.appliedDaysAgo ?? 2;
    const steps = seed.path.length;
    const changeDates = seed.path.map((_, i) =>
      addDays(today, -Math.round(start - (start * i) / Math.max(1, steps))),
    );

    seed.path.forEach((toStatus, i) => {
      events.push({
        applicationId: id,
        fromStatus: i === 0 ? null : seed.path[i - 1],
        toStatus,
        outcome: toStatus === "closed" ? seed.outcome : null,
        // Morning UTC, plus the index so events never share a timestamp.
        changedAt: new Date(
          atLocalHour(changeDates[i], 2).getTime() + index * 60_000,
        ),
      });
    });

    applications.push({
      id,
      userId,
      company: seed.company,
      position: seed.position,
      location: seed.location,
      employmentType: "full_time",
      status,
      outcome: status === "closed" ? seed.outcome : null,
      appliedDate: appliedDate ? toDbDate(appliedDate) : null,
      followUpDate:
        seed.followUpInDays === undefined
          ? null
          : toDbDate(addDays(today, seed.followUpInDays)),
      notes: seed.note ? t.demoData[seed.note] : null,
      statusChangedAt: new Date(
        atLocalHour(changeDates.at(-1)!, 2).getTime() + index * 60_000,
      ),
    });

    if (seed.interviewInDays !== undefined) {
      interviews.push({
        applicationId: id,
        // 10:00 Jakarta = 03:00 UTC; close enough for any demo visitor.
        scheduledAt: atLocalHour(addDays(today, seed.interviewInDays), 3),
        type: "video",
        title: t.demoData.interviewTitle,
        meetingUrl: "https://meet.example.com/habitflow-demo",
        notes: t.demoData.interviewNotes,
      });
    }
  });

  return { applications, events, interviews };
}

function buildHabits(userId: string, today: LocalDate, t: Dictionary) {
  const habits: Prisma.HabitCreateManyInput[] = [];
  const checkins: Prisma.HabitCheckinCreateManyInput[] = [];
  const startDate = addDays(today, -HISTORY_DAYS);
  const random = seeded(42);

  habits.push({
    userId,
    name: t.onboarding.linkedName(DEMO_WEEKLY_TARGET),
    category: "career",
    scheduleType: "weekly_target",
    targetPerWeek: DEMO_WEEKLY_TARGET,
    source: "applications",
    startDate: toDbDate(startDate),
  });

  for (const seed of habitSeeds) {
    const id = crypto.randomUUID();
    const { schedule } = seed;
    habits.push({
      id,
      userId,
      name: t.onboarding.starters[seed.key],
      category: seed.category,
      scheduleType: schedule.scheduleType,
      daysOfWeek:
        schedule.scheduleType === "days" ? [...schedule.daysOfWeek] : [],
      targetPerWeek:
        schedule.scheduleType === "weekly_target"
          ? schedule.targetPerWeek
          : null,
      startDate: toDbDate(startDate),
    });

    // Leave today open so the visitor can check in themselves.
    for (let day = startDate; day < today; day = addDays(day, 1)) {
      const scheduled =
        schedule.scheduleType === "weekly_target" ||
        (schedule.daysOfWeek as readonly number[]).includes(isoWeekday(day));
      // Keep the last few days done so streaks are visible.
      const recent = day >= addDays(today, -3);
      if (scheduled && (recent || random() < seed.hitRate)) {
        checkins.push({ habitId: id, date: toDbDate(day) });
      }
    }
  }
  return { habits, checkins };
}

export async function createDemoUser(
  timezone: string,
  now = new Date(),
  t: Dictionary = en,
) {
  const today = todayIn(timezone, now);
  const id = crypto.randomUUID();

  const { applications, events, interviews } = buildApplications(id, today, t);
  const { habits, checkins } = buildHabits(id, today, t);

  await db.$transaction([
    db.user.create({
      data: {
        id,
        email: `demo-${id}@demo.habitflow.local`,
        name: t.demoData.userName,
        timezone,
        isDemo: true,
        // Not a valid argon2 hash, so no password can ever log in to this account.
        passwordHash: `demo-account-no-password-${crypto.randomUUID()}`,
      },
    }),
    db.application.createMany({ data: applications }),
    db.applicationStatusEvent.createMany({ data: events }),
    db.interview.createMany({ data: interviews }),
    db.habit.createMany({ data: habits }),
    db.habitCheckin.createMany({ data: checkins }),
  ]);

  return {
    userId: id,
    session: await createSession(id),
    weekStart: startOfWeek(today),
  };
}

// Called by the daily cron. Cascades delete sessions, applications, and habits.
export async function deleteExpiredDemoUsers(now = new Date()) {
  const cutoff = new Date(now.getTime() - DEMO_TTL_HOURS * 60 * 60 * 1000);
  const { count } = await db.user.deleteMany({
    where: { isDemo: true, createdAt: { lt: cutoff } },
  });
  return count;
}
