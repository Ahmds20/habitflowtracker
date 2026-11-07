import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { requireUserOrRedirect } from "@/components/app/current-user";
import { Providers } from "@/components/providers";
import { isOnboarded } from "@/modules/onboarding/onboarding.service";

export const metadata: Metadata = { title: "Get started · HabitFlow" };

export default function Page() {
  return (
    <>
      <Suspense>
        <OnboardingGuard />
      </Suspense>
      <Providers>
        <OnboardingForm />
      </Providers>
    </>
  );
}

// Logged-out visitors go to /login; users who already onboarded go to the dashboard.
async function OnboardingGuard() {
  const user = await requireUserOrRedirect();
  if (await isOnboarded(user.id)) redirect("/dashboard");
  return null;
}
