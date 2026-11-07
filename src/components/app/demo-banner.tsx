import Link from "next/link";
import { getCurrentUser } from "@/modules/auth/session";

// Shown on every app page for demo accounts, so visitors know the data is
// sample data and where to go to keep their own.
export async function DemoBanner() {
  const user = await getCurrentUser();
  if (!user?.isDemo) return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b bg-amber-50 px-4 py-2 text-center text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <span>
        You are using a demo account with sample data. It is deleted within a
        day.
      </span>
      <Link
        href="/register"
        className="font-medium underline underline-offset-4"
      >
        Create your own account
      </Link>
    </div>
  );
}
