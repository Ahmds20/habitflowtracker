"use client";

import { PlusIcon } from "lucide-react";
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
  DialogTrigger,
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
import { useI18n, useServerMessage } from "@/i18n/client";
import { ApiError } from "@/lib/api-client";
import { useCreateApplication } from "./use-applications";

const startStatuses = [
  "wishlist",
  "applied",
  "assessment",
  "interview",
  "offer",
] as const;

// Quick add: only the essentials. Everything else is filled in on the detail page.
export function AddApplicationDialog({
  variant = "default",
}: {
  variant?: "default" | "outline";
}) {
  const { t } = useI18n();
  const translate = useServerMessage();
  const [open, setOpen] = useState(false);
  const [status, setStatus] =
    useState<(typeof startStatuses)[number]>("applied");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {},
  );
  const create = useCreateApplication();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const form = new FormData(event.currentTarget);
    const appliedDate = String(form.get("appliedDate") ?? "");
    try {
      const app = await create.mutateAsync({
        company: form.get("company"),
        position: form.get("position"),
        status,
        // Empty means "today" (the server fills it in) or none for wishlist.
        ...(appliedDate && status !== "wishlist" && { appliedDate }),
      });
      toast.success(t.applications.added(app.company));
      setOpen(false);
      setStatus("applied");
    } catch (error) {
      if (error instanceof ApiError && error.details) setErrors(error.details);
      else
        toast.error(
          error instanceof ApiError
            ? translate(error.message)
            : t.applications.couldNotAdd,
        );
    }
  }

  const fieldError = (name: string) => {
    const message = errors[name]?.[0];
    return message ? translate(message) : undefined;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={variant} />}>
        <PlusIcon aria-hidden />
        {t.applications.add}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.applications.add}</DialogTitle>
          <DialogDescription>{t.applications.addDescription}</DialogDescription>
        </DialogHeader>
        <form
          id="add-application"
          method="post"
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <TextField
            name="company"
            label={t.applications.company}
            autoFocus
            error={fieldError("company")}
          />
          <TextField
            name="position"
            label={t.applications.position}
            error={fieldError("position")}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-status">{t.applications.status}</Label>
              <Select
                items={Object.fromEntries(
                  startStatuses.map((s) => [s, t.status[s]]),
                )}
                value={status}
                onValueChange={(value) =>
                  value && setStatus(value as typeof status)
                }
              >
                <SelectTrigger id="add-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {startStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t.status[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {status !== "wishlist" && (
              <TextField
                name="appliedDate"
                label={t.applications.appliedOn}
                type="date"
                hint={t.applications.appliedHint}
                error={fieldError("appliedDate")}
              />
            )}
          </div>
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="add-application"
            disabled={create.isPending}
          >
            {create.isPending ? t.common.adding : t.common.add}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TextField({
  name,
  label,
  type = "text",
  hint,
  autoFocus,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  hint?: string;
  autoFocus?: boolean;
  error?: string;
}) {
  const id = `add-${name}`;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-xs">
          {error}
        </p>
      ) : (
        hint && <p className="text-muted-foreground text-xs">{hint}</p>
      )}
    </div>
  );
}
