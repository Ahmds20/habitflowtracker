import type { Metadata } from "next";
import { InterviewsView } from "@/components/applications/interviews-view";
import { TranslatedHeader } from "@/components/app/translated-header";

export const metadata: Metadata = { title: "Interviews · HabitFlow" };

export default function Page() {
  return (
    <>
      <TranslatedHeader section="interviews" />
      <InterviewsView />
    </>
  );
}
