import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { toDbDate } from "@/lib/date";
import type { SessionUser } from "@/modules/auth/session";
import { createApplication } from "@/modules/applications/applications.service";
import { createApplicationSchema } from "@/modules/applications/applications.schema";
import { createHabitSchema } from "@/modules/habits/habits.schema";
import {
  checkIn,
  createHabit,
  deleteHabit,
  getHabit,
  listHabits,
  setArchived,
  undoCheckIn,
  updateHabit,
} from "@/modules/habits/habits.service";
import { createTestUser } from "./helpers";

// "Now" is fixed: Wednesday 11 November 2026, 10:00 in Jakarta (UTC+7).
// Week of Monday 9 November. Jakarta is used for every user here.
const NOW = new Date("2026-11-11T03:00:00Z");
const TODAY = "2026-11-11";

let alice: SessionUser;
let bob: SessionUser;

beforeEach(async () => {
  await db.user.deleteMany();
  alice = await createTestUser({ name: "Alice" });
  bob = await createTestUser({ name: "Bob" });
});

function create(user: SessionUser, input: Record<string, unknown>) {
  return createHabit(
    user,
    createHabitSchema.parse({
      name: "Practice coding",
      category: "learning",
      startDate: "2026-11-02",
      ...input,
    }),
    NOW,
  );
}

const everyDay = { scheduleType: "days", daysOfWeek: [1, 2, 3, 4, 5, 6, 7] };

// The linked habit is created by onboarding in M4; tests insert it directly.
async function createLinkedHabit(user: SessionUser, target = 3) {
  return db.habit.create({
    data: {
      userId: user.id,
      name: "Send applications",
      category: "career",
      scheduleType: "weekly_target",
      targetPerWeek: target,
      source: "applications",
      startDate: toDbDate("2026-11-02"),
    },
  });
}

describe("createHabit", () => {
  it("normalizes weekdays and starts today by default", async () => {
    const habit = await createHabit(
      alice,
      createHabitSchema.parse({
        name: "Gym",
        category: "health",
        scheduleType: "days",
        daysOfWeek: [5, 1, 3, 1],
      }),
      NOW,
    );
    expect(habit.daysOfWeek).toEqual([1, 3, 5]);
    expect(habit.startDate).toBe(TODAY);
    expect(habit.today).toEqual({ date: TODAY, scheduled: true, done: false }); // Wednesday
  });

  it("rejects mixed schedule fields", () => {
    const result = createHabitSchema.safeParse({
      name: "Read",
      category: "learning",
      scheduleType: "days",
      daysOfWeek: [1],
      targetPerWeek: 3,
    });
    expect(result.success).toBe(false);
  });
});

