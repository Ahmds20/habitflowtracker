import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Applications · HabitFlow" };

// Placeholder until milestone M2.
export default function Page() {
  return (
    <PageHeader
      title="Applications"
      description="Track every application on a kanban board. Coming in M2."
    />
  );
}
