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
import { ApiError } from "@/lib/api-client";
import { statusLabels } from "@/modules/applications/labels";
import { useCreateApplication } from "./use-applications";

const startStatuses = [
  "wishlist",
  "applied",
  "assessment",
  "interview",
  "offer",
] as const;

// Quick add: only the essentials. Everything else is filled in on the detail page.
export function AddApplicationDialog() {
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
      toast.success(`Added ${app.company}`);
      setOpen(false);
      setStatus("applied");
    } catch (error) {
      if (error instanceof ApiError && error.details) setErrors(error.details);
      else
        toast.error(
          error instanceof ApiError ? error.message : "Could not add",
        );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon aria-hidden />
        Add application
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add application</DialogTitle>
          <DialogDescription>
            Add the basics now. You can fill in the rest later.
          </DialogDescription>
        </DialogHeader>
        <form
          id="add-application"
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <TextField
            name="company"
            label="Company"
            autoFocus
            errors={errors.company}
          />
          <TextField
            name="position"
            label="Position"
            errors={errors.position}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-status">Status</Label>
              <Select
                items={Object.fromEntries(
                  startStatuses.map((s) => [s, statusLabels[s]]),
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
                      {statusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {status !== "wishlist" && (
              <TextField
                name="appliedDate"
                label="Applied on"
                type="date"
                hint="Leave empty for today"
                errors={errors.appliedDate}
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
            {create.isPending ? "Adding…" : "Add"}
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
  errors,
}: {
  name: string;
  label: string;
  type?: string;
  hint?: string;
  autoFocus?: boolean;
  errors?: string[];
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
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errors?.length ? `${id}-error` : undefined}
      />
      {errors?.length ? (
        <p id={`${id}-error`} className="text-destructive text-xs">
          {errors[0]}
        </p>
      ) : (
        hint && <p className="text-muted-foreground text-xs">{hint}</p>
      )}
    </div>
  );
}
