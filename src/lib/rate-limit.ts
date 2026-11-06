import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

// Rate limits live in Upstash Redis because serverless instances do not share memory.
// Without Upstash credentials (local dev, tests) every check passes.

const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

function limiter(
  prefix: string,
  tokens: number,
  window: `${number} ${"s" | "m" | "h"}`,
) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    prefix: `hf:rl:${prefix}`,
    limiter: Ratelimit.slidingWindow(tokens, window),
    // Fail open after 1 s: a Redis outage should not lock everyone out.
    timeout: 1000,
  });
}

export const limits = {
  // Per IP: slows down password guessing across many accounts.
  loginIp: limiter("login:ip", 20, "15 m"),
  // Per email: protects one account from guessing spread over many IPs.
  loginEmail: limiter("login:email", 10, "15 m"),
  register: limiter("register:ip", 5, "1 h"),
  // Used by "Try demo" in M5.
  demo: limiter("demo:ip", 10, "1 h"),
};

export function clientIp(request: Request) {
  // Vercel sets x-forwarded-for; the first entry is the client.
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Throws RATE_LIMITED (429) with a Retry-After header when the limit is hit.
export async function enforceRateLimit(
  rateLimiter: Ratelimit | null,
  key: string,
) {
  if (!rateLimiter) return;
  const { success, reset } = await rateLimiter.limit(key);
  if (success) return;

  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  throw new AppError(
    "RATE_LIMITED",
    "Too many attempts. Please try again later.",
    undefined,
    { "Retry-After": String(retryAfter) },
  );
}
