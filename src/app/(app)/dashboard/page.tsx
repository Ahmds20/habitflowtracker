import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Dashboard · HabitFlow" };

// Placeholder until milestone M4.
export default function Page() {
  return (
    <PageHeader
      title="Dashboard"
      description="Your habits, applications, and interviews at a glance. Coming in M4."
    />
  );
}
