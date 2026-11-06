"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ApplicationOutcome,
  ApplicationStatus,
} from "@/modules/applications/applications.schema";
import {
  choiceKey,
  outcomeLabels,
  statusChoices,
  statusDotClass,
} from "@/modules/applications/labels";
import { cn } from "@/lib/utils";

// Status picker used on cards, in the mobile list, and on the detail page.
// It is also the accessible alternative to drag-and-drop.
export function StatusSelect({
  status,
  outcome,
  onChange,
  size = "sm",
  className,
  label = "Status",
}: {
  status: ApplicationStatus;
  outcome: ApplicationOutcome | null;
  onChange: (status: ApplicationStatus, outcome?: ApplicationOutcome) => void;
  size?: "sm" | "default";
  className?: string;
  label?: string;
}) {
  // The trigger shows only the outcome for closed items ("Rejected"), which
  // fits narrow kanban cards; the open list shows the full "Closed · Rejected".
  const items = Object.fromEntries(
    statusChoices.map((c) => [
      c.key,
      c.outcome ? outcomeLabels[c.outcome] : c.label,
    ]),
  );
  return (
    <Select
      items={items}
      value={choiceKey(status, outcome)}
      onValueChange={(key) => {
        const choice = statusChoices.find((c) => c.key === key);
        if (choice) onChange(choice.status, choice.outcome);
      }}
    >
      <SelectTrigger size={size} aria-label={label} className={cn(className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusChoices.map((choice) => (
          <SelectItem key={choice.key} value={choice.key}>
            <span
              className={cn(
                "size-2 rounded-full",
                statusDotClass[choice.status],
              )}
              aria-hidden
            />
            {choice.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
