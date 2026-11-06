"use client";

import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-client";
import { formatDateTime } from "@/lib/datetime";
import {
  employmentTypes,
  type EmploymentType,
} from "@/modules/applications/applications.schema";
import {
  employmentTypeLabels,
  formatLocalDate,
  outcomeLabels,
  statusDotClass,
  statusLabels,
} from "@/modules/applications/labels";
import type {
  ApplicationDetail as Detail,
  Interview,
} from "@/modules/applications/types";
import { cn } from "@/lib/utils";
import { CloseApplicationDialog } from "./close-application-dialog";
import {
  Field,
  InterviewDialog,
  interviewTypeLabels,
} from "./interview-dialog";
import { StatusSelect } from "./status-select";
import {
  errorMessage,
  useApplication,
  useChangeStatus,
  useDeleteApplication,
  useUpdateApplication,
} from "./use-applications";
import { useDeleteInterview } from "./use-interviews";

export function ApplicationDetailView({ id }: { id: string }) {
  const { data: app, isPending, error, refetch } = useApplication(id);

  if (isPending) return <DetailSkeleton />;
  if (error) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <div className="flex flex-col items-start gap-3">
        <BackLink />
        <p className="text-sm">
          {missing
            ? "This application does not exist or was deleted."
            : "Could not load this application."}
        </p>
        {!missing && (
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        )}
      </div>
    );
  }
  return <Loaded app={app} />;
}

function Loaded({ app }: { app: Detail }) {
  const changeStatus = useChangeStatus();
  const [closing, setClosing] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <BackLink />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight break-words">
            {app.company}
          </h1>
          <p className="text-muted-foreground">{app.position}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusSelect
            status={app.status}
            outcome={app.outcome}
            size="default"
            className="w-44"
            onChange={(status, outcome) =>
              status === "closed" && !outcome
                ? setClosing(true)
                : changeStatus(app, status, outcome)
            }
          />
          <DeleteButton app={app} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <DetailsForm app={app} />
        <aside className="flex flex-col gap-6">
          <Interviews app={app} />
          <Timeline app={app} />
        </aside>
      </div>

      <CloseApplicationDialog
        app={closing ? app : null}
        onCancel={() => setClosing(false)}
        onPick={(_app, outcome) => {
          setClosing(false);
          changeStatus(app, "closed", outcome);
        }}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/applications"
      className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
    >
      <ArrowLeftIcon className="size-4" aria-hidden />
      Applications
    </Link>
  );
}

