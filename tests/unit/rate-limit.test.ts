import { describe, expect, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";

const { clientIp, enforceRateLimit } = await import("@/lib/rate-limit");

describe("clientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(clientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    const real = new Request("http://x", {
      headers: { "x-real-ip": "1.2.3.4" },
    });
    expect(clientIp(real)).toBe("1.2.3.4");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});

describe("enforceRateLimit", () => {
  it("passes when rate limiting is disabled", async () => {
    await expect(enforceRateLimit(null, "key")).resolves.toBeUndefined();
  });

  it("throws RATE_LIMITED with Retry-After when the limit is hit", async () => {
    const fakeLimiter = {
      limit: async () => ({ success: false, reset: Date.now() + 30_000 }),
    } as unknown as Parameters<typeof enforceRateLimit>[0];

    await expect(enforceRateLimit(fakeLimiter, "key")).rejects.toMatchObject({
      code: "RATE_LIMITED",
      headers: { "Retry-After": expect.stringMatching(/^(29|30)$/) },
    });
  });
});
