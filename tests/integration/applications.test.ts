import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { todayIn } from "@/lib/date";
import type { SessionUser } from "@/modules/auth/session";
import {
  changeStatus,
  countAppliedInRange,
  createApplication,
  deleteApplication,
  getApplication,
  listApplications,
  updateApplication,
} from "@/modules/applications/applications.service";
import {
  createApplicationSchema,
  changeStatusSchema,
} from "@/modules/applications/applications.schema";
import {
  createInterview,
  deleteInterview,
  listInterviews,
  updateInterview,
} from "@/modules/interviews/interviews.service";
import { createTestUser } from "./helpers";

let alice: SessionUser;
let bob: SessionUser;

beforeEach(async () => {
  await db.user.deleteMany();
  alice = await createTestUser({ name: "Alice" });
  bob = await createTestUser({ name: "Bob" });
});

function create(user: SessionUser, input: Record<string, unknown> = {}) {
  return createApplication(
    user,
    createApplicationSchema.parse({
      company: "Acme",
      position: "Engineer",
      ...input,
    }),
  );
}

describe("createApplication", () => {
  it("defaults to applied today and records the first history event", async () => {
    const app = await create(alice);
    expect(app.status).toBe("applied");
    expect(app.appliedDate).toBe(todayIn(alice.timezone));
    expect(app.statusHistory).toHaveLength(1);
    expect(app.statusHistory[0]).toMatchObject({
      fromStatus: null,
      toStatus: "applied",
    });
  });

  it("leaves the applied date empty for wishlist items", async () => {
    const app = await create(alice, { status: "wishlist" });
    expect(app.appliedDate).toBeNull();
  });

  it("keeps a backdated applied date", async () => {
    const app = await create(alice, { appliedDate: "2026-01-15" });
    expect(app.appliedDate).toBe("2026-01-15");
  });

  it("cannot be created as closed", () => {
    const result = createApplicationSchema.safeParse({
      company: "Acme",
      position: "Engineer",
      status: "closed",
    });
    expect(result.success).toBe(false);
  });
});

describe("changeStatus", () => {
  it("moves the card and appends a history event", async () => {
    const app = await create(alice);
    const moved = await changeStatus(alice, app.id, { status: "interview" });
    expect(moved.status).toBe("interview");
    expect(moved.statusHistory.map((e) => e.toStatus)).toEqual([
      "applied",
      "interview",
    ]);
    expect(moved.statusChangedAt.getTime()).toBeGreaterThanOrEqual(
      app.statusChangedAt.getTime(),
    );
  });

  it("requires an outcome when closing, and only then", () => {
    expect(changeStatusSchema.safeParse({ status: "closed" }).success).toBe(
      false,
    );
    expect(
      changeStatusSchema.safeParse({ status: "offer", outcome: "accepted" })
        .success,
    ).toBe(false);
    expect(
      changeStatusSchema.safeParse({ status: "closed", outcome: "rejected" })
        .success,
    ).toBe(true);
  });

  it("clears the outcome when a closed application is reopened", async () => {
    const app = await create(alice);
    await changeStatus(alice, app.id, {
      status: "closed",
      outcome: "rejected",
    });
    const reopened = await changeStatus(alice, app.id, { status: "applied" });
    expect(reopened.outcome).toBeNull();
    expect(reopened.statusHistory).toHaveLength(3);
  });

  it("does not add a history event when nothing changes", async () => {
    const app = await create(alice);
    const same = await changeStatus(alice, app.id, { status: "applied" });
    expect(same.statusHistory).toHaveLength(1);
  });

  it("fills in the applied date when a wishlist item is applied to", async () => {
    const app = await create(alice, { status: "wishlist" });
    const applied = await changeStatus(alice, app.id, { status: "applied" });
    expect(applied.appliedDate).toBe(todayIn(alice.timezone));
  });

  it("supports undo by changing back", async () => {
    const app = await create(alice);
    await changeStatus(alice, app.id, { status: "assessment" });
    const undone = await changeStatus(alice, app.id, { status: "applied" });
    expect(undone.status).toBe("applied");
    expect(undone.statusHistory.map((e) => e.toStatus)).toEqual([
      "applied",
      "assessment",
      "applied",
    ]);
  });
});

