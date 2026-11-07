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
import { ApiError, apiFetch } from "@/lib/api-client";
import {
  DEFAULT_WEEKLY_TARGET,
  starterHabits,
  type StarterHabitKey,
} from "@/modules/onboarding/onboarding.schema";

const starterKeys = Object.keys(starterHabits) as StarterHabitKey[];

function scheduleText(key: StarterHabitKey) {
  const { schedule } = starterHabits[key];
  return schedule.scheduleType === "days"
    ? "Weekdays"
    : `${schedule.targetPerWeek}× per week`;
}

export function OnboardingForm() {
  const router = useRouter();
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
      setError("Enter a whole number from 1 to 50.");
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
          err instanceof ApiError ? err.message : "Could not reach the server.",
        );
        setPending(false);
        return;
      }
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Set your weekly goal</CardTitle>
        <CardDescription>
          Consistency beats bursts. How many applications do you want to send
          each week? It updates automatically as you add them.
        </CardDescription>
      </CardHeader>
      <form method="post" onSubmit={onSubmit} noValidate>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="weeklyTarget">Applications per week</Label>
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
              You can change this later on the Habits page.
            </p>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">
              Add a few habits to support your job hunt{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </legend>
            {starterKeys.map((key) => (
              <label
                key={key}
                className="has-[:checked]:border-foreground/40 has-[:checked]:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors"
              >
                <input
                  type="checkbox"
                  checked={picked.includes(key)}
                  onChange={() => toggle(key)}
                  className="size-4 accent-current"
                />
                <span className="flex-1">{starterHabits[key].name}</span>
                <span className="text-muted-foreground text-xs">
                  {scheduleText(key)}
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
            {pending ? "Setting up…" : "Start tracking"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
