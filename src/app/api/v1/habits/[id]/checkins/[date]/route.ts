import { connection } from "next/server";
import { apiHandler } from "@/lib/api";
import { parseId } from "@/lib/ids";
import { requireSession } from "@/modules/auth/session";
import { checkinDateParam } from "@/modules/habits/habits.schema";
import { checkIn, undoCheckIn } from "@/modules/habits/habits.service";

type Ctx = RouteContext<"/api/v1/habits/[id]/checkins/[date]">;

async function target(ctx: Ctx) {
  const params = await ctx.params;
  return {
    id: parseId(params.id, "Habit"),
    date: checkinDateParam.parse(params.date),
  };
}

// PUT is idempotent: checking in twice for the same day has the same result.
export const PUT = apiHandler<Ctx>(async (_request, ctx) => {
  await connection();
  const { user } = await requireSession();
  const { id, date } = await target(ctx);
  return Response.json({ habit: await checkIn(user, id, date) });
});

export const DELETE = apiHandler<Ctx>(async (_request, ctx) => {
  await connection();
  const { user } = await requireSession();
  const { id, date } = await target(ctx);
  return Response.json({ habit: await undoCheckIn(user, id, date) });
});
