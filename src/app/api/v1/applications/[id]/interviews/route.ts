import { connection } from "next/server";
import { apiHandler, readJson } from "@/lib/api";
import { parseId } from "@/lib/ids";
import { requireSession } from "@/modules/auth/session";
import { createInterviewSchema } from "@/modules/interviews/interviews.schema";
import { createInterview } from "@/modules/interviews/interviews.service";

export const POST = apiHandler<
  RouteContext<"/api/v1/applications/[id]/interviews">
>(async (request, ctx) => {
  await connection();
  const { user } = await requireSession();
  const applicationId = parseId((await ctx.params).id, "Application");
  const input = createInterviewSchema.parse(await readJson(request));
  const interview = await createInterview(user.id, applicationId, input);
  return Response.json({ interview }, { status: 201 });
});
