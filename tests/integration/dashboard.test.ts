import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import type { SessionUser } from "@/modules/auth/session";
import {
  changeStatus,
  createApplication,
} from "@/modules/applications/applications.service";
import { createApplicationSchema } from "@/modules/applications/applications.schema";
import { getDashboard } from "@/modules/dashboard/dashboard.service";
import { createHabitSchema } from "@/modules/habits/habits.schema";
import { checkIn, createHabit } from "@/modules/habits/habits.service";
import { createInterview } from "@/modules/interviews/interviews.service";
import { onboardingSchema } from "@/modules/onboarding/onboarding.schema";
import {
  completeOnboarding,
  isOnboarded,
} from "@/modules/onboarding/onboarding.service";
import { createTestUser } from "./helpers";

// Wednesday 11 November 2026, 10:00 in Jakarta. Week: Mon 9 - Sun 15.
const NOW = new Date("2026-11-11T03:00:00Z");
const TODAY = "2026-11-11";

let alice: SessionUser;
let bob: SessionUser;

beforeEach(async () => {
  await db.user.deleteMany();
  alice = await createTestUser({ name: "Alice" });
  bob = await createTestUser({ name: "Bob" });
});

function onboard(user: SessionUser, input: Record<string, unknown> = {}) {
  return completeOnboarding(
    user,
    onboardingSchema.parse({ weeklyTarget: 5, ...input }),
    NOW,
  );
}

function apply(user: SessionUser, input: Record<string, unknown> = {}) {
  return createApplication(
    user,
    createApplicationSchema.parse({
      company: "Acme",
      position: "Dev",
      ...input,
    }),
  );
}

describe("onboarding", () => {
  it("creates the linked habit and the chosen starter habits", async () => {
    expect(await isOnboarded(alice.id)).toBe(false);
    await onboard(alice, {
      weeklyTarget: 8,
      starterHabits: ["practice_coding", "exercise", "exercise"],
    });

    expect(await isOnboarded(alice.id)).toBe(true);
    const habits = await db.habit.findMany({
      where: { userId: alice.id },
      orderBy: { name: "asc" },
    });
    expect(habits.map((h) => h.name)).toEqual([
      "Exercise for 30 minutes",
      "Practice coding",
      "Send 8 applications",
    ]);
    const linked = habits.find((h) => h.source === "applications")!;
    expect(linked.targetPerWeek).toBe(8);
    expect(linked.startDate.toISOString().slice(0, 10)).toBe(TODAY);
  });

  it("can only be completed once", async () => {
    await onboard(alice);
    await expect(onboard(alice)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await db.habit.count({ where: { userId: alice.id } })).toBe(1);
  });

  it("does not affect other users", async () => {
    await onboard(alice);
    expect(await isOnboarded(bob.id)).toBe(false);
  });

  it("validates the weekly target", () => {
    expect(onboardingSchema.safeParse({ weeklyTarget: 0 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ weeklyTarget: 2.5 }).success).toBe(
      false,
    );
    expect(
      onboardingSchema.safeParse({ weeklyTarget: 5, starterHabits: ["nope"] })
        .success,
    ).toBe(false);
  });
});

describe("getDashboard", () => {
  it("summarizes the week, pipeline, interviews, and follow-ups", async () => {
    await onboard(alice, { weeklyTarget: 3 });

    await apply(alice, { appliedDate: "2026-11-09" });
    const second = await apply(alice, { appliedDate: TODAY });
    await apply(alice, { appliedDate: "2026-11-02" }); // last week
    await apply(alice, { status: "wishlist" });
    await changeStatus(alice, second.id, { status: "interview" });

    await createInterview(alice.id, second.id, {
      scheduledAt: "2026-11-13T02:00:00Z",
      type: "video",
    });
    await createInterview(alice.id, second.id, {
      scheduledAt: "2026-11-01T02:00:00Z", // past
      type: "phone",
    });

    const dueToday = await apply(alice, {
      appliedDate: "2026-11-02",
      followUpDate: TODAY,
    });
    await apply(alice, {
      appliedDate: "2026-11-02",
      followUpDate: "2026-11-20",
    }); // not due
    const closed = await apply(alice, {
      appliedDate: "2026-11-02",
      followUpDate: "2026-11-01",
    });
    await changeStatus(alice, closed.id, {
      status: "closed",
      outcome: "rejected",
    });

    const dashboard = await getDashboard(alice, NOW);

    expect(dashboard.today).toBe(TODAY);
    expect(dashboard.week.start).toBe("2026-11-09");
    // Mon 9 and Wed 11 count. Mon 9 is before onboarding (Wed 11) but in the
    // same week, so it still counts toward the weekly goal.
    expect(dashboard.week.applications).toEqual({ done: 2, target: 3 });
    expect(dashboard.pipeline).toEqual({
      wishlist: 1,
      applied: 4,
      assessment: 0,
      interview: 1,
      offer: 0,
      closed: 1,
    });
    expect(dashboard.upcomingInterviews).toHaveLength(1);
    expect(dashboard.followUps.map((a) => a.id)).toEqual([dueToday.id]);
  });

  it("computes habit consistency and today's habits", async () => {
    await onboard(alice);
    const daily = await createHabit(
      alice,
      createHabitSchema.parse({
        name: "Code",
        category: "learning",
        scheduleType: "days",
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        startDate: "2026-11-09",
      }),
      NOW,
    );
    await createHabit(
      alice,
      createHabitSchema.parse({
        name: "Weekend only",
        category: "health",
        scheduleType: "days",
        daysOfWeek: [6, 7],
        startDate: "2026-11-09",
      }),
      NOW,
    );
    await checkIn(alice, daily.id, "2026-11-09", NOW);
    await checkIn(alice, daily.id, TODAY, NOW);

    const dashboard = await getDashboard(alice, NOW);
    // Planned this week: 7 (daily) + 2 (weekend) = 9. Done: 2.
    expect(dashboard.week.habitConsistency).toBe(22);
    // Weekend habit is not scheduled on Wednesday; the linked habit is never listed.
    expect(dashboard.todayHabits.map((h) => h.name)).toEqual(["Code"]);
    expect(dashboard.todayHabits[0].today.done).toBe(true);
  });

  it("returns empty sections for a new user", async () => {
    const dashboard = await getDashboard(bob, NOW);
    expect(dashboard.week.applications).toBeNull();
    expect(dashboard.week.habitConsistency).toBeNull();
    expect(dashboard.todayHabits).toEqual([]);
    expect(dashboard.upcomingInterviews).toEqual([]);
    expect(dashboard.followUps).toEqual([]);
  });

  it("never includes another user's data", async () => {
    await onboard(alice);
    await apply(alice, { followUpDate: TODAY });
    const dashboard = await getDashboard(bob, NOW);
    expect(Object.values(dashboard.pipeline).every((n) => n === 0)).toBe(true);
    expect(dashboard.followUps).toEqual([]);
  });
});
