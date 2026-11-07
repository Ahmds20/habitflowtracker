import { connection } from "next/server";
import { apiHandler, readJson } from "@/lib/api";
import {
  deleteAccountSchema,
  updateProfileSchema,
} from "@/modules/auth/auth.schema";
import { deleteAccount, updateProfile } from "@/modules/auth/auth.service";
import { deleteSessionCookie, requireSession } from "@/modules/auth/session";
import { isOnboarded } from "@/modules/onboarding/onboarding.service";

export const GET = apiHandler(async () => {
  await connection();
  const { user } = await requireSession();
  return Response.json({
    user: { ...user, onboarded: await isOnboarded(user.id) },
  });
});

export const PATCH = apiHandler(async (request) => {
  await connection();
  const { user } = await requireSession();
  const input = updateProfileSchema.parse(await readJson(request));
  return Response.json({ user: await updateProfile(user.id, input) });
});

// Permanently deletes the account and all its data, then signs out.
export const DELETE = apiHandler(async (request) => {
  await connection();
  const { user } = await requireSession();
  const input = deleteAccountSchema.parse(await readJson(request));
  await deleteAccount(user, input);
  await deleteSessionCookie();
  return new Response(null, { status: 204 });
});
