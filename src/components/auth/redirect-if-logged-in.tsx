import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";

// Rendered inside <Suspense> on /login and /register.
// Sends visitors who already have a valid session to the dashboard.
export async function RedirectIfLoggedIn() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return null;
}
