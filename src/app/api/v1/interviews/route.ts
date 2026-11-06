import { connection } from "next/server";
import { apiHandler } from "@/lib/api";
import { searchParamsOf } from "@/lib/ids";
import { requireSession } from "@/modules/auth/session";
import { listInterviewsQuery } from "@/modules/interviews/interviews.schema";
import { listInterviews } from "@/modules/interviews/interviews.service";

export const GET = apiHandler(async (request) => {
  await connection();
  const { user } = await requireSession();
  const { range } = listInterviewsQuery.parse(searchParamsOf(request));
  return Response.json({ interviews: await listInterviews(user.id, range) });
});