describe("check-ins", () => {
  it("checks in, is idempotent, and can be undone", async () => {
    const habit = await create(alice, everyDay);

    const first = await checkIn(alice, habit.id, TODAY, NOW);
    const again = await checkIn(alice, habit.id, TODAY, NOW);
    expect(first.today.done).toBe(true);
    expect(again.today.done).toBe(true);
    expect(await db.habitCheckin.count()).toBe(1);

    const undone = await undoCheckIn(alice, habit.id, TODAY, NOW);
    expect(undone.today.done).toBe(false);
    expect(await db.habitCheckin.count()).toBe(0);
  });

  it("allows today and the 7 previous days only", async () => {
    const habit = await create(alice, everyDay);
    await expect(
      checkIn(alice, habit.id, "2026-11-04", NOW),
    ).resolves.toBeDefined();
    await expect(
      checkIn(alice, habit.id, "2026-11-03", NOW),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    await expect(
      checkIn(alice, habit.id, "2026-11-12", NOW),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("uses the user's timezone to decide what today is", async () => {
    // 2026-11-11 20:00 UTC is already 12 November in Jakarta.
    const late = new Date("2026-11-11T20:00:00Z");
    const habit = await create(alice, everyDay);
    await expect(
      checkIn(alice, habit.id, "2026-11-12", late),
    ).resolves.toBeDefined();

    const newYorker = await createTestUser({ timezone: "America/New_York" });
    const theirs = await create(newYorker, everyDay);
    await expect(
      checkIn(newYorker, theirs.id, "2026-11-12", late),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rejects days before the habit started", async () => {
    const habit = await create(alice, { ...everyDay, startDate: TODAY });
    await expect(
      checkIn(alice, habit.id, "2026-11-10", NOW),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("computes the streak from check-ins", async () => {
    const habit = await create(alice, everyDay);
    for (const date of ["2026-11-08", "2026-11-09", "2026-11-10", TODAY]) {
      await checkIn(alice, habit.id, date, NOW);
    }
    const detail = await getHabit(alice, habit.id, NOW);
    expect(detail.streak).toEqual({ current: 4, longest: 4 });
    expect(detail.week).toEqual({ done: 3, target: 7 });
    expect(detail.history).toHaveLength(30);
    expect(detail.history.at(-1)).toEqual({ date: TODAY, status: "done" });
    expect(detail.history.at(-5)).toEqual({
      date: "2026-11-07",
      status: "missed",
    });
  });

  it("is blocked while the habit is archived", async () => {
    const habit = await create(alice, everyDay);
    await setArchived(alice, habit.id, true, NOW);
    await expect(checkIn(alice, habit.id, TODAY, NOW)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});

describe("weekly target habits", () => {
  it("counts check-ins this week against the target", async () => {
    const habit = await create(alice, {
      scheduleType: "weekly_target",
      targetPerWeek: 2,
    });
    await checkIn(alice, habit.id, "2026-11-09", NOW);
    const result = await checkIn(alice, habit.id, TODAY, NOW);
    expect(result.week).toEqual({ done: 2, target: 2 });
    expect(result.streak.current).toBe(1);
  });
});

describe("linked applications habit", () => {
  it("counts applications sent this week, ignoring wishlist", async () => {
    await createLinkedHabit(alice, 3);
    const add = (input: Record<string, unknown>) =>
      createApplication(
        alice,
        createApplicationSchema.parse({
          company: "Acme",
          position: "Dev",
          ...input,
        }),
      );
    await add({ appliedDate: "2026-11-09" });
    await add({ appliedDate: "2026-11-10" });
    await add({ appliedDate: "2026-11-06" }); // last week
    await add({ status: "wishlist" });

    const [linked] = await listHabits(alice, { archived: false }, NOW);
    expect(linked.source).toBe("applications");
    expect(linked.week).toEqual({ done: 2, target: 3 });
  });

  it("cannot be checked in, archived, or deleted by hand", async () => {
    const linked = await createLinkedHabit(alice);
    const conflict = { code: "CONFLICT" };
    await expect(checkIn(alice, linked.id, TODAY, NOW)).rejects.toMatchObject(
      conflict,
    );
    await expect(
      setArchived(alice, linked.id, true, NOW),
    ).rejects.toMatchObject(conflict);
    await expect(deleteHabit(alice, linked.id)).rejects.toMatchObject(conflict);
  });

  it("allows only one per user", async () => {
    await createLinkedHabit(alice);
    await expect(createLinkedHabit(alice)).rejects.toThrow(/Unique constraint/);
  });

  it("lets the user change the target", async () => {
    const linked = await createLinkedHabit(alice, 3);
    const updated = await updateHabit(
      alice,
      linked.id,
      { targetPerWeek: 10 },
      NOW,
    );
    expect(updated.week.target).toBe(10);
  });
});

describe("archive and list", () => {
  it("moves archived habits to the archived list", async () => {
    const habit = await create(alice, everyDay);
    await setArchived(alice, habit.id, true, NOW);
    expect(await listHabits(alice, { archived: false }, NOW)).toHaveLength(0);
    expect(await listHabits(alice, { archived: true }, NOW)).toHaveLength(1);

    await setArchived(alice, habit.id, false, NOW);
    expect(await listHabits(alice, { archived: false }, NOW)).toHaveLength(1);
  });
});

describe("updateHabit", () => {
  it("refuses fields from the other schedule type", async () => {
    const habit = await create(alice, everyDay);
    await expect(
      updateHabit(alice, habit.id, { targetPerWeek: 3 }, NOW),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});

describe("data isolation", () => {
  it("hides another user's habits behind NOT_FOUND", async () => {
    const habit = await create(alice, everyDay);
    const notFound = { code: "NOT_FOUND" };

    expect(await listHabits(bob, { archived: false }, NOW)).toHaveLength(0);
    await expect(getHabit(bob, habit.id, NOW)).rejects.toMatchObject(notFound);
    await expect(
      updateHabit(bob, habit.id, { name: "hacked" }, NOW),
    ).rejects.toMatchObject(notFound);
    await expect(checkIn(bob, habit.id, TODAY, NOW)).rejects.toMatchObject(
      notFound,
    );
    await expect(undoCheckIn(bob, habit.id, TODAY, NOW)).rejects.toMatchObject(
      notFound,
    );
    await expect(setArchived(bob, habit.id, true, NOW)).rejects.toMatchObject(
      notFound,
    );
    await expect(deleteHabit(bob, habit.id)).rejects.toMatchObject(notFound);
    expect((await getHabit(alice, habit.id, NOW)).name).toBe("Practice coding");
  });
});

describe("database constraints", () => {
  it("rejects a days habit with no weekdays", async () => {
    await expect(
      db.habit.create({
        data: {
          userId: alice.id,
          name: "Broken",
          category: "health",
          scheduleType: "days",
          startDate: toDbDate(TODAY),
        },
      }),
    ).rejects.toThrow(/habits_days_schedule/);
  });

  it("rejects a manual-only rule violation: applications source on a days habit", async () => {
    await expect(
      db.habit.create({
        data: {
          userId: alice.id,
          name: "Broken",
          category: "career",
          scheduleType: "days",
          daysOfWeek: [1],
          source: "applications",
          startDate: toDbDate(TODAY),
        },
      }),
    ).rejects.toThrow(/habits_applications_source_is_weekly/);
  });
});
