import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import {
  SESSION_COOKIE,
  generateSessionToken,
  hashSessionToken,
  isExpired,
  newExpiry,
  shouldRenew,
} from "./token";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  timezone: string;
  isDemo: boolean;
};

export type ValidSession = {
  sessionId: string;
  user: SessionUser;
};

const userSelect = {
  id: true,
  email: true,
  name: true,
  timezone: true,
  isDemo: true,
} as const;

// ---------- Database ----------

export async function createSession(userId: string) {
  const token = generateSessionToken();
  const expiresAt = newExpiry();
  await db.session.create({
    data: { id: await hashSessionToken(token), userId, expiresAt },
  });
  return { token, expiresAt };
}

// Returns the session and its user, or null when the token is unknown or expired.
// Sliding expiry: with `renew`, sessions close to expiring are extended.
// Server Components pass `renew: false` because they cannot update the cookie to match.
export async function validateSessionToken(
  token: string,
  { renew = true }: { renew?: boolean } = {},
): Promise<(ValidSession & { renewedExpiresAt?: Date }) | null> {
  const sessionId = await hashSessionToken(token);
  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { expiresAt: true, user: { select: userSelect } },
  });
  if (!session) return null;

  if (isExpired(session.expiresAt)) {
    if (renew) await db.session.deleteMany({ where: { id: sessionId } });
    return null;
  }

  if (renew && shouldRenew(session.expiresAt)) {
    const renewedExpiresAt = newExpiry();
    await db.session.update({
      where: { id: sessionId },
      data: { expiresAt: renewedExpiresAt },
    });
    return { sessionId, user: session.user, renewedExpiresAt };
  }

  return { sessionId, user: session.user };
}

export async function invalidateSession(sessionId: string) {
  await db.session.deleteMany({ where: { id: sessionId } });
}

// Used after a password change: log out every other device.
export async function invalidateOtherSessions(
  userId: string,
  keepSessionId: string,
) {
  await db.session.deleteMany({
    where: { userId, id: { not: keepSessionId } },
  });
}

// ---------- Cookie ----------

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// ---------- Request helpers ----------

// Reads the session from the request cookie. Returns null when logged out.
// Only call from Route Handlers: renewing a session writes a cookie,
// which Server Components are not allowed to do.
export async function getSession(): Promise<ValidSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const result = await validateSessionToken(token);
  if (!result) {
    await deleteSessionCookie();
    return null;
  }
  if (result.renewedExpiresAt) {
    await setSessionCookie(token, result.renewedExpiresAt);
  }
  return { sessionId: result.sessionId, user: result.user };
}

// Read-only session lookup for Server Components (pages and layouts).
// Never writes cookies; renewal happens on the next API request.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = await validateSessionToken(token, { renew: false });
  return result?.user ?? null;
}

// Same as getSession, but throws 401 when logged out.
export async function requireSession(): Promise<ValidSession> {
  const session = await getSession();
  if (!session) {
    throw new AppError("UNAUTHENTICATED", "Please log in");
  }
  return session;
}
