import type { Metadata } from "next";
import { InterviewsView } from "@/components/applications/interviews-view";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Interviews · HabitFlow" };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Interviews"
        description="All interviews across your applications."
      />
      <InterviewsView />
    </>
  );
}
