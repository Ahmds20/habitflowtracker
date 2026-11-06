"use client";

import { BriefcaseIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApplicationStatus } from "@/modules/applications/applications.schema";
import { statusLabels } from "@/modules/applications/labels";
import type { ApplicationSummary } from "@/modules/applications/types";
import { AddApplicationDialog } from "./add-application-dialog";
import { ApplicationCard } from "./application-card";
import { CloseApplicationDialog } from "./close-application-dialog";
import { KanbanBoard, boardColumns } from "./kanban-board";
import { useApplications, useChangeStatus } from "./use-applications";

export function ApplicationsView() {
  const { data, isPending, isError, refetch } = useApplications();
  const changeStatus = useChangeStatus();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ApplicationStatus>("applied");
  const [closing, setClosing] = useState<ApplicationSummary | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(
      (a) =>
        a.company.toLowerCase().includes(q) ||
        a.position.toLowerCase().includes(q),
    );
  }, [data, query]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(
      boardColumns.map((s) => [s, 0]),
    ) as Record<ApplicationStatus, number>;
    for (const app of filtered) result[app.status] += 1;
    return result;
  }, [filtered]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <SearchIcon
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search company or position"
            aria-label="Search applications"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="ml-auto">
          <AddApplicationDialog />
        </div>
      </div>

      {isPending ? (
        <BoardSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border p-10 text-center">
          <p className="text-sm">Could not load your applications.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : data.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Desktop and tablet: kanban board */}
          <div className="hidden overflow-x-auto pb-2 lg:block">
            <div className="min-w-[1080px]">
              <KanbanBoard
                applications={filtered}
                onMove={changeStatus}
                onRequestClose={setClosing}
              />
            </div>
          </div>

          {/* Mobile: one status at a time */}
          <div className="flex flex-col gap-3 lg:hidden">
            <div className="-mx-4 overflow-x-auto px-4">
              <Tabs
                value={tab}
                onValueChange={(value) => setTab(value as ApplicationStatus)}
              >
                <TabsList>
                  {boardColumns.map((status) => (
                    <TabsTrigger key={status} value={status} className="px-2.5">
                      {statusLabels[status]}
                      <span className="text-muted-foreground tabular-nums">
                        {counts[status]}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            {filtered
              .filter((a) => a.status === tab)
              .map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onStatusChange={(status, outcome) =>
                    changeStatus(app, status, outcome)
                  }
                />
              ))}
            {counts[tab] === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Nothing in {statusLabels[tab]}
                {query && " matching your search"}.
              </p>
            )}
          </div>
        </>
      )}

      <CloseApplicationDialog
        app={closing}
        onCancel={() => setClosing(null)}
        onPick={(app, outcome) => {
          setClosing(null);
          changeStatus(app, "closed", outcome);
        }}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
      <BriefcaseIcon className="text-muted-foreground size-8" aria-hidden />
      <div>
        <p className="font-medium">No applications yet</p>
        <p className="text-muted-foreground text-sm">
          Add the first job you applied to, or one you plan to apply to.
        </p>
      </div>
      <AddApplicationDialog />
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-3 lg:grid-cols-6"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className={
            i > 0 ? "hidden flex-col gap-2 lg:flex" : "flex flex-col gap-2"
          }
        >
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ))}
    </div>
  );
}
