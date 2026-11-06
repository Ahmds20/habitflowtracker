import type { Metadata } from "next";
import { LogoutButton } from "@/components/app/logout-button";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Settings · HabitFlow" };

// Profile, timezone, and password forms arrive in M6. Logout is here for mobile users.
export default function Page() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Profile and password settings are coming in M6."
      />
      <LogoutButton className="md:hidden" />
    </>
  );
}
