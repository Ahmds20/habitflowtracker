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
import { useI18n } from "@/i18n/client";
import {
  choiceKey,
  statusChoices,
  statusDotClass,
  statusText,
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
  label,
}: {
  status: ApplicationStatus;
  outcome: ApplicationOutcome | null;
  onChange: (status: ApplicationStatus, outcome?: ApplicationOutcome) => void;
  size?: "sm" | "default";
  className?: string;
  label?: string;
}) {
  const { t } = useI18n();
  // The trigger shows only the outcome for closed items ("Rejected"), which
  // fits narrow kanban cards; the open list shows the full "Closed · Rejected".
  const items = Object.fromEntries(
    statusChoices.map((c) => [
      c.key,
      c.outcome ? t.outcome[c.outcome] : t.status[c.status],
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
      <SelectTrigger
        size={size}
        aria-label={label ?? t.applications.status}
        className={cn(className)}
      >
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
            {statusText(t, choice.status, choice.outcome)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
