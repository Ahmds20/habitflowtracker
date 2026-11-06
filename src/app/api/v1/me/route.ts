import { connection } from "next/server";
import { apiHandler, readJson } from "@/lib/api";
import { updateProfileSchema } from "@/modules/auth/auth.schema";
import { updateProfile } from "@/modules/auth/auth.service";
import { requireSession } from "@/modules/auth/session";

export const GET = apiHandler(async () => {
  await connection();
  const { user } = await requireSession();
  return Response.json({ user });
});

export const PATCH = apiHandler(async (request) => {
  await connection();
  const { user } = await requireSession();
  const input = updateProfileSchema.parse(await readJson(request));
  return Response.json({ user: await updateProfile(user.id, input) });
});
