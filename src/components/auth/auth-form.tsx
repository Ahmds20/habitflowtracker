"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiFetch, safeNextPath } from "@/lib/api-client";

type Mode = "login" | "register";
type FieldErrors = Record<string, string[] | undefined>;

const copy = {
  login: {
    title: "Welcome back",
    description: "Log in to keep your job hunt on track.",
    submit: "Log in",
    pending: "Logging in…",
    switchText: "No account yet?",
    switchLink: "Create one",
    switchHref: "/register",
  },
  register: {
    title: "Create your account",
    description:
      "Track applications and stay consistent until you land the job.",
    submit: "Create account",
    pending: "Creating account…",
    switchText: "Already have an account?",
    switchLink: "Log in",
    switchHref: "/login",
  },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const text = copy[mode];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const body =
      mode === "register"
        ? {
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
            // The browser knows the user's timezone; it can be changed later in Settings.
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }
        : { email: form.get("email"), password: form.get("password") };

    try {
      await apiFetch(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      // New accounts set their weekly goal first. The app layout also
      // redirects there, so this only saves one round trip.
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(mode === "register" ? "/onboarding" : safeNextPath(next));
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.details ? null : error.message);
        setFieldErrors(error.details ?? {});
      } else {
        setFormError("Could not reach the server. Check your connection.");
      }
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      {/* method="post": if the form is submitted before React loads, the
          browser must not put the password in the URL (GET is the default). */}
      <form method="post" onSubmit={onSubmit} noValidate>
        <CardContent className="flex flex-col gap-4">
          {mode === "register" && (
            <Field
              label="Name"
              name="name"
              autoComplete="name"
              errors={fieldErrors.name}
            />
          )}
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            errors={fieldErrors.email}
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            hint={mode === "register" ? "At least 8 characters." : undefined}
            errors={fieldErrors.password}
          />
          {formError && (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-4 flex flex-col gap-3 border-t pt-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? text.pending : text.submit}
          </Button>
          <p className="text-muted-foreground text-sm">
            {text.switchText}{" "}
            <Link
              href={text.switchHref}
              className="text-foreground underline underline-offset-4"
            >
              {text.switchLink}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  hint,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
  errors?: string[];
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = [errors?.length ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {hint && !errors?.length && (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}
      {errors?.length ? (
        <p id={errorId} className="text-destructive text-xs">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}
