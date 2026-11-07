"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useI18n, useSetLocale } from "@/i18n/client";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import type { Theme } from "./theme-script";
import { useTheme } from "./use-theme";

const themeIcons = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
} satisfies Record<Theme, unknown>;

const localeNames: Record<Locale, string> = { en: "English", id: "Indonesia" };
const localeShort: Record<Locale, string> = { en: "EN", id: "ID" };

// A segmented control: one button per option, the current one pressed.
function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  render,
  compact,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  render: (option: T) => { content: React.ReactNode; name: string };
  compact?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="bg-muted inline-flex rounded-lg p-0.5"
    >
      {options.map((option) => {
        const { content, name } = render(option);
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={compact ? name : undefined}
            title={compact ? name : undefined}
            onClick={() => onChange(option)}
            className={cn(
              "focus-visible:ring-ring/50 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

export function ThemeControl({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  return (
    <Segmented
      label={t.preferences.theme}
      options={["light", "dark", "system"] as const}
      value={theme}
      onChange={setTheme}
      compact={compact}
      render={(option) => {
        const Icon = themeIcons[option];
        const name = t.preferences[option];
        return {
          name,
          content: (
            <>
              <Icon className="size-3.5" aria-hidden />
              {!compact && name}
            </>
          ),
        };
      }}
    />
  );
}

export function LanguageControl({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useI18n();
  const { setLocale } = useSetLocale();
  return (
    <Segmented
      label={t.preferences.language}
      options={locales}
      value={locale}
      onChange={setLocale}
      compact={compact}
      render={(option) => ({
        name: localeNames[option],
        content: (
          <span lang={option}>
            {compact ? localeShort[option] : localeNames[option]}
          </span>
        ),
      })}
    />
  );
}
