import "server-only";
import { cookies, headers } from "next/headers";
import {
  LOCALE_COOKIE,
  isLocale,
  localeFromAcceptLanguage,
  type Locale,
} from "./config";
import en from "./dictionaries/en";
import id from "./dictionaries/id";

const dictionaries = { en, id };

// The visitor's language: the saved cookie first, then the browser's
// Accept-Language header. Reading request data makes the caller dynamic,
// so call it inside a <Suspense> boundary.
export async function getLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return localeFromAcceptLanguage((await headers()).get("accept-language"));
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
