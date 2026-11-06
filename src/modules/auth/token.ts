// Pure helpers for session tokens. No database or Next.js imports, so they are easy to unit test.

export const SESSION_COOKIE = "hf_session";

const DAY_MS = 24 * 60 * 60 * 1000;
export const SESSION_DURATION_MS = 30 * DAY_MS;
// Extend a session once less than half of its lifetime is left.
// This keeps active users logged in without writing to the database on every request.
export const SESSION_RENEW_THRESHOLD_MS = 15 * DAY_MS;

// 32 random bytes, base64url-encoded (43 characters).
export function generateSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

// The database stores only this hash. A leaked database cannot be used to log in.
export async function hashSessionToken(token: string) {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("hex");
}

export function newExpiry(now = new Date()) {
  return new Date(now.getTime() + SESSION_DURATION_MS);
}

export function shouldRenew(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() - now.getTime() < SESSION_RENEW_THRESHOLD_MS;
}

export function isExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}
