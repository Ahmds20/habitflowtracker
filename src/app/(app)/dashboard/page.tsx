import type { Metadata } from "next";
import { TranslatedHeader } from "@/components/app/translated-header";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Dashboard · HabitFlow" };

export default function Page() {
  return (
    <>
      <TranslatedHeader section="dashboard" />
      <DashboardView />
    </>
  );
}
