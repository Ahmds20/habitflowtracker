import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { todayIn, toDbDate } from "@/lib/date";
import { AppError } from "@/lib/errors";
import en, { type Dictionary } from "@/i18n/dictionaries/en";
import type { SessionUser } from "@/modules/auth/session";
import { starterHabits, type OnboardingInput } from "./onboarding.schema";

// A user is onboarded once their linked "weekly applications" habit exists
// (decision D5). No extra column: the habit itself is the marker.
export async function isOnboarded(userId: string) {
  const linked = await db.habit.findFirst({
    where: { userId, source: "applications" },
    select: { id: true },
  });
  return linked !== null;
}

// Habit names are saved in the language the user onboarded in; after that
// they are the user's own text and can be renamed.
export async function completeOnboarding(
  user: SessionUser,
  input: OnboardingInput,
  now = new Date(),
  t: Dictionary = en,
) {
  const startDate = toDbDate(todayIn(user.timezone, now));

  const linked = {
    userId: user.id,
    name: t.onboarding.linkedName(input.weeklyTarget),
    category: "career" as const,
    scheduleType: "weekly_target" as const,
    targetPerWeek: input.weeklyTarget,
    source: "applications" as const,
    startDate,
  };

  const starters = input.starterHabits.map((key) => {
    const starter = starterHabits[key];
    return {
      userId: user.id,
      name: t.onboarding.starters[key],
      category: starter.category,
      scheduleType: starter.schedule.scheduleType,
      daysOfWeek:
        starter.schedule.scheduleType === "days"
          ? [...starter.schedule.daysOfWeek]
          : [],
      targetPerWeek:
        starter.schedule.scheduleType === "weekly_target"
          ? starter.schedule.targetPerWeek
          : null,
      startDate,
    };
  });

  try {
    // All or nothing: a failed starter habit must not leave a half-onboarded user.
    await db.$transaction([
      db.habit.create({ data: linked }),
      db.habit.createMany({ data: starters }),
    ]);
  } catch (error) {
    // The partial unique index allows one linked habit per user, so a second
    // onboarding (double submit, two tabs) fails here instead of duplicating.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("CONFLICT", "You have already completed onboarding");
    }
    throw error;
  }
}