describe("updateApplication", () => {
  it("updates fields and clears optional ones with null", async () => {
    const app = await create(alice, { location: "Jakarta" });
    const updated = await updateApplication(alice.id, app.id, {
      notes: "Referral from Budi",
      location: null,
    });
    expect(updated.notes).toBe("Referral from Budi");
    expect(updated.location).toBeNull();
  });

  it("refuses to clear the applied date after applying", async () => {
    const app = await create(alice);
    await expect(
      updateApplication(alice.id, app.id, { appliedDate: null }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});

describe("listApplications", () => {
  it("filters by status and searches company or position", async () => {
    await create(alice, { company: "Tokopedia", position: "Frontend" });
    await create(alice, {
      company: "Gojek",
      position: "Backend",
      status: "wishlist",
    });

    expect(
      await listApplications(alice.id, { status: "wishlist" }),
    ).toHaveLength(1);
    expect(await listApplications(alice.id, { q: "toko" })).toHaveLength(1);
    expect(await listApplications(alice.id, { q: "END" })).toHaveLength(2);
  });

  it("lists the most recently moved card first", async () => {
    const first = await create(alice, { company: "First" });
    await create(alice, { company: "Second" });
    await changeStatus(alice, first.id, { status: "assessment" });

    const list = await listApplications(alice.id, {});
    expect(list.map((a) => a.company)).toEqual(["First", "Second"]);
  });
});

describe("data isolation", () => {
  it("hides another user's applications behind NOT_FOUND", async () => {
    const app = await create(alice);
    const notFound = { code: "NOT_FOUND" };

    expect(await listApplications(bob.id, {})).toHaveLength(0);
    await expect(getApplication(bob.id, app.id)).rejects.toMatchObject(
      notFound,
    );
    await expect(
      updateApplication(bob.id, app.id, { notes: "hacked" }),
    ).rejects.toMatchObject(notFound);
    await expect(
      changeStatus(bob, app.id, { status: "offer" }),
    ).rejects.toMatchObject(notFound);
    await expect(deleteApplication(bob.id, app.id)).rejects.toMatchObject(
      notFound,
    );

    const untouched = await getApplication(alice.id, app.id);
    expect(untouched.status).toBe("applied");
    expect(untouched.notes).toBeNull();
  });

  it("hides another user's interviews behind NOT_FOUND", async () => {
    const app = await create(alice);
    const interview = await createInterview(alice.id, app.id, {
      scheduledAt: "2099-01-01T09:00:00+07:00",
      type: "video",
    });
    const notFound = { code: "NOT_FOUND" };

    await expect(
      createInterview(bob.id, app.id, {
        scheduledAt: "2099-01-01T09:00:00+07:00",
        type: "video",
      }),
    ).rejects.toMatchObject(notFound);
    await expect(
      updateInterview(bob.id, interview.id, { notes: "hacked" }),
    ).rejects.toMatchObject(notFound);
    await expect(deleteInterview(bob.id, interview.id)).rejects.toMatchObject(
      notFound,
    );
    expect(await listInterviews(bob.id, "upcoming")).toHaveLength(0);
  });
});

describe("interviews", () => {
  it("splits upcoming and past, with company and position attached", async () => {
    const app = await create(alice, { company: "Acme", position: "Engineer" });
    const now = new Date("2026-06-01T00:00:00Z");
    await createInterview(alice.id, app.id, {
      scheduledAt: "2026-05-01T09:00:00Z",
      type: "phone",
    });
    await createInterview(alice.id, app.id, {
      scheduledAt: "2026-07-01T09:00:00Z",
      type: "onsite",
    });

    const upcoming = await listInterviews(alice.id, "upcoming", now);
    const past = await listInterviews(alice.id, "past", now);
    expect(upcoming.map((i) => i.type)).toEqual(["onsite"]);
    expect(past.map((i) => i.type)).toEqual(["phone"]);
    expect(upcoming[0].application).toEqual({
      company: "Acme",
      position: "Engineer",
    });
  });

  it("is deleted together with its application", async () => {
    const app = await create(alice);
    await createInterview(alice.id, app.id, {
      scheduledAt: "2099-01-01T09:00:00Z",
      type: "video",
    });
    await deleteApplication(alice.id, app.id);
    expect(await db.interview.count()).toBe(0);
  });
});

describe("countAppliedInRange", () => {
  it("counts by applied date, inclusive, ignoring wishlist and other users", async () => {
    await create(alice, { appliedDate: "2026-03-02" }); // Monday
    await create(alice, { appliedDate: "2026-03-08" }); // Sunday
    await create(alice, { appliedDate: "2026-03-09" }); // next Monday
    await create(alice, { status: "wishlist" });
    await create(bob, { appliedDate: "2026-03-03" });

    expect(
      await countAppliedInRange(alice.id, "2026-03-02", "2026-03-08"),
    ).toBe(2);
  });
});

describe("database constraints", () => {
  it("rejects a closed application without an outcome, even bypassing the service", async () => {
    const app = await create(alice);
    await expect(
      db.application.update({
        where: { id: app.id },
        data: { status: "closed" },
      }),
    ).rejects.toThrow(/applications_outcome_matches_status/);
  });

  it("rejects an applied application without an applied date", async () => {
    const app = await create(alice);
    await expect(
      db.application.update({
        where: { id: app.id },
        data: { appliedDate: null },
      }),
    ).rejects.toThrow(/applications_applied_date_required/);
  });
});
