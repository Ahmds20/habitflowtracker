"use client";

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
import { useI18n, useServerMessage } from "@/i18n/client";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { ApiError, apiFetch } from "@/lib/api-client";
import {
  DEFAULT_WEEKLY_TARGET,
  starterHabits,
  type StarterHabitKey,
} from "@/modules/onboarding/onboarding.schema";

const starterKeys = Object.keys(starterHabits) as StarterHabitKey[];

function scheduleText(t: Dictionary, key: StarterHabitKey) {
  const { schedule } = starterHabits[key];
  return schedule.scheduleType === "days"
    ? t.habits.schedule.weekdays
    : t.habits.schedule.perWeek(schedule.targetPerWeek);
}

export function OnboardingForm() {
  const router = useRouter();
  const { t } = useI18n();
  const translate = useServerMessage();
  const o = t.onboarding;
  const [picked, setPicked] = useState<StarterHabitKey[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(key: StarterHabitKey) {
    setPicked((current) =>
      current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key],
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const raw = new FormData(event.currentTarget).get("weeklyTarget");
    const weeklyTarget = Number(raw);
    if (
      !Number.isInteger(weeklyTarget) ||
      weeklyTarget < 1 ||
      weeklyTarget > 50
    ) {
      setError(o.targetInvalid);
      return;
    }

    setPending(true);
    try {
      await apiFetch("/onboarding", {
        method: "POST",
        body: JSON.stringify({ weeklyTarget, starterHabits: picked }),
      });
    } catch (err) {
      // Already onboarded (double submit, another tab): just continue.
      if (!(err instanceof ApiError && err.status === 409)) {
        setError(
          err instanceof ApiError
            ? translate(err.message)
            : t.common.noConnection,
        );
        setPending(false);
        return;
      }
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md rounded-2xl shadow-xl shadow-emerald-900/5">
      <CardHeader>
        <CardTitle className="text-xl">{o.title}</CardTitle>
        <CardDescription>{o.description}</CardDescription>
      </CardHeader>
      <form method="post" onSubmit={onSubmit} noValidate>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="weeklyTarget">{o.target}</Label>
            <Input
              id="weeklyTarget"
              name="weeklyTarget"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              defaultValue={DEFAULT_WEEKLY_TARGET}
              className="w-28"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "onboarding-error" : "target-hint"}
            />
            <p id="target-hint" className="text-muted-foreground text-xs">
              {o.targetHint}
            </p>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">
              {o.startersLegend}{" "}
              <span className="text-muted-foreground font-normal">
                ({t.common.optional})
              </span>
            </legend>
            {starterKeys.map((key) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50/70 dark:has-[:checked]:border-emerald-800 dark:has-[:checked]:bg-emerald-950/30"
              >
                <input
                  type="checkbox"
                  checked={picked.includes(key)}
                  onChange={() => toggle(key)}
                  className="size-4 accent-emerald-600"
                />
                <span className="flex-1 font-medium">{o.starters[key]}</span>
                <span className="text-muted-foreground text-xs">
                  {scheduleText(t, key)}
                </span>
              </label>
            ))}
          </fieldset>

          {error && (
            <p
              id="onboarding-error"
              role="alert"
              className="text-destructive text-sm"
            >
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-6 border-t pt-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? o.pending : o.submit}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
