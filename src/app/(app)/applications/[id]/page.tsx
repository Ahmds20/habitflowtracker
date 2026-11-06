import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplicationDetailView } from "@/components/applications/application-detail";

export const metadata: Metadata = { title: "Application · HabitFlow" };

// The id is only known at request time, so it is read inside <Suspense>
// and the rest of the page shell can still be prerendered.
export default function Page({ params }: PageProps<"/applications/[id]">) {
  return (
    <Suspense>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({
  params,
}: Pick<PageProps<"/applications/[id]">, "params">) {
  const { id } = await params;
  return <ApplicationDetailView id={id} />;
}
