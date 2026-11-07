import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { isOnboarded } from "@/modules/onboarding/onboarding.service";

// Server-side guard for app pages. The proxy only checks that a cookie exists;
// this validates the session against the database and redirects when it is invalid.
export async function requireUserOrRedirect() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Rendered once in the app layout: sends logged-out visitors to /login and
// users who have not finished onboarding to /onboarding (decision D5).
export async function AppGuard() {
  const user = await requireUserOrRedirect();
  if (!(await isOnboarded(user.id))) redirect("/onboarding");
  return null;
}

export async function UserBadge() {
  const user = await requireUserOrRedirect();
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
  return (
    <div className="bg-muted/60 flex min-w-0 items-center gap-3 rounded-xl border p-2.5">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white"
        aria-hidden
      >
        {initials || "?"}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <p className="text-muted-foreground truncate text-xs">{user.email}</p>
      </div>
    </div>
  );
}
