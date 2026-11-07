"use client";

import { CalendarClockIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/i18n/client";
import { formatDateTime, formatLongDay, formatTime } from "@/lib/datetime";
import type { InterviewWithApplication } from "@/modules/applications/types";
import { useInterviews } from "./use-interviews";

export function InterviewsView() {
  const { t } = useI18n();
  const iv = t.interviews;
  const [range, setRange] = useState<"upcoming" | "past">("upcoming");
  const { data, isPending, isError, refetch } = useInterviews(range);

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
        <TabsList>
          <TabsTrigger value="upcoming">{iv.upcoming}</TabsTrigger>
          <TabsTrigger value="past">{iv.past}</TabsTrigger>
        </TabsList>
      </Tabs>

      {isPending ? (
        <div
          className="flex flex-col gap-3"
          aria-busy="true"
          aria-label={t.common.loading}
        >
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm">{iv.loadFailed}</p>
          <Button variant="outline" onClick={() => refetch()}>
            {t.common.tryAgain}
          </Button>
        </div>
      ) : data.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <CalendarClockIcon className="size-6" aria-hidden />
          </span>
          <p className="text-sm">
            {range === "upcoming" ? iv.noUpcoming : iv.noPast}
          </p>
          <Button variant="outline" render={<Link href="/applications" />}>
            {iv.goToApplications}
          </Button>
        </div>
      ) : (
        <GroupedList interviews={data} />
      )}
    </div>
  );
}

// Groups interviews under a heading per day in the browser's timezone.
function GroupedList({
  interviews,
}: {
  interviews: InterviewWithApplication[];
}) {
  const { t, intl } = useI18n();
  const iv = t.interviews;
  const groups = new Map<string, InterviewWithApplication[]>();
  for (const interview of interviews) {
    const day = formatLongDay(interview.scheduledAt, intl);
    groups.set(day, [...(groups.get(day) ?? []), interview]);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...groups].map(([day, items]) => (
        <section key={day} className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-sm font-semibold">{day}</h2>
          <ul className="bg-card divide-y overflow-hidden rounded-2xl border shadow-sm">
            {items.map((interview) => (
              <li
                key={interview.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 text-sm"
              >
                <span className="w-16 rounded-lg bg-amber-50 px-2 py-1 text-center font-semibold text-amber-700 tabular-nums dark:bg-amber-950/60 dark:text-amber-300">
                  {formatTime(interview.scheduledAt, intl)}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/applications/${interview.applicationId}`}
                    className="font-semibold hover:underline"
                  >
                    {interview.application.company}
                  </Link>
                  <p className="text-muted-foreground truncate">
                    {interview.title || interview.application.position} ·{" "}
                    {iv.types[interview.type]}
                  </p>
                </div>
                {interview.meetingUrl && (
                  <a
                    href={interview.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs font-semibold underline underline-offset-4"
                    aria-label={iv.joinLabel(
                      interview.application.company,
                      formatDateTime(interview.scheduledAt, intl),
                    )}
                  >
                    {iv.join}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
