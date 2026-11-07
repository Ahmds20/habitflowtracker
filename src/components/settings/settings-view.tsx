"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LogoutButton } from "@/components/app/logout-button";
import { PageHeader } from "@/components/app/page-header";
import { Field } from "@/components/applications/interview-dialog";
import { useErrorMessage } from "@/components/applications/use-applications";
import {
  LanguageControl,
  ThemeControl,
} from "@/components/theme/preference-controls";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n, useServerMessage } from "@/i18n/client";
import { ApiError } from "@/lib/api-client";
import {
  type Me,
  useChangePassword,
  useDeleteAccount,
  useMe,
  useUpdateProfile,
} from "./use-account";

type FieldErrors = Record<string, string[] | undefined>;

// Turns API field errors into messages in the current language.
function useFieldErrors() {
  const translate = useServerMessage();
  return (error: unknown): FieldErrors | null =>
    error instanceof ApiError && error.details
      ? Object.fromEntries(
          Object.entries(error.details).map(([field, messages]) => [
            field,
            messages?.map(translate),
          ]),
        )
      : null;
}

export function SettingsView() {
  const { t } = useI18n();
  const { data: me, isPending, isError, refetch } = useMe();

  return (
    <>
      <PageHeader
        title={t.settings.title}
        description={t.settings.description}
      />
      <div className="flex max-w-2xl flex-col gap-6">
        <Appearance />
        {isPending ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : isError ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm">{t.common.somethingWrong}</p>
            <Button variant="outline" onClick={() => refetch()}>
              {t.common.tryAgain}
            </Button>
          </div>
        ) : (
          <>
            <ProfileForm key={me.name + me.timezone} me={me} />
            <PasswordForm me={me} />
            <DangerZone me={me} />
          </>
        )}
        {/* Logout lives in the sidebar on desktop; this one is for mobile. */}
        <LogoutButton className="self-start md:hidden" />
      </div>
    </>
  );
}

function Section({
  title,
  children,
  tone = "default",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <section
      className={
        tone === "danger"
          ? "flex flex-col gap-4 rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/20"
          : "bg-card flex flex-col gap-4 rounded-2xl border p-5 shadow-sm"
      }
    >
      <h2 className="font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Appearance() {
  const { t } = useI18n();
  return (
    <Section title={t.settings.appearance}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium">{t.preferences.theme}</span>
        <ThemeControl />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium">{t.preferences.language}</span>
        <LanguageControl />
      </div>
    </Section>
  );
}

function ProfileForm({ me }: { me: Me }) {
  const { t } = useI18n();
  const p = t.settings.profile;
  const update = useUpdateProfile();
  const errorMessage = useErrorMessage();
  const fieldErrors = useFieldErrors();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [timezone, setTimezone] = useState(me.timezone);
  // Read once on mount: the device timezone, offered as a one-click fix.
  const [deviceZone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const zones = useMemo(() => {
    const all = Intl.supportedValuesOf("timeZone");
    return all.includes(me.timezone) ? all : [me.timezone, ...all];
  }, [me.timezone]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const name = String(new FormData(event.currentTarget).get("name") ?? "");
    try {
      await update.mutateAsync({ name, timezone });
      toast.success(p.saved);
    } catch (error) {
      const details = fieldErrors(error);
      if (details) setErrors(details);
      else toast.error(errorMessage(error));
    }
  }

  return (
    <Section title={p.title}>
      <form
        method="post"
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={p.name} htmlFor="profile-name" errors={errors.name}>
            <Input
              id="profile-name"
              name="name"
              autoComplete="name"
              defaultValue={me.name}
              aria-invalid={errors.name ? true : undefined}
            />
          </Field>
          <Field label={p.email} htmlFor="profile-email" hint={p.emailHint}>
            <Input id="profile-email" value={me.email} readOnly disabled />
          </Field>
        </div>
        <Field
          label={p.timezone}
          htmlFor="profile-timezone"
          hint={p.timezoneHint}
          errors={errors.timezone}
        >
          {/* A native select: long, searchable by typing, and accessible. */}
          <select
            id="profile-timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3"
          >
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        {deviceZone !== timezone && (
          <button
            type="button"
            onClick={() => setTimezone(deviceZone)}
            className="text-primary self-start text-xs font-semibold underline underline-offset-4"
          >
            {p.useBrowser(deviceZone)}
          </button>
        )}
        <Button type="submit" className="self-end" disabled={update.isPending}>
          {update.isPending ? t.common.saving : t.common.saveChanges}
        </Button>
      </form>
    </Section>
  );
}

function PasswordForm({ me }: { me: Me }) {
  const { t } = useI18n();
  const pw = t.settings.password;
  const change = useChangePassword();
  const errorMessage = useErrorMessage();
  const fieldErrors = useFieldErrors();
  const [errors, setErrors] = useState<FieldErrors>({});

  if (me.isDemo) {
    return (
      <Section title={pw.title}>
        <p className="text-muted-foreground text-sm">{pw.demoNote}</p>
      </Section>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await change.mutateAsync({
        currentPassword: String(data.get("currentPassword") ?? ""),
        newPassword: String(data.get("newPassword") ?? ""),
      });
      form.reset();
      toast.success(pw.changed);
    } catch (error) {
      const details = fieldErrors(error);
      if (details) setErrors(details);
      else toast.error(errorMessage(error));
    }
  }

  return (
    <Section title={pw.title}>
      <form
        method="post"
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        {/* Lets password managers attach the new password to this account. */}
        <input
          type="email"
          name="username"
          autoComplete="username"
          value={me.email}
          readOnly
          hidden
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={pw.current}
            htmlFor="current-password"
            errors={errors.currentPassword}
          >
            <Input
              id="current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.currentPassword ? true : undefined}
            />
          </Field>
          <Field
            label={pw.next}
            htmlFor="new-password"
            hint={pw.hint}
            errors={errors.newPassword}
          >
            <Input
              id="new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.newPassword ? true : undefined}
            />
          </Field>
        </div>
        <Button
          type="submit"
          variant="outline"
          className="self-end"
          disabled={change.isPending}
        >
          {change.isPending ? t.common.saving : pw.submit}
        </Button>
      </form>
    </Section>
  );
}

function DangerZone({ me }: { me: Me }) {
  const { t } = useI18n();
  const d = t.settings.danger;
  const router = useRouter();
  const remove = useDeleteAccount();
  const errorMessage = useErrorMessage();
  const fieldErrors = useFieldErrors();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const password = me.isDemo
      ? undefined
      : String(new FormData(event.currentTarget).get("password") ?? "");
    try {
      await remove.mutateAsync(password);
      toast.success(d.deleted);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(fieldErrors(err)?.password?.[0] ?? errorMessage(err));
    }
  }

  return (
    <Section title={d.title} tone="danger">
      <p className="text-muted-foreground text-sm">{d.body}</p>
      <Button
        variant="destructive"
        className="self-start"
        onClick={() => setOpen(true)}
      >
        {d.button}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{d.confirmTitle}</DialogTitle>
            <DialogDescription>
              {me.isDemo ? d.confirmDemo : d.confirmBody}
            </DialogDescription>
          </DialogHeader>
          <form
            id="delete-account"
            method="post"
            onSubmit={onSubmit}
            noValidate
            className="flex flex-col gap-2"
          >
            {!me.isDemo && (
              <Field label={d.confirmPassword} htmlFor="delete-password">
                <Input
                  id="delete-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  aria-invalid={error ? true : undefined}
                />
              </Field>
            )}
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              form="delete-account"
              variant="destructive"
              disabled={remove.isPending}
            >
              {remove.isPending ? d.deleting : d.button}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
