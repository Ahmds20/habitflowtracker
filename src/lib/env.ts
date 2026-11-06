import "server-only";
import { z } from "zod";

// Server-side environment variables, validated once at startup.
// Add new variables here as milestones need them (CRON_SECRET, Upstash keys, ...).
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // Pooled connection string used by the app at runtime.
  DATABASE_URL: z.url(),
  // Upstash Redis for rate limiting. Optional outside production:
  // without these, rate limiting is skipped (local dev and tests).
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

const parsed = envSchema
  .refine(
    (env) =>
      env.NODE_ENV !== "production" ||
      process.env.CI === "true" ||
      (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
    {
      message: "Upstash credentials are required in production",
      path: ["UPSTASH_REDIS_REST_URL"],
    },
  )
  .safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    z.flattenError(parsed.error).fieldErrors,
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
