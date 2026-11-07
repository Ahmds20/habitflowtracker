"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useCallback, useTransition } from "react";
import { LOCALE_COOKIE, intlLocale, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";
import en from "./dictionaries/en";
import id from "./dictionaries/id";

const dictionaries: Record<Locale, Dictionary> = { en, id };

type I18n = { locale: Locale; t: Dictionary; intl: string };

const I18nContext = createContext<I18n | null>(null);

// The server reads the locale (cookie or Accept-Language) and passes only the
// code; both dictionaries are small, so the client bundle includes them.
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <I18nContext
      value={{ locale, t: dictionaries[locale], intl: intlLocale[locale] }}
    >
      {children}
    </I18nContext>
  );
}

export function useI18n() {
  const value = use(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}

// Translates an error message from the API when the dictionary has it.
export function useServerMessage() {
  const { t } = useI18n();
  return (message: string) => t.serverMessages[message] ?? message;
}

// Saves the language for a year and re-renders server components with it.
export function useSetLocale() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      startTransition(() => router.refresh());
    },
    [router],
  );
  return { setLocale, pending };
}
