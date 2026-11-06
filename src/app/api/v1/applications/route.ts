import { connection } from "next/server";
import { apiHandler, readJson } from "@/lib/api";
import { searchParamsOf } from "@/lib/ids";
import {
  createApplicationSchema,
  listApplicationsQuery,
} from "@/modules/applications/applications.schema";
import {
  createApplication,
  listApplications,
} from "@/modules/applications/applications.service";
import { requireSession } from "@/modules/auth/session";

export const GET = apiHandler(async (request) => {
  await connection();
  const { user } = await requireSession();
  const query = listApplicationsQuery.parse(searchParamsOf(request));
  return Response.json({
    applications: await listApplications(user.id, query),
  });
});

export const POST = apiHandler(async (request) => {
  await connection();
  const { user } = await requireSession();
  const input = createApplicationSchema.parse(await readJson(request));
  const application = await createApplication(user, input);
  return Response.json({ application }, { status: 201 });
});
