// Shared by server and client code. No server-only imports here.

export const locales = ["en", "id"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

// The chosen language lives in a cookie so the server renders the right text
// on the first request (decision D34: URLs stay the same in every language).
export const LOCALE_COOKIE = "hf-locale";

// BCP 47 tags for Intl date and number formatting.
export const intlLocale: Record<Locale, string> = {
  en: "en-GB",
  id: "id-ID",
};

export function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}

// Picks a supported language from an Accept-Language header,
// e.g. "id-ID,id;q=0.9,en;q=0.8" -> "id".
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return defaultLocale;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .filter((entry) => !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q);
  return (
    (ranked.find((entry) => isLocale(entry.lang))?.lang as Locale) ??
    defaultLocale
  );
}
