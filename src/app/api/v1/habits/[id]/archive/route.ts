import { connection } from "next/server";
import { apiHandler } from "@/lib/api";
import { parseId } from "@/lib/ids";
import { requireSession } from "@/modules/auth/session";
import { setArchived } from "@/modules/habits/habits.service";

export const POST = apiHandler<RouteContext<"/api/v1/habits/[id]/archive">>(
  async (_request, ctx) => {
    await connection();
    const { user } = await requireSession();
    const id = parseId((await ctx.params).id, "Habit");
    return Response.json({ habit: await setArchived(user, id, true) });
  },
);
