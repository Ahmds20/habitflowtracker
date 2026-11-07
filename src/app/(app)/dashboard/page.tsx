import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Dashboard · HabitFlow" };

export default function Page() {
  return (
    <>
      <PageHeader title="Dashboard" description="Your job hunt at a glance." />
      <DashboardView />
    </>
  );
}
