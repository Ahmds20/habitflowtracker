"use client";

import {
  LanguageControl,
  ThemeControl,
} from "@/components/theme/preference-controls";

// Theme and language switches for pages without the app sidebar
// (landing, login, register, onboarding).
export function PreferenceBar() {
  return (
    <div className="flex items-center gap-1.5">
      <ThemeControl compact />
      <LanguageControl compact />
    </div>
  );
}
