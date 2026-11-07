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
import { useI18n, useServerMessage } from "@/i18n/client";
import { ApiError } from "@/lib/api-client";
import { formatDateTime } from "@/lib/datetime";
import {
  employmentTypes,
  type EmploymentType,
} from "@/modules/applications/applications.schema";
import {
  formatLocalDate,
  statusBadgeClass,
  statusDotClass,
  statusText,
} from "@/modules/applications/labels";
import type {
  ApplicationDetail as Detail,
  Interview,
} from "@/modules/applications/types";
import { cn } from "@/lib/utils";
import { CloseApplicationDialog } from "./close-application-dialog";
import { Field, InterviewDialog } from "./interview-dialog";
import { StatusSelect } from "./status-select";
import {
  useApplication,
  useChangeStatus,
  useDeleteApplication,
  useErrorMessage,
  useUpdateApplication,
} from "./use-applications";
import { useDeleteInterview } from "./use-interviews";

export function ApplicationDetailView({ id }: { id: string }) {
  const { data: app, isPending, error, refetch } = useApplication(id);
  const { t } = useI18n();

  if (isPending) return <DetailSkeleton />;
  if (error) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <div className="flex flex-col items-start gap-3">
        <BackLink />
        <p className="text-sm">
          {missing
            ? t.applications.detail.missing
            : t.applications.detail.loadFailed}
        </p>
        {!missing && (
          <Button variant="outline" onClick={() => refetch()}>
            {t.common.tryAgain}
          </Button>
        )}
      </div>
    );
  }
  return <Loaded app={app} />;
}

function Loaded({ app }: { app: Detail }) {
  const { t } = useI18n();
  const changeStatus = useChangeStatus();
  const [closing, setClosing] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <BackLink />
      <header className="bg-card flex flex-wrap items-start justify-between gap-4 rounded-2xl border p-5 shadow-sm">
        <div className="min-w-0">
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              statusBadgeClass[app.status],
            )}
          >
            {statusText(t, app.status, app.outcome)}
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight break-words">
            {app.position}
          </h1>
          <p className="text-muted-foreground font-medium">
            {app.company}
            {app.location && ` · ${app.location}`}
          </p>
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
  const { t } = useI18n();
  return (
    <Link
      href="/applications"
      className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
    >
      <ArrowLeftIcon className="size-4" aria-hidden />
      {t.applications.detail.back}
    </Link>
  );
}

function DetailsForm({ app }: { app: Detail }) {
  const { t } = useI18n();
  const translate = useServerMessage();
  const errorMessage = useErrorMessage();
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
      toast.success(t.common.saved);
    } catch (error) {
      if (error instanceof ApiError && error.details) {
        setErrors(
          Object.fromEntries(
            Object.entries(error.details).map(([field, messages]) => [
              field,
              messages?.map(translate),
            ]),
          ),
        );
      } else toast.error(errorMessage(error));
    }
  }

  const d = t.applications.detail;

  return (
    <form
      method="post"
      onSubmit={onSubmit}
      noValidate
      className="bg-card flex flex-col gap-4 rounded-2xl border p-5 shadow-sm"
      // Re-mount after a save so the inputs show the saved (normalized) values.
      key={app.updatedAt}
    >
      <h2 className="font-bold">{d.details}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Text
          name="company"
          label={t.applications.company}
          app={app}
          errors={errors}
        />
        <Text
          name="position"
          label={t.applications.position}
          app={app}
          errors={errors}
        />
        <Text
          name="appliedDate"
          label={t.applications.appliedOn}
          type="date"
          app={app}
          errors={errors}
          hint={app.status === "wishlist" ? d.notApplied : undefined}
        />
        <Text
          name="followUpDate"
          label={d.followUpOn}
          type="date"
          app={app}
          errors={errors}
          hint={d.followUpHint}
        />
        <Text name="location" label={d.location} app={app} errors={errors} />
        <Field label={d.employmentType} htmlFor="employmentType">
          <Select
            items={{ "": t.common.notSet, ...t.employmentType }}
            value={employmentType}
            onValueChange={(value) =>
              setEmploymentType((value ?? "") as EmploymentType | "")
            }
          >
            <SelectTrigger id="employmentType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t.common.notSet}</SelectItem>
              {employmentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {t.employmentType[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Text
          name="salaryExpectation"
          label={d.salary}
          app={app}
          errors={errors}
        />
        <Text
          name="jobUrl"
          label={d.jobUrl}
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
                {d.open} <ExternalLinkIcon className="size-3" aria-hidden />
              </a>
            ) : null
          }
        />
      </div>
      <Field label={d.jobDescription} htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={app.description ?? ""}
        />
      </Field>
      <Field label={d.notes} htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={app.notes ?? ""}
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? t.common.saving : t.common.saveChanges}
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
  const { t, intl } = useI18n();
  const errorMessage = useErrorMessage();
  const iv = t.interviews;
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
    <section className="bg-card flex flex-col gap-3 rounded-2xl border p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{iv.section}</h2>
        <Button size="sm" variant="outline" onClick={() => openDialog(null)}>
          <PlusIcon aria-hidden />
          {iv.schedule}
        </Button>
      </div>
      {app.interviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">{iv.none}</p>
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
                      {interview.title || iv.typed(iv.types[interview.type])}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(interview.scheduledAt, intl)} ·{" "}
                      {iv.types[interview.type]}
                    </p>
                  </div>
                  <div className="flex shrink-0">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={iv.editLabel}
                      onClick={() => openDialog(interview)}
                    >
                      <PencilIcon aria-hidden />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={iv.deleteLabel}
                      onClick={() =>
                        remove.mutate(interview.id, {
                          onSuccess: () => toast.success(iv.deleted),
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
                    {iv.joinMeeting}
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
  const { t, intl } = useI18n();
  const d = t.applications.detail;
  // Newest first.
  const events = [...app.statusHistory].reverse();
  return (
    <section className="bg-card flex flex-col gap-3 rounded-2xl border p-5 shadow-sm">
      <h2 className="font-bold">{d.history}</h2>
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
                {event.fromStatus === null ? d.addedTo : d.movedTo}
                <span className="font-semibold">
                  {statusText(t, event.toStatus, event.outcome)}
                </span>
              </p>
              <p className="text-muted-foreground text-xs">
                {formatDateTime(event.changedAt, intl)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {app.appliedDate && (
        <p className="text-muted-foreground border-t pt-3 text-xs">
          {d.appliedOn(formatLocalDate(app.appliedDate, intl))}
        </p>
      )}
    </section>
  );
}

function DeleteButton({ app }: { app: Detail }) {
  const { t } = useI18n();
  const errorMessage = useErrorMessage();
  const d = t.applications.detail;
  const [open, setOpen] = useState(false);
  const remove = useDeleteApplication();
  const router = useRouter();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={d.deleteLabel}
        onClick={() => setOpen(true)}
      >
        <Trash2Icon aria-hidden />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{d.deleteTitle}</DialogTitle>
            <DialogDescription>
              {d.deleteBody(app.company, app.position)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(app.id, {
                  onSuccess: () => {
                    toast.success(d.deleted(app.company));
                    router.push("/applications");
                  },
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            >
              {remove.isPending ? t.common.deleting : t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailSkeleton() {
  const { t } = useI18n();
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label={t.common.loading}
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-96" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
