import { connection } from "next/server";
import { apiHandler, readJson } from "@/lib/api";
import { parseId } from "@/lib/ids";
import { requireSession } from "@/modules/auth/session";
import { updateInterviewSchema } from "@/modules/interviews/interviews.schema";
import {
  deleteInterview,
  updateInterview,
} from "@/modules/interviews/interviews.service";

type Ctx = RouteContext<"/api/v1/interviews/[id]">;

export const PATCH = apiHandler<Ctx>(async (request, ctx) => {
  await connection();
  const { user } = await requireSession();
  const id = parseId((await ctx.params).id, "Interview");
  const input = updateInterviewSchema.parse(await readJson(request));
  return Response.json({
    interview: await updateInterview(user.id, id, input),
  });
});

export const DELETE = apiHandler<Ctx>(async (_request, ctx) => {
  await connection();
  const { user } = await requireSession();
  const id = parseId((await ctx.params).id, "Interview");
  await deleteInterview(user.id, id);
  return new Response(null, { status: 204 });
});
