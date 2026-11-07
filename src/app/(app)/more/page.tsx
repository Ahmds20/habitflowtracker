import type { Metadata } from "next";
import { MoreMenu } from "@/components/app/more-menu";

export const metadata: Metadata = { title: "More · HabitFlow" };

export default function Page() {
  return <MoreMenu />;
}
