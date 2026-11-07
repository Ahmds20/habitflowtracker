import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/server";
import { getCurrentUser } from "@/modules/auth/session";

// Shown on every app page for demo accounts, so visitors know the data is
// sample data and where to go to keep their own.
export async function DemoBanner() {
  const user = await getCurrentUser();
  if (!user?.isDemo) return null;
  const t = getDictionary(await getLocale());
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-100"
    >
      <span>{t.demo.banner}</span>
      <Link
        href="/register"
        className="font-semibold underline underline-offset-4"
      >
        {t.demo.createOwn}
      </Link>
    </div>
  );
}
