"use client";

import { CalendarClockIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/datetime";
import type { InterviewWithApplication } from "@/modules/applications/types";
import { interviewTypeLabels } from "./interview-dialog";
import { useInterviews } from "./use-interviews";

export function InterviewsView() {
  const [range, setRange] = useState<"upcoming" | "past">("upcoming");
  const { data, isPending, isError, refetch } = useInterviews(range);

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
      </Tabs>

      {isPending ? (
        <div
          className="flex flex-col gap-3"
          aria-busy="true"
          aria-label="Loading"
        >
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm">Could not load interviews.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <CalendarClockIcon
            className="text-muted-foreground size-8"
            aria-hidden
          />
          <p className="text-sm">
            {range === "upcoming"
              ? "No upcoming interviews. Schedule one from an application."
              : "No past interviews yet."}
          </p>
          <Button variant="outline" render={<Link href="/applications" />}>
            Go to applications
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
  const groups = new Map<string, InterviewWithApplication[]>();
  for (const interview of interviews) {
    const day = new Date(interview.scheduledAt).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    groups.set(day, [...(groups.get(day) ?? []), interview]);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...groups].map(([day, items]) => (
        <section key={day} className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-sm font-medium">{day}</h2>
          <ul className="divide-y rounded-xl border">
            {items.map((interview) => (
              <li
                key={interview.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 text-sm"
              >
                <span className="w-14 font-medium tabular-nums">
                  {new Date(interview.scheduledAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/applications/${interview.applicationId}`}
                    className="font-medium hover:underline"
                  >
                    {interview.application.company}
                  </Link>
                  <p className="text-muted-foreground truncate">
                    {interview.title || interview.application.position} ·{" "}
                    {interviewTypeLabels[interview.type]}
                  </p>
                </div>
                {interview.meetingUrl && (
                  <a
                    href={interview.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline underline-offset-4"
                    aria-label={`Join meeting with ${interview.application.company} at ${formatDateTime(interview.scheduledAt)}`}
                  >
                    Join
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
