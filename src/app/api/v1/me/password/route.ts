import { connection } from "next/server";
import { apiHandler, readJson } from "@/lib/api";
import { changePasswordSchema } from "@/modules/auth/auth.schema";
import { changePassword } from "@/modules/auth/auth.service";
import { requireSession } from "@/modules/auth/session";

export const POST = apiHandler(async (request) => {
  await connection();
  const { user, sessionId } = await requireSession();
  const input = changePasswordSchema.parse(await readJson(request));
  await changePassword(user, sessionId, input);
  return new Response(null, { status: 204 });
});
