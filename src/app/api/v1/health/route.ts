import { connection } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/errors";

// Liveness + database check. Used to verify deploys.
export async function GET() {
  await connection();
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", db: "ok" });
  } catch (error) {
    console.error(error);
    return errorResponse("INTERNAL_ERROR", "Database unreachable");
  }
}
