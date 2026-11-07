"use client";

import { StatusPage } from "@/components/app/status-page";
import { useI18n } from "@/i18n/client";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <StatusPage
      code="404"
      title={t.errors.notFoundTitle}
      body={t.errors.notFoundBody}
    />
  );
}
