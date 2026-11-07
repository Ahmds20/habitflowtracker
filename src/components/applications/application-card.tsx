"use client";

import Link from "next/link";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import type {
  ApplicationOutcome,
  ApplicationStatus,
} from "@/modules/applications/applications.schema";
import { useI18n } from "@/i18n/client";
import { formatLocalDate, statusDotClass } from "@/modules/applications/labels";
import type { ApplicationSummary } from "@/modules/applications/types";
import { cn } from "@/lib/utils";
import { StatusSelect } from "./status-select";

export function ApplicationCard({
  app,
  onStatusChange,
  className,
  dragHandle,
}: {
  app: ApplicationSummary;
  onStatusChange: (
    status: ApplicationStatus,
    outcome?: ApplicationOutcome,
  ) => void;
  className?: string;
  dragHandle?: React.ReactNode;
}) {
  const { t, intl } = useI18n();
  return (
    <article
      className={cn(
        "bg-card relative flex flex-col gap-2.5 overflow-hidden rounded-xl border p-3.5 pl-4 text-sm shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      {/* Status colour strip on the left edge, as in the design reference. */}
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          statusDotClass[app.status],
        )}
        aria-hidden
      />
      <div className="flex items-start gap-2">
        {dragHandle}
        <div className="min-w-0 flex-1">
          <Link
            href={`/applications/${app.id}`}
            className="block truncate font-semibold hover:underline"
          >
            {app.company}
          </Link>
          <p className="text-muted-foreground truncate">{app.position}</p>
        </div>
      </div>
      <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {app.appliedDate && (
          <span className="flex items-center gap-1">
            <CalendarIcon className="size-3" aria-hidden />
            {formatLocalDate(app.appliedDate, intl)}
          </span>
        )}
        {app.location && (
          <span className="flex min-w-0 items-center gap-1">
            <MapPinIcon className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{app.location}</span>
          </span>
        )}
      </div>
      <StatusSelect
        status={app.status}
        outcome={app.outcome}
        onChange={onStatusChange}
        label={t.applications.statusOf(app.company)}
        className="w-full"
      />
    </article>
  );
}
