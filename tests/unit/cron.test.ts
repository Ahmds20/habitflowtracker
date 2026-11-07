import { afterEach, describe, expect, it, vi } from "vitest";

const SECRET = "a-very-long-cron-secret-value";

async function load(secret?: string) {
  vi.resetModules();
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
  if (secret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = secret;
  return import("@/lib/cron");
}

function request(authorization?: string) {
  return new Request("http://localhost/api/cron/cleanup-demo", {
    headers: authorization ? { authorization } : {},
  });
}

afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("isAuthorizedCron", () => {
  it("accepts the exact bearer secret", async () => {
    const { isAuthorizedCron } = await load(SECRET);
    expect(isAuthorizedCron(request(`Bearer ${SECRET}`))).toBe(true);
  });

  it("rejects a missing or wrong secret", async () => {
    const { isAuthorizedCron } = await load(SECRET);
    expect(isAuthorizedCron(request())).toBe(false);
    expect(isAuthorizedCron(request(`Bearer ${SECRET}x`))).toBe(false);
    expect(isAuthorizedCron(request(SECRET))).toBe(false);
  });

  it("rejects everything when no secret is configured", async () => {
    const { isAuthorizedCron } = await load();
    expect(isAuthorizedCron(request("Bearer "))).toBe(false);
    expect(isAuthorizedCron(request("Bearer undefined"))).toBe(false);
  });
});
