"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-client";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "@/lib/datetime";
import type { Interview } from "@/modules/applications/types";
import {
  interviewTypes,
  type InterviewType,
} from "@/modules/interviews/interviews.schema";
import { useSaveInterview } from "./use-interviews";

export const interviewTypeLabels: Record<InterviewType, string> = {
  phone: "Phone",
  video: "Video",
  onsite: "On-site",
};

// Create (interview = null) or edit an interview.
export function InterviewDialog({
  applicationId,
  interview,
  open,
  onOpenChange,
}: {
  applicationId: string;
  interview: Interview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const save = useSaveInterview(applicationId);
  const [type, setType] = useState<InterviewType>(interview?.type ?? "video");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {},
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const form = new FormData(event.currentTarget);
    const when = String(form.get("scheduledAt") ?? "");
    if (!when) {
      setErrors({ scheduledAt: ["Pick a date and time"] });
      return;
    }
    try {
      await save.mutateAsync({
        id: interview?.id,
        body: {
          scheduledAt: fromDateTimeLocalValue(when),
          type,
          title: form.get("title"),
          meetingUrl: form.get("meetingUrl"),
          notes: form.get("notes"),
        },
      });
      toast.success(interview ? "Interview updated" : "Interview scheduled");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.details) setErrors(error.details);
      else
        toast.error(
          error instanceof ApiError ? error.message : "Could not save",
        );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {interview ? "Edit interview" : "Schedule interview"}
          </DialogTitle>
        </DialogHeader>
        {/* key resets the uncontrolled inputs when switching interviews */}
        <form
          key={interview?.id ?? "new"}
          id="interview-form"
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Date and time"
              htmlFor="iv-when"
              errors={errors.scheduledAt}
            >
              <Input
                id="iv-when"
                name="scheduledAt"
                type="datetime-local"
                defaultValue={
                  interview ? toDateTimeLocalValue(interview.scheduledAt) : ""
                }
                aria-invalid={errors.scheduledAt ? true : undefined}
              />
            </Field>
            <Field label="Type" htmlFor="iv-type">
              <Select
                items={interviewTypeLabels}
                value={type}
                onValueChange={(value) =>
                  value && setType(value as InterviewType)
                }
              >
                <SelectTrigger id="iv-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interviewTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {interviewTypeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field
            label="Title"
            htmlFor="iv-title"
            hint="For example: HR screening, Technical round"
          >
            <Input
              id="iv-title"
              name="title"
              defaultValue={interview?.title ?? ""}
            />
          </Field>
          <Field
            label="Meeting link"
            htmlFor="iv-url"
            errors={errors.meetingUrl}
          >
            <Input
              id="iv-url"
              name="meetingUrl"
              type="url"
              placeholder="https://"
              defaultValue={interview?.meetingUrl ?? ""}
              aria-invalid={errors.meetingUrl ? true : undefined}
            />
          </Field>
          <Field label="Preparation notes" htmlFor="iv-notes">
            <Textarea
              id="iv-notes"
              name="notes"
              rows={4}
              defaultValue={interview?.notes ?? ""}
            />
          </Field>
        </form>
        <DialogFooter>
          <Button type="submit" form="interview-form" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  errors,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {errors?.length ? (
        <p className="text-destructive text-xs" role="alert">
          {errors[0]}
        </p>
      ) : (
        hint && <p className="text-muted-foreground text-xs">{hint}</p>
      )}
    </div>
  );
}
