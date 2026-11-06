import { connection } from "next/server";
import { apiHandler, readJson } from "@/lib/api";
import { loginSchema } from "@/modules/auth/auth.schema";
import { login } from "@/modules/auth/auth.service";
import { setSessionCookie } from "@/modules/auth/session";

export const POST = apiHandler(async (request) => {
  await connection();
  const input = loginSchema.parse(await readJson(request));
  const { user, session } = await login(input);
  await setSessionCookie(session.token, session.expiresAt);
  return Response.json({ user });
});
