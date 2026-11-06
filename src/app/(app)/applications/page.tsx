import type { Metadata } from "next";
import { ApplicationsView } from "@/components/applications/applications-view";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Applications · HabitFlow" };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Applications"
        description="Drag cards between columns, or change the status from each card."
      />
      <ApplicationsView />
    </>
  );
}
