import { connection } from "next/server";
import { apiHandler, readJson } from "@/lib/api";
import { clientIp, enforceRateLimit, limits } from "@/lib/rate-limit";
import { registerSchema } from "@/modules/auth/auth.schema";
import { register } from "@/modules/auth/auth.service";
import { setSessionCookie } from "@/modules/auth/session";

export const POST = apiHandler(async (request) => {
  await connection();
  await enforceRateLimit(limits.register, clientIp(request));
  const input = registerSchema.parse(await readJson(request));
  const { user, session } = await register(input);
  await setSessionCookie(session.token, session.expiresAt);
  return Response.json({ user }, { status: 201 });
});
