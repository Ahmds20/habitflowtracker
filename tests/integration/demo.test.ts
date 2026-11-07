import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { login } from "@/modules/auth/auth.service";
import { validateSessionToken } from "@/modules/auth/session";
import { getDashboard } from "@/modules/dashboard/dashboard.service";
import {
  DEMO_TTL_HOURS,
  createDemoUser,
  deleteExpiredDemoUsers,
} from "@/modules/demo/demo.service";
import { getHabit, listHabits } from "@/modules/habits/habits.service";
import { isOnboarded } from "@/modules/onboarding/onboarding.service";
import id from "@/i18n/dictionaries/id";
import { createTestUser } from "./helpers";

// Wednesday 11 November 2026, 10:00 in Jakarta.
const NOW = new Date("2026-11-11T03:00:00Z");

beforeEach(async () => {
  await db.user.deleteMany();
});

async function demoUser() {
  const { userId, session } = await createDemoUser("Asia/Jakarta", NOW);
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, timezone: true, isDemo: true },
  });
  return { user, session };
}

describe("createDemoUser", () => {
  it("creates a signed-in, onboarded demo account", async () => {
    const { user, session } = await demoUser();
    expect(user.isDemo).toBe(true);
    expect(user.timezone).toBe("Asia/Jakarta");
    expect(await isOnboarded(user.id)).toBe(true);
    expect((await validateSessionToken(session.token))?.user.id).toBe(user.id);
  });

  it("fills the dashboard with realistic data", async () => {
    const { user } = await demoUser();
    const dashboard = await getDashboard(user, NOW);

    expect(dashboard.week.applications?.target).toBe(5);
    expect(dashboard.week.applications?.done).toBeGreaterThan(0);
    expect(dashboard.week.habitConsistency).not.toBeNull();
    expect(dashboard.todayHabits.length).toBeGreaterThan(0);
    // Today is left open so the visitor can check in.
    expect(dashboard.todayHabits.every((h) => !h.today.done)).toBe(true);
    expect(dashboard.upcomingInterviews.length).toBeGreaterThan(0);
    expect(dashboard.followUps.length).toBeGreaterThan(0);
    for (const count of Object.values(dashboard.pipeline)) {
      expect(count).toBeGreaterThan(0);
    }
  });

  it("always has a habit to check in, even on a weekend", async () => {
    // Saturday 14 November 2026, 10:00 in Jakarta.
    const saturday = new Date("2026-11-14T03:00:00Z");
    const { userId } = await createDemoUser("Asia/Jakarta", saturday);
    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        isDemo: true,
      },
    });
    const dashboard = await getDashboard(user, saturday);
    expect(dashboard.todayHabits.length).toBeGreaterThan(0);
  });

  it("gives habits visible streaks and history", async () => {
    const { user } = await demoUser();
    const habits = await listHabits(user, { archived: false }, NOW);
    const coding = habits.find((h) => h.name === "Practice coding")!;
    expect(coding.streak.current).toBeGreaterThan(0);

    const detail = await getHabit(user, coding.id, NOW);
    expect(detail.history.some((d) => d.status === "done")).toBe(true);
  });

  it("records a status history that ends at the current status", async () => {
    const { user } = await demoUser();
    const apps = await db.application.findMany({
      where: { userId: user.id },
      include: { statusEvents: { orderBy: { changedAt: "asc" } } },
    });
    expect(apps).toHaveLength(15);
    for (const app of apps) {
      expect(app.statusEvents[0].fromStatus).toBeNull();
      expect(app.statusEvents.at(-1)!.toStatus).toBe(app.status);
    }
  });

  it("gives every visitor a separate account", async () => {
    const a = await demoUser();
    const b = await demoUser();
    expect(a.user.id).not.toBe(b.user.id);
    expect(await db.application.count({ where: { userId: a.user.id } })).toBe(
      15,
    );
  });

  it("writes sample data in the visitor's language", async () => {
    const { userId } = await createDemoUser("Asia/Jakarta", NOW, id);
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    const names = (
      await db.habit.findMany({ where: { userId }, select: { name: true } })
    ).map((h) => h.name);

    expect(user.name).toBe("Pengguna Demo");
    expect(names).toContain("Kirim 5 lamaran");
    expect(names).toContain("Latihan coding");
    expect(
      await db.interview.count({
        where: { application: { userId }, title: "Interview teknis" },
      }),
    ).toBeGreaterThan(0);
  });

  it("cannot be logged in to with a password", async () => {
    const { user } = await demoUser();
    await expect(
      login({ email: user.email, password: "anything-at-all" }),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
});

describe("deleteExpiredDemoUsers", () => {
  it("deletes only demo users older than the time limit, with their data", async () => {
    const old = await demoUser();
    const fresh = await demoUser();
    const real = await createTestUser({ name: "Real" });

    const longAgo = new Date(NOW.getTime() - (DEMO_TTL_HOURS + 1) * 3_600_000);
    await db.user.updateMany({
      where: { id: { in: [old.user.id, real.id] } },
      data: { createdAt: longAgo },
    });
    // createdAt defaults to the real clock; pin it to the test's NOW.
    await db.user.update({
      where: { id: fresh.user.id },
      data: { createdAt: new Date(NOW.getTime() - 3_600_000) },
    });

    const deleted = await deleteExpiredDemoUsers(NOW);

    expect(deleted).toBe(1);
    expect(await db.user.findUnique({ where: { id: old.user.id } })).toBeNull();
    expect(await db.application.count({ where: { userId: old.user.id } })).toBe(
      0,
    );
    expect(await db.session.count({ where: { userId: old.user.id } })).toBe(0);
    expect(
      await db.user.findUnique({ where: { id: fresh.user.id } }),
    ).not.toBeNull();
    expect(await db.user.findUnique({ where: { id: real.id } })).not.toBeNull();
  });
});
