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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    z.flattenError(parsed.error).fieldErrors,
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
