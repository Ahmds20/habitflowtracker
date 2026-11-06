import { connection } from "next/server";
import { apiHandler, readJson } from "@/lib/api";
import { parseId } from "@/lib/ids";
import { changeStatusSchema } from "@/modules/applications/applications.schema";
import { changeStatus } from "@/modules/applications/applications.service";
import { requireSession } from "@/modules/auth/session";

// Status has its own endpoint: each change writes a history event in the same transaction.
export const PATCH = apiHandler<
  RouteContext<"/api/v1/applications/[id]/status">
>(async (request, ctx) => {
  await connection();
  const { user } = await requireSession();
  const id = parseId((await ctx.params).id, "Application");
  const input = changeStatusSchema.parse(await readJson(request));
  return Response.json({ application: await changeStatus(user, id, input) });
});
