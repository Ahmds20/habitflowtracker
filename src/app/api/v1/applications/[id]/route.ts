import { connection } from "next/server";
import { apiHandler, readJson } from "@/lib/api";
import { parseId } from "@/lib/ids";
import { updateApplicationSchema } from "@/modules/applications/applications.schema";
import {
  deleteApplication,
  getApplication,
  updateApplication,
} from "@/modules/applications/applications.service";
import { requireSession } from "@/modules/auth/session";

type Ctx = RouteContext<"/api/v1/applications/[id]">;

export const GET = apiHandler<Ctx>(async (_request, ctx) => {
  await connection();
  const { user } = await requireSession();
  const id = parseId((await ctx.params).id, "Application");
  return Response.json({ application: await getApplication(user.id, id) });
});

export const PATCH = apiHandler<Ctx>(async (request, ctx) => {
  await connection();
  const { user } = await requireSession();
  const id = parseId((await ctx.params).id, "Application");
  const input = updateApplicationSchema.parse(await readJson(request));
  return Response.json({
    application: await updateApplication(user.id, id, input),
  });
});

export const DELETE = apiHandler<Ctx>(async (_request, ctx) => {
  await connection();
  const { user } = await requireSession();
  const id = parseId((await ctx.params).id, "Application");
  await deleteApplication(user.id, id);
  return new Response(null, { status: 204 });
});
