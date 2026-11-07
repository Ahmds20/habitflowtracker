import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { HabitsView } from "@/components/habits/habits-view";

export const metadata: Metadata = { title: "Habits · HabitFlow" };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Habits"
        description="Small routines that keep your job hunt moving."
      />
      <HabitsView />
    </>
  );
}
