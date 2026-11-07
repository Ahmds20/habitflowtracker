import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Settings · HabitFlow" };

// Theme and language for now. Profile and password forms arrive in M6.
export default function Page() {
  return <SettingsView />;
}
