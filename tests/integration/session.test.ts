import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { changePassword, login, register } from "@/modules/auth/auth.service";
import {
  createSession,
  getSession,
  invalidateSession,
  validateSessionToken,
} from "@/modules/auth/session";
import { SESSION_COOKIE, hashSessionToken } from "@/modules/auth/token";
import { cookies, resetCookies } from "../stubs/next-headers";

const DAY = 24 * 60 * 60 * 1000;

const input = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  timezone: "Asia/Jakarta",
};

beforeEach(async () => {
  resetCookies();
  await db.user.deleteMany();
});

async function setExpiry(token: string, expiresAt: Date) {
  const id = await hashSessionToken(token);
  await db.session.update({ where: { id }, data: { expiresAt } });
  return id;
}

describe("register", () => {
  it("creates the user and a session, storing only the token hash", async () => {
    const { user, session } = await register(input);

    const stored = await db.session.findMany({ where: { userId: user.id } });
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(await hashSessionToken(session.token));
    expect(stored[0].id).not.toBe(session.token);

    const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row.passwordHash.startsWith("$argon2id$")).toBe(true);
  });

  it("rejects a duplicate email with CONFLICT", async () => {
    await register(input);
    await expect(register(input)).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("login", () => {
  it("gives the same error for a wrong password and an unknown email", async () => {
    await register(input);
    const expected = {
      code: "UNAUTHENTICATED",
      message: "Incorrect email or password",
    };
    await expect(
      login({ email: input.email, password: "wrong-password" }),
    ).rejects.toMatchObject(expected);
    await expect(
      login({ email: "nobody@example.com", password: "wrong-password" }),
    ).rejects.toMatchObject(expected);
  });
});

describe("validateSessionToken", () => {
  it("returns the user for a valid token", async () => {
    const { user, session } = await register(input);
    const result = await validateSessionToken(session.token);
    expect(result?.user.id).toBe(user.id);
    expect(result?.renewedExpiresAt).toBeUndefined();
  });

  it("returns null for an unknown token", async () => {
    expect(await validateSessionToken("not-a-real-token")).toBeNull();
  });

  it("deletes expired sessions", async () => {
    const { session } = await register(input);
    const id = await setExpiry(session.token, new Date(Date.now() - 1000));

    expect(await validateSessionToken(session.token)).toBeNull();
    expect(await db.session.findUnique({ where: { id } })).toBeNull();
  });

  it("extends sessions with less than 15 days left", async () => {
    const { session } = await register(input);
    const id = await setExpiry(session.token, new Date(Date.now() + 5 * DAY));

    const result = await validateSessionToken(session.token);
    expect(result?.renewedExpiresAt).toBeDefined();
    const stored = await db.session.findUniqueOrThrow({ where: { id } });
    expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now() + 29 * DAY);
  });

  it("does not write to the database when renew is false", async () => {
    const { session } = await register(input);
    const soon = new Date(Date.now() + 5 * DAY);
    const id = await setExpiry(session.token, soon);

    const result = await validateSessionToken(session.token, { renew: false });
    expect(result?.renewedExpiresAt).toBeUndefined();
    const stored = await db.session.findUniqueOrThrow({ where: { id } });
    expect(stored.expiresAt.getTime()).toBe(soon.getTime());
  });
});

describe("getSession", () => {
  it("reads the cookie and clears it once the session is gone", async () => {
    const { user, session } = await register(input);
    const jar = await cookies();
    jar.set(SESSION_COOKIE, session.token);

    expect((await getSession())?.user.id).toBe(user.id);

    await invalidateSession(await hashSessionToken(session.token));
    expect(await getSession()).toBeNull();
    expect(jar.get(SESSION_COOKIE)).toBeUndefined();
  });
});

describe("changePassword", () => {
  it("keeps the current session and logs out other devices", async () => {
    const { user, session } = await register(input);
    const other = await createSession(user.id);
    const currentId = await hashSessionToken(session.token);

    await changePassword(user, currentId, {
      currentPassword: input.password,
      newPassword: "newpassword123",
    });

    expect(await validateSessionToken(session.token)).not.toBeNull();
    expect(await validateSessionToken(other.token)).toBeNull();
    await expect(
      login({ email: input.email, password: "newpassword123" }),
    ).resolves.toBeDefined();
  });

  it("is forbidden for demo accounts", async () => {
    const { user, session } = await register(input);
    await expect(
      changePassword({ ...user, isDemo: true }, session.token, {
        currentPassword: input.password,
        newPassword: "newpassword123",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("deleting a user", () => {
  it("cascades to sessions", async () => {
    const { user } = await register(input);
    await db.user.delete({ where: { id: user.id } });
    expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
  });
});
