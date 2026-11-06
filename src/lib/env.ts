import "server-only";
import { z } from "zod";

// An empty value (`KEY=""`, as in .env.example) means "not set".
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    schema.optional(),
  );

// Server-side environment variables, validated once at startup.
// Add new variables here as milestones need them (CRON_SECRET, Upstash keys, ...).
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // Pooled connection string used by the app at runtime.
  DATABASE_URL: z.url(),
  // Set by Vercel: "production", "preview", or "development". Unset elsewhere.
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  // Upstash Redis for rate limiting. Required only on the Vercel production
  // deployment; without these, rate limiting is skipped (local dev, CI, previews).
  UPSTASH_REDIS_REST_URL: optional(z.url()),
  UPSTASH_REDIS_REST_TOKEN: optional(z.string().min(1)),
});

// NODE_ENV is "production" for every build (CI, previews, local `next build`),
// so the Upstash requirement keys off VERCEL_ENV instead.
const parsed = envSchema
  .refine(
    (env) =>
      env.VERCEL_ENV !== "production" ||
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
