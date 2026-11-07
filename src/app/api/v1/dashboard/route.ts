import { connection } from "next/server";
import { apiHandler } from "@/lib/api";
import { requireSession } from "@/modules/auth/session";
import { getDashboard } from "@/modules/dashboard/dashboard.service";

export const GET = apiHandler(async () => {
  await connection();
  const { user } = await requireSession();
  return Response.json(await getDashboard(user));
});
