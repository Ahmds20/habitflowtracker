"use client";

import { LogoutButton } from "@/components/app/logout-button";
import { PageHeader } from "@/components/app/page-header";
import {
  LanguageControl,
  ThemeControl,
} from "@/components/theme/preference-controls";
import { useI18n } from "@/i18n/client";

export function SettingsView() {
  const { t } = useI18n();
  return (
    <>
      <PageHeader
        title={t.settings.title}
        description={t.settings.description}
      />
      <section className="bg-card flex max-w-xl flex-col gap-5 rounded-2xl border p-5 shadow-sm">
        <h2 className="font-bold">{t.settings.appearance}</h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium">{t.preferences.theme}</span>
          <ThemeControl />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium">{t.preferences.language}</span>
          <LanguageControl />
        </div>
      </section>
      {/* Logout lives in the sidebar on desktop; this one is for mobile. */}
      <LogoutButton className="mt-4 md:hidden" />
    </>
  );
}
