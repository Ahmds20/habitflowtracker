import { I18nProvider } from "./client";
import { getLocale } from "./server";

// Reads the visitor's language once per request and makes it available to
// every Client Component through useI18n().
export async function LocaleBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return <I18nProvider locale={locale}>{children}</I18nProvider>;
}
