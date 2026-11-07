"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { GripVerticalIcon } from "lucide-react";
import { useState } from "react";
import type {
  ApplicationOutcome,
  ApplicationStatus,
} from "@/modules/applications/applications.schema";
import { useI18n } from "@/i18n/client";
import { statusDotClass } from "@/modules/applications/labels";
import type { ApplicationSummary } from "@/modules/applications/types";
import { cn } from "@/lib/utils";
import { ApplicationCard } from "./application-card";

export const boardColumns = [
  "wishlist",
  "applied",
  "assessment",
  "interview",
  "offer",
  "closed",
] as const satisfies readonly ApplicationStatus[];

type Move = (
  app: ApplicationSummary,
  status: ApplicationStatus,
  outcome?: ApplicationOutcome,
) => void;

// Desktop kanban. Dropping a card on "Closed" opens the outcome picker,
// because a closed application must record how it ended.
export function KanbanBoard({
  applications,
  onMove,
  onRequestClose,
}: {
  applications: ApplicationSummary[];
  onMove: Move;
  onRequestClose: (app: ApplicationSummary) => void;
}) {
  const { t } = useI18n();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    // Small distance so clicks on links and selects inside a card still work.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const active = applications.find((a) => a.id === activeId);
  const dnd = t.applications.dnd;
  const name = (id: string | number) =>
    applications.find((a) => a.id === id)?.company ?? "";

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const app = applications.find((a) => a.id === event.active.id);
    const target = event.over?.id as ApplicationStatus | undefined;
    if (!app || !target || target === app.status) return;
    if (target === "closed") onRequestClose(app);
    else onMove(app, target);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => dnd.pickedUp(name(active.id)),
          onDragOver: ({ active, over }) =>
            over
              ? dnd.over(
                  name(active.id),
                  t.status[over.id as ApplicationStatus],
                )
              : dnd.notOver(name(active.id)),
          onDragEnd: ({ active, over }) =>
            over
              ? dnd.moved(
                  name(active.id),
                  t.status[over.id as ApplicationStatus],
                )
              : dnd.dropped(name(active.id)),
          onDragCancel: ({ active }) => dnd.cancelled(name(active.id)),
        },
      }}
    >
      <div className="grid grid-cols-6 gap-3">
        {boardColumns.map((status) => (
          <Column
            key={status}
            status={status}
            applications={applications.filter((a) => a.status === status)}
            onMove={onMove}
            onRequestClose={onRequestClose}
          />
        ))}
      </div>
      <DragOverlay>
        {active && (
          <ApplicationCard
            app={active}
            onStatusChange={() => {}}
            className="rotate-2 shadow-lg"
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  status,
  applications,
  onMove,
  onRequestClose,
}: {
  status: ApplicationStatus;
  applications: ApplicationSummary[];
  onMove: Move;
  onRequestClose: (app: ApplicationSummary) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const { t } = useI18n();
  return (
    <section
      ref={setNodeRef}
      aria-label={t.applications.column(t.status[status])}
      className={cn(
        "flex min-h-[28rem] min-w-0 flex-col gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-100/70 p-2.5 transition-colors dark:border-slate-800 dark:bg-slate-900/50",
        isOver && "ring-primary/40 bg-secondary ring-2",
      )}
    >
      <h2 className="flex items-center gap-2 px-1.5 py-1 text-sm font-semibold">
        <span
          className={cn("size-2 rounded-full", statusDotClass[status])}
          aria-hidden
        />
        {t.status[status]}
        <span className="bg-background text-muted-foreground ml-auto rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums">
          {applications.length}
        </span>
      </h2>
      {applications.map((app) => (
        <DraggableCard
          key={app.id}
          app={app}
          onStatusChange={(next, outcome) =>
            next === "closed" && !outcome
              ? onRequestClose(app)
              : onMove(app, next, outcome)
          }
        />
      ))}
    </section>
  );
}

function DraggableCard({
  app,
  onStatusChange,
}: {
  app: ApplicationSummary;
  onStatusChange: (
    status: ApplicationStatus,
    outcome?: ApplicationOutcome,
  ) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: app.id,
  });
  const { t } = useI18n();
  return (
    <div ref={setNodeRef} className={cn(isDragging && "opacity-40")}>
      <ApplicationCard
        app={app}
        onStatusChange={onStatusChange}
        dragHandle={
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground -ml-1 cursor-grab touch-none rounded p-0.5 active:cursor-grabbing"
            aria-label={t.applications.drag(app.company)}
            {...listeners}
            {...attributes}
          >
            <GripVerticalIcon className="size-4" aria-hidden />
          </button>
        }
      />
    </div>
  );
}
