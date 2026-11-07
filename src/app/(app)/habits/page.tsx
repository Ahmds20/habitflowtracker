import type { Metadata } from "next";
import { TranslatedHeader } from "@/components/app/translated-header";
import { HabitsView } from "@/components/habits/habits-view";

export const metadata: Metadata = { title: "Habits · HabitFlow" };

export default function Page() {
  return (
    <>
      <TranslatedHeader section="habits" />
      <HabitsView />
    </>
  );
}
