import { db } from "@/lib/db";
import type { SessionUser } from "@/modules/auth/session";

let counter = 0;

// Creates a user directly (no password hashing) for tests that do not exercise auth.
export async function createTestUser(
  overrides: Partial<SessionUser> = {},
): Promise<SessionUser> {
  counter += 1;
  return db.user.create({
    data: {
      email: `user${counter}-${Date.now()}@example.com`,
      name: `User ${counter}`,
      timezone: "Asia/Jakarta",
      passwordHash: "not-a-real-hash",
      ...overrides,
    },
    select: { id: true, email: true, name: true, timezone: true, isDemo: true },
  });
}
