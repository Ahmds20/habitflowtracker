import "server-only";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

// True only when the request carries "Authorization: Bearer <CRON_SECRET>".
// Constant-time comparison so the secret cannot be guessed byte by byte.
export function isAuthorizedCron(request: Request) {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
