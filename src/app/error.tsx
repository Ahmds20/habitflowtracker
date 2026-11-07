"use client";

import { useEffect } from "react";
import { StatusPage } from "@/components/app/status-page";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

// Catches errors thrown while rendering a page. The message is not shown:
// it may contain details meant for developers, not users.
export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <StatusPage
      code="500"
      title={t.errors.errorTitle}
      body={t.errors.errorBody}
      action={<Button onClick={() => retry()}>{t.common.tryAgain}</Button>}
    />
  );
}
