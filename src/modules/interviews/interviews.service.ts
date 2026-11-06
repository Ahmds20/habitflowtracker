import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  CreateInterviewInput,
  UpdateInterviewInput,
} from "./interviews.schema";

// Interviews have no user_id. Ownership always goes through the parent
// application (`application: { userId }`), so no query can skip the check.

const LIST_LIMIT = 500;

const notFound = () => new AppError("NOT_FOUND", "Interview not found");

const interviewSelect = {
  id: true,
  applicationId: true,
  scheduledAt: true,
  type: true,
  title: true,
  meetingUrl: true,
  notes: true,
  application: { select: { company: true, position: true } },
} as const;

export async function listInterviews(
  userId: string,
  range: "upcoming" | "past",
  now = new Date(),
) {
  return db.interview.findMany({
    where: {
      application: { userId },
      scheduledAt: range === "upcoming" ? { gte: now } : { lt: now },
    },
    select: interviewSelect,
    // Upcoming: soonest first. Past: most recent first.
    orderBy: { scheduledAt: range === "upcoming" ? "asc" : "desc" },
    take: LIST_LIMIT,
  });
}

export async function createInterview(
  userId: string,
  applicationId: string,
  input: CreateInterviewInput,
) {
  const application = await db.application.findFirst({
    where: { id: applicationId, userId },
    select: { id: true },
  });
  if (!application) {
    throw new AppError("NOT_FOUND", "Application not found");
  }
  return db.interview.create({
    data: { ...input, applicationId },
    select: interviewSelect,
  });
}

export async function updateInterview(
  userId: string,
  id: string,
  input: UpdateInterviewInput,
) {
  const owned = await db.interview.findFirst({
    where: { id, application: { userId } },
    select: { id: true },
  });
  if (!owned) throw notFound();
  return db.interview.update({
    where: { id },
    data: input,
    select: interviewSelect,
  });
}

export async function deleteInterview(userId: string, id: string) {
  const { count } = await db.interview.deleteMany({
    where: { id, application: { userId } },
  });
  if (count === 0) throw notFound();
}
