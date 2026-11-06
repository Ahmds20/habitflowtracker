import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Interviews · HabitFlow" };

// Placeholder until milestone M2.
export default function Page() {
  return (
    <PageHeader
      title="Interviews"
      description="Upcoming and past interviews. Coming in M2."
    />
  );
}
