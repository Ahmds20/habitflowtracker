import { connection } from "next/server";
import { apiHandler } from "@/lib/api";
import {
  deleteSessionCookie,
  getSession,
  invalidateSession,
} from "@/modules/auth/session";

// Logging out when already logged out still succeeds.
export const POST = apiHandler(async () => {
  await connection();
  const session = await getSession();
  if (session) await invalidateSession(session.sessionId);
  await deleteSessionCookie();
  return new Response(null, { status: 204 });
});
