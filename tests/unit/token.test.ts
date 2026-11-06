import { describe, expect, it } from "vitest";
import {
  SESSION_DURATION_MS,
  generateSessionToken,
  hashSessionToken,
  isExpired,
  newExpiry,
  shouldRenew,
} from "@/modules/auth/token";

const DAY = 24 * 60 * 60 * 1000;

describe("session tokens", () => {
  it("generates unique 43-character base64url tokens", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
  });

  it("hashes tokens to a stable sha256 hex digest", async () => {
    const hash = await hashSessionToken("token");
    expect(hash).toBe(
      "3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0",
    );
    expect(await hashSessionToken("token")).toBe(hash);
  });
});

describe("session expiry", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("expires 30 days after creation", () => {
    expect(newExpiry(now).getTime() - now.getTime()).toBe(SESSION_DURATION_MS);
  });

  it("renews only when less than 15 days are left", () => {
    expect(shouldRenew(new Date(now.getTime() + 20 * DAY), now)).toBe(false);
    expect(shouldRenew(new Date(now.getTime() + 10 * DAY), now)).toBe(true);
  });

  it("treats the exact expiry moment as expired", () => {
    expect(isExpired(now, now)).toBe(true);
    expect(isExpired(new Date(now.getTime() + 1), now)).toBe(false);
  });
});
