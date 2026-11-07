import { connection } from "next/server";
import { z } from "zod";
import { apiHandler, readJson } from "@/lib/api";
import { clientIp, enforceRateLimit, limits } from "@/lib/rate-limit";
import { isValidTimezone } from "@/modules/auth/auth.schema";
import { setSessionCookie } from "@/modules/auth/session";
import { createDemoUser } from "@/modules/demo/demo.service";

const demoSchema = z
  .object({
    // The browser's timezone, so "today" in the demo matches the visitor's day.
    timezone: z.string().refine(isValidTimezone).catch("UTC"),
  })
  .strict();

// Creates a private demo account with sample data and signs the visitor in.
export const POST = apiHandler(async (request) => {
  await connection();
  await enforceRateLimit(limits.demo, clientIp(request));
  const { timezone } = demoSchema.parse(await readJson(request));
  const { session } = await createDemoUser(timezone);
  await setSessionCookie(session.token, session.expiresAt);
  return new Response(null, { status: 201 });
});
