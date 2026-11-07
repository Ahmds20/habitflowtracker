"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { ApiError, apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// Creates a private demo account with sample data, then opens the dashboard.
export function DemoButton({ className }: { className?: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    try {
      await apiFetch("/auth/demo", {
        method: "POST",
        body: JSON.stringify({
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? t.landing.demoRateLimited
          : t.landing.demoFailed,
      );
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        onClick={start}
        disabled={pending}
        className={cn("h-11 px-5 text-base", className)}
      >
        {pending ? t.landing.preparingDemo : t.landing.tryDemo}
      </Button>
      {error && (
        <p role="alert" className="text-destructive max-w-xs text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
