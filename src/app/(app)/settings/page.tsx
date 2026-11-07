import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Settings · HabitFlow" };

// Appearance, profile, password, and account deletion.
export default function Page() {
  return <SettingsView />;
}
