"use client";

import type { Dictionary } from "@/i18n/dictionaries/en";
import { useI18n } from "@/i18n/client";
import { PageHeader } from "./page-header";

type Section =
  "dashboard" | "applications" | "interviews" | "habits" | "settings" | "more";

// Page title and description in the current language. Server pages render
// this so they can stay static while the text follows the visitor's locale.
export function TranslatedHeader({ section }: { section: Section }) {
  const { t } = useI18n();
  const entry = t[section] as Dictionary[Section] & { description?: string };
  return <PageHeader title={entry.title} description={entry.description} />;
}
