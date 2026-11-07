import type { Metadata } from "next";
import { ApplicationsView } from "@/components/applications/applications-view";
import { TranslatedHeader } from "@/components/app/translated-header";

export const metadata: Metadata = { title: "Applications · HabitFlow" };

export default function Page() {
  return (
    <>
      <TranslatedHeader section="applications" />
      <ApplicationsView />
    </>
  );
}
