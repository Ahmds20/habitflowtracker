import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Habits · HabitFlow" };

// Placeholder until milestone M3.
export default function Page() {
  return (
    <PageHeader
      title="Habits"
      description="Build habits that support your job hunt. Coming in M3."
    />
  );
}
