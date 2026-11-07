import { connection } from "next/server";
import { isAuthorizedCron } from "@/lib/cron";
import { errorResponse, toErrorResponse } from "@/lib/errors";
import { deleteExpiredDemoUsers } from "@/modules/demo/demo.service";

// Daily Vercel Cron job (see vercel.json): deletes demo accounts older than
// 24 hours, with all their data. Not under /api/v1: it is not part of the public API.
export async function GET(request: Request) {
  await connection();
  if (!isAuthorizedCron(request)) {
    return errorResponse("UNAUTHENTICATED", "Invalid cron secret");
  }
  try {
    const deleted = await deleteExpiredDemoUsers();
    return Response.json({ deleted });
  } catch (error) {
    return toErrorResponse(error);
  }
}
