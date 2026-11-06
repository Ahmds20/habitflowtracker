import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { RedirectIfLoggedIn } from "@/components/auth/redirect-if-logged-in";

export const metadata: Metadata = { title: "Log in · HabitFlow" };

export default function Page() {
  return (
    <>
      <Suspense>
        <RedirectIfLoggedIn />
      </Suspense>
      <AuthForm mode="login" />
    </>
  );
}
