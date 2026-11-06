import { connection } from "next/server";
import { apiHandler, readJson } from "@/lib/api";
import { clientIp, enforceRateLimit, limits } from "@/lib/rate-limit";
import { loginSchema } from "@/modules/auth/auth.schema";
import { login } from "@/modules/auth/auth.service";
import { setSessionCookie } from "@/modules/auth/session";

export const POST = apiHandler(async (request) => {
  await connection();
  await enforceRateLimit(limits.loginIp, clientIp(request));
  const input = loginSchema.parse(await readJson(request));
  await enforceRateLimit(limits.loginEmail, input.email);
  const { user, session } = await login(input);
  await setSessionCookie(session.token, session.expiresAt);
  return Response.json({ user });
});
