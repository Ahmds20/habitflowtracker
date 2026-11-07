import { connection } from "next/server";
import { apiHandler, readJson } from "@/lib/api";
import { searchParamsOf } from "@/lib/ids";
import { requireSession } from "@/modules/auth/session";
import {
  createHabitSchema,
  listHabitsQuery,
} from "@/modules/habits/habits.schema";
import { createHabit, listHabits } from "@/modules/habits/habits.service";

export const GET = apiHandler(async (request) => {
  await connection();
  const { user } = await requireSession();
  const query = listHabitsQuery.parse(searchParamsOf(request));
  return Response.json({ habits: await listHabits(user, query) });
});

export const POST = apiHandler(async (request) => {
  await connection();
  const { user } = await requireSession();
  const input = createHabitSchema.parse(await readJson(request));
  return Response.json(
    { habit: await createHabit(user, input) },
    { status: 201 },
  );
});
