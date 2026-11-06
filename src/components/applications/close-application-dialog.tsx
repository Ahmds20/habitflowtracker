"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  applicationOutcomes,
  type ApplicationOutcome,
} from "@/modules/applications/applications.schema";
import { outcomeLabels } from "@/modules/applications/labels";
import type { ApplicationSummary } from "@/modules/applications/types";

// Shown when a card is dropped on "Closed": closing requires an outcome.
export function CloseApplicationDialog({
  app,
  onPick,
  onCancel,
}: {
  app: ApplicationSummary | null;
  onPick: (app: ApplicationSummary, outcome: ApplicationOutcome) => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={app !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How did it end?</DialogTitle>
          <DialogDescription>
            {app ? `Close ${app.company} · ${app.position}.` : null}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {applicationOutcomes.map((outcome) => (
            <Button
              key={outcome}
              variant="outline"
              onClick={() => app && onPick(app, outcome)}
            >
              {outcomeLabels[outcome]}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
