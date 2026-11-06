import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { fromDbDate, todayIn, toDbDate, type LocalDate } from "@/lib/date";
import { AppError } from "@/lib/errors";
import type { SessionUser } from "@/modules/auth/session";
import type {
  ChangeStatusInput,
  CreateApplicationInput,
  ListApplicationsQuery,
  UpdateApplicationInput,
} from "./applications.schema";

// Every query is scoped by userId. A record owned by someone else is
// indistinguishable from a missing one (404), so IDs cannot be probed.

const LIST_LIMIT = 500;

const notFound = () => new AppError("NOT_FOUND", "Application not found");

const summarySelect = {
  id: true,
  company: true,
  position: true,
  status: true,
  outcome: true,
  appliedDate: true,
  followUpDate: true,
  location: true,
  statusChangedAt: true,
} satisfies Prisma.ApplicationSelect;

type SummaryRow = Prisma.ApplicationGetPayload<{
  select: typeof summarySelect;
}>;

function toSummary(row: SummaryRow) {
  return {
    ...row,
    appliedDate: fromDbDate(row.appliedDate),
    followUpDate: fromDbDate(row.followUpDate),
  };
}

const detailInclude = {
  statusEvents: { orderBy: { changedAt: "asc" } },
  interviews: { orderBy: { scheduledAt: "asc" } },
} satisfies Prisma.ApplicationInclude;

type DetailRow = Prisma.ApplicationGetPayload<{
  include: typeof detailInclude;
}>;

function toDetail(row: DetailRow) {
  const { statusEvents, interviews, userId: _userId, ...application } = row;
  return {
    ...application,
    appliedDate: fromDbDate(row.appliedDate),
    followUpDate: fromDbDate(row.followUpDate),
    statusHistory: statusEvents.map(({ applicationId: _a, ...event }) => event),
    interviews: interviews.map(
      ({ applicationId: _a, ...interview }) => interview,
    ),
  };
}

export type ApplicationSummary = ReturnType<typeof toSummary>;
export type ApplicationDetail = ReturnType<typeof toDetail>;

function optionalDate(value: LocalDate | null | undefined) {
  if (value === undefined) return undefined;
  return value === null ? null : toDbDate(value);
}

export async function listApplications(
  userId: string,
  query: ListApplicationsQuery,
) {
  const rows = await db.application.findMany({
    where: {
      userId,
      status: query.status,
      ...(query.q && {
        OR: [
          { company: { contains: query.q, mode: "insensitive" } },
          { position: { contains: query.q, mode: "insensitive" } },
        ],
      }),
    },
    select: summarySelect,
    orderBy: [{ statusChangedAt: "desc" }, { id: "desc" }],
    take: LIST_LIMIT,
  });
  return rows.map(toSummary);
}

export async function getApplication(userId: string, id: string) {
  const row = await db.application.findFirst({
    where: { id, userId },
    include: detailInclude,
  });
  if (!row) throw notFound();
  return toDetail(row);
}

export async function createApplication(
  user: SessionUser,
  input: CreateApplicationInput,
) {
  const { status, appliedDate, followUpDate, ...fields } = input;
  // Anything past the wishlist has been applied to; default the date to today.
  const resolvedAppliedDate =
    appliedDate ?? (status === "wishlist" ? null : todayIn(user.timezone));

  const row = await db.application.create({
    data: {
      ...fields,
      userId: user.id,
      status,
      appliedDate: optionalDate(resolvedAppliedDate),
      followUpDate: optionalDate(followUpDate),
      // The first history event is written in the same statement.
      statusEvents: { create: { fromStatus: null, toStatus: status } },
    },
    include: detailInclude,
  });
  return toDetail(row);
}

export async function updateApplication(
  userId: string,
  id: string,
  input: UpdateApplicationInput,
) {
  const current = await db.application.findFirst({
    where: { id, userId },
    select: { status: true },
  });
  if (!current) throw notFound();

  if (input.appliedDate === null && current.status !== "wishlist") {
    throw new AppError("VALIDATION_ERROR", "Invalid request", {
      appliedDate: ["Applied date is required once you have applied"],
    });
  }

  const { appliedDate, followUpDate, ...fields } = input;
  const row = await db.application.update({
    where: { id },
    data: {
      ...fields,
      appliedDate: optionalDate(appliedDate),
      followUpDate: optionalDate(followUpDate),
    },
    include: detailInclude,
  });
  return toDetail(row);
}

export async function changeStatus(
  user: SessionUser,
  id: string,
  input: ChangeStatusInput,
) {
  const row = await db.$transaction(async (tx) => {
    const current = await tx.application.findFirst({
      where: { id, userId: user.id },
      select: { status: true, outcome: true, appliedDate: true },
    });
    if (!current) throw notFound();

    const outcome = input.outcome ?? null;
    if (current.status === input.status && current.outcome === outcome) {
      // No change: do not add a history event.
      return tx.application.findUniqueOrThrow({
        where: { id },
        include: detailInclude,
      });
    }

    const needsAppliedDate =
      input.status !== "wishlist" && current.appliedDate === null;

    await tx.applicationStatusEvent.create({
      data: {
        applicationId: id,
        fromStatus: current.status,
        toStatus: input.status,
        outcome,
      },
    });
    return tx.application.update({
      where: { id },
      data: {
        status: input.status,
        outcome,
        statusChangedAt: new Date(),
        ...(needsAppliedDate && {
          appliedDate: toDbDate(todayIn(user.timezone)),
        }),
      },
      include: detailInclude,
    });
  });
  return toDetail(row);
}

export async function deleteApplication(userId: string, id: string) {
  const { count } = await db.application.deleteMany({ where: { id, userId } });
  if (count === 0) throw notFound();
}

// Read-only export for other modules (habits in M3, dashboard in M4).
// Counts applications sent between two local dates, inclusive. Wishlist items do not count.
export function countAppliedInRange(
  userId: string,
  from: LocalDate,
  to: LocalDate,
) {
  return db.application.count({
    where: {
      userId,
      status: { not: "wishlist" },
      appliedDate: { gte: toDbDate(from), lte: toDbDate(to) },
    },
  });
}