function DetailsForm({ app }: { app: Detail }) {
  const update = useUpdateApplication(app.id);
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">(
    app.employmentType ?? "",
  );
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {},
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");
    const date = (name: string) => text(name) || null;
    try {
      await update.mutateAsync({
        company: text("company"),
        position: text("position"),
        appliedDate: date("appliedDate"),
        followUpDate: date("followUpDate"),
        jobUrl: text("jobUrl"),
        location: text("location"),
        employmentType: employmentType || null,
        salaryExpectation: text("salaryExpectation"),
        description: text("description"),
        notes: text("notes"),
      });
      toast.success("Saved");
    } catch (error) {
      if (error instanceof ApiError && error.details) setErrors(error.details);
      else toast.error(errorMessage(error));
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-xl border p-4"
      // Re-mount after a save so the inputs show the saved (normalized) values.
      key={app.updatedAt}
    >
      <h2 className="font-medium">Details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Text name="company" label="Company" app={app} errors={errors} />
        <Text name="position" label="Position" app={app} errors={errors} />
        <Text
          name="appliedDate"
          label="Applied on"
          type="date"
          app={app}
          errors={errors}
          hint={app.status === "wishlist" ? "Not applied yet" : undefined}
        />
        <Text
          name="followUpDate"
          label="Follow up on"
          type="date"
          app={app}
          errors={errors}
          hint="Shows on your dashboard when it is due"
        />
        <Text name="location" label="Location" app={app} errors={errors} />
        <Field label="Employment type" htmlFor="employmentType">
          <Select
            items={{ "": "Not set", ...employmentTypeLabels }}
            value={employmentType}
            onValueChange={(value) =>
              setEmploymentType((value ?? "") as EmploymentType | "")
            }
          >
            <SelectTrigger id="employmentType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Not set</SelectItem>
              {employmentTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {employmentTypeLabels[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Text
          name="salaryExpectation"
          label="Salary expectation"
          app={app}
          errors={errors}
        />
        <Text
          name="jobUrl"
          label="Job posting link"
          type="url"
          app={app}
          errors={errors}
          action={
            app.jobUrl ? (
              <a
                href={app.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
              >
                Open <ExternalLinkIcon className="size-3" aria-hidden />
              </a>
            ) : null
          }
        />
      </div>
      <Field label="Job description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={app.description ?? ""}
        />
      </Field>
      <Field label="Notes" htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={app.notes ?? ""}
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

type TextName =
  | "company"
  | "position"
  | "appliedDate"
  | "followUpDate"
  | "location"
  | "salaryExpectation"
  | "jobUrl";

function Text({
  name,
  label,
  type = "text",
  app,
  errors,
  hint,
  action,
}: {
  name: TextName;
  label: string;
  type?: string;
  app: Detail;
  errors: Record<string, string[] | undefined>;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-sm font-medium">
          {label}
        </label>
        {action}
      </div>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={app[name] ?? ""}
        aria-invalid={errors[name] ? true : undefined}
      />
      {errors[name]?.length ? (
        <p className="text-destructive text-xs" role="alert">
          {errors[name]![0]}
        </p>
      ) : (
        hint && <p className="text-muted-foreground text-xs">{hint}</p>
      )}
    </div>
  );
}

function Interviews({ app }: { app: Detail }) {
  const [editing, setEditing] = useState<Interview | null>(null);
  const [open, setOpen] = useState(false);
  const remove = useDeleteInterview(app.id);
  // Captured once per mount: React render functions must not read the clock.
  const [now] = useState(() => Date.now());

  function openDialog(interview: Interview | null) {
    setEditing(interview);
    setOpen(true);
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Interviews</h2>
        <Button size="sm" variant="outline" onClick={() => openDialog(null)}>
          <PlusIcon aria-hidden />
          Schedule
        </Button>
      </div>
      {app.interviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">No interviews yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {app.interviews.map((interview) => {
            const past = new Date(interview.scheduledAt).getTime() < now;
            return (
              <li
                key={interview.id}
                className={cn(
                  "flex flex-col gap-1 text-sm",
                  past && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {interview.title ||
                        `${interviewTypeLabels[interview.type]} interview`}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(interview.scheduledAt)} ·{" "}
                      {interviewTypeLabels[interview.type]}
                    </p>
                  </div>
                  <div className="flex shrink-0">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Edit interview"
                      onClick={() => openDialog(interview)}
                    >
                      <PencilIcon aria-hidden />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Delete interview"
                      onClick={() =>
                        remove.mutate(interview.id, {
                          onSuccess: () => toast.success("Interview deleted"),
                          onError: (error) => toast.error(errorMessage(error)),
                        })
                      }
                    >
                      <Trash2Icon aria-hidden />
                    </Button>
                  </div>
                </div>
                {interview.meetingUrl && (
                  <a
                    href={interview.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-fit truncate text-xs underline underline-offset-4"
                  >
                    Join meeting
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <InterviewDialog
        key={editing?.id ?? "new"}
        applicationId={app.id}
        interview={editing}
        open={open}
        onOpenChange={setOpen}
      />
    </section>
  );
}

function Timeline({ app }: { app: Detail }) {
  // Newest first.
  const events = [...app.statusHistory].reverse();
  return (
    <section className="flex flex-col gap-3 rounded-xl border p-4">
      <h2 className="font-medium">History</h2>
      <ol className="flex flex-col gap-3">
        {events.map((event) => (
          <li key={event.id} className="flex gap-3 text-sm">
            <span
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full",
                statusDotClass[event.toStatus],
              )}
              aria-hidden
            />
            <div>
              <p>
                {event.fromStatus === null ? "Added to " : "Moved to "}
                <span className="font-medium">
                  {statusLabels[event.toStatus]}
                  {event.outcome && ` · ${outcomeLabels[event.outcome]}`}
                </span>
              </p>
              <p className="text-muted-foreground text-xs">
                {formatDateTime(event.changedAt)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {app.appliedDate && (
        <p className="text-muted-foreground border-t pt-3 text-xs">
          Applied on {formatLocalDate(app.appliedDate)}
        </p>
      )}
    </section>
  );
}

function DeleteButton({ app }: { app: Detail }) {
  const [open, setOpen] = useState(false);
  const remove = useDeleteApplication();
  const router = useRouter();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete application"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon aria-hidden />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this application?</DialogTitle>
            <DialogDescription>
              {app.company} · {app.position}, its interviews, and its history
              will be deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(app.id, {
                  onSuccess: () => {
                    toast.success(`Deleted ${app.company}`);
                    router.push("/applications");
                  },
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            >
              {remove.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-96" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
