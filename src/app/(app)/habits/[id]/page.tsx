import type { Metadata } from "next";
import { Suspense } from "react";
import { HabitDetailView } from "@/components/habits/habit-detail";

export const metadata: Metadata = { title: "Habit · HabitFlow" };

// The id is only known at request time, so it is read inside <Suspense>.
export default function Page({ params }: PageProps<"/habits/[id]">) {
  return (
    <Suspense>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/habits/[id]">, "params">) {
  const { id } = await params;
  return <HabitDetailView id={id} />;
}
