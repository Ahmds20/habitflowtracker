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
import { statusDotClass, statusLabels } from "@/modules/applications/labels";
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    // Small distance so clicks on links and selects inside a card still work.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const active = applications.find((a) => a.id === activeId);

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
          onDragStart: ({ active }) =>
            `Picked up ${cardName(applications, active.id)}.`,
          onDragOver: ({ active, over }) =>
            over
              ? `${cardName(applications, active.id)} is over ${statusLabels[over.id as ApplicationStatus]}.`
              : `${cardName(applications, active.id)} is not over a column.`,
          onDragEnd: ({ active, over }) =>
            over
              ? `${cardName(applications, active.id)} was moved to ${statusLabels[over.id as ApplicationStatus]}.`
              : `${cardName(applications, active.id)} was dropped.`,
          onDragCancel: ({ active }) =>
            `Moving ${cardName(applications, active.id)} was cancelled.`,
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

function cardName(applications: ApplicationSummary[], id: string | number) {
  return applications.find((a) => a.id === id)?.company ?? "Card";
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
  return (
    <section
      ref={setNodeRef}
      aria-label={`${statusLabels[status]} column`}
      className={cn(
        "bg-muted/50 flex min-h-64 min-w-0 flex-col gap-2 rounded-xl p-2 transition-colors",
        isOver && "bg-muted ring-ring/40 ring-2",
      )}
    >
      <h2 className="flex items-center gap-2 px-1 py-1 text-sm font-medium">
        <span
          className={cn("size-2 rounded-full", statusDotClass[status])}
          aria-hidden
        />
        {statusLabels[status]}
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
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
  return (
    <div ref={setNodeRef} className={cn(isDragging && "opacity-40")}>
      <ApplicationCard
        app={app}
        onStatusChange={onStatusChange}
        dragHandle={
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground -ml-1 cursor-grab touch-none rounded p-0.5 active:cursor-grabbing"
            aria-label={`Drag ${app.company}`}
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
