import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createApplicationSchema } from "@/modules/applications/applications.schema";
import { createApplication } from "@/modules/applications/applications.service";
import {
  deleteAccount,
  register,
  updateProfile,
} from "@/modules/auth/auth.service";
import { updateProfileSchema } from "@/modules/auth/auth.schema";
import { createDemoUser } from "@/modules/demo/demo.service";
import { createHabitSchema } from "@/modules/habits/habits.schema";
import { checkIn, createHabit } from "@/modules/habits/habits.service";
import { createInterview } from "@/modules/interviews/interviews.service";

const input = {
  name: "Test User",
  email: "account@example.com",
  password: "password123",
  timezone: "Asia/Jakarta",
};

beforeEach(async () => {
  await db.user.deleteMany();
});

describe("updateProfile", () => {
  it("changes the name and timezone", async () => {
    const { user } = await register(input);
    const updated = await updateProfile(
      user.id,
      updateProfileSchema.parse({ name: "  Faiz ", timezone: "Europe/London" }),
    );
    expect(updated).toMatchObject({ name: "Faiz", timezone: "Europe/London" });
  });

  it("rejects an unknown timezone", () => {
    expect(
      updateProfileSchema.safeParse({ timezone: "Mars/Olympus" }).success,
    ).toBe(false);
  });
});

describe("deleteAccount", () => {
  it("requires the correct password for a real account", async () => {
    const { user } = await register(input);
    const error = { code: "VALIDATION_ERROR" };
    await expect(deleteAccount(user, {})).rejects.toMatchObject(error);
    await expect(
      deleteAccount(user, { password: "wrong-password" }),
    ).rejects.toMatchObject(error);
    expect(await db.user.count({ where: { id: user.id } })).toBe(1);
  });

  it("deletes the account and every record that belongs to it", async () => {
    const { user } = await register(input);
    const app = await createApplication(
      user,
      createApplicationSchema.parse({ company: "Acme", position: "Dev" }),
    );
    await createInterview(user.id, app.id, {
      scheduledAt: "2099-01-01T09:00:00Z",
      type: "video",
    });
    const habit = await createHabit(
      user,
      createHabitSchema.parse({
        name: "Read",
        category: "learning",
        scheduleType: "days",
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      }),
    );
    await checkIn(user, habit.id, habit.today.date);

    await deleteAccount(user, { password: input.password });

    expect(await db.user.count()).toBe(0);
    expect(await db.session.count()).toBe(0);
    expect(await db.application.count()).toBe(0);
    expect(await db.applicationStatusEvent.count()).toBe(0);
    expect(await db.interview.count()).toBe(0);
    expect(await db.habit.count()).toBe(0);
    expect(await db.habitCheckin.count()).toBe(0);
  });

  it("deletes a demo account without a password", async () => {
    const { userId } = await createDemoUser("Asia/Jakarta");
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
    await deleteAccount(user, {});
    expect(await db.user.count({ where: { id: userId } })).toBe(0);
    expect(await db.application.count({ where: { userId } })).toBe(0);
  });

  it("leaves other accounts untouched", async () => {
    const { user } = await register(input);
    const { user: other } = await register({
      ...input,
      email: "other@example.com",
    });
    await deleteAccount(user, { password: input.password });
    expect(await db.user.count({ where: { id: other.id } })).toBe(1);
  });
});
