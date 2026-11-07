"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { LogoMark } from "./logo-mark";

// Shared layout for the 404 page and error boundaries.
export function StatusPage({
  code,
  title,
  body,
  action,
}: {
  code: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <LogoMark className="text-primary size-14" />
      <p className="text-primary text-sm font-bold tracking-wide tabular-nums">
        {code}
      </p>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground max-w-sm">{body}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {action}
        <Button variant="outline" render={<Link href="/dashboard" />}>
          {t.errors.goHome}
        </Button>
      </div>
    </div>
  );
}
