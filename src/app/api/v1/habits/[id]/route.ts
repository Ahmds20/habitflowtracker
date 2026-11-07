import { connection } from "next/server";
import { apiHandler, readJson } from "@/lib/api";
import { parseId } from "@/lib/ids";
import { requireSession } from "@/modules/auth/session";
import { updateHabitSchema } from "@/modules/habits/habits.schema";
import {
  deleteHabit,
  getHabit,
  updateHabit,
} from "@/modules/habits/habits.service";

type Ctx = RouteContext<"/api/v1/habits/[id]">;

export const GET = apiHandler<Ctx>(async (_request, ctx) => {
  await connection();
  const { user } = await requireSession();
  const id = parseId((await ctx.params).id, "Habit");
  return Response.json({ habit: await getHabit(user, id) });
});

export const PATCH = apiHandler<Ctx>(async (request, ctx) => {
  await connection();
  const { user } = await requireSession();
  const id = parseId((await ctx.params).id, "Habit");
  const input = updateHabitSchema.parse(await readJson(request));
  return Response.json({ habit: await updateHabit(user, id, input) });
});

export const DELETE = apiHandler<Ctx>(async (_request, ctx) => {
  await connection();
  const { user } = await requireSession();
  const id = parseId((await ctx.params).id, "Habit");
  await deleteHabit(user, id);
  return new Response(null, { status: 204 });
});
