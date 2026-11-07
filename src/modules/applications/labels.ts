import type { Dictionary } from "@/i18n/dictionaries/en";
import type {
  ApplicationOutcome,
  ApplicationStatus,
} from "./applications.schema";

// Words come from the dictionary (t.status, t.outcome, t.employmentType).
// This file only holds what does not change between languages.

// One colour per status, from the design reference (teal, orange, amber,
// emerald, slate), used on cards, badges, and columns. Wishlist is the quiet
// "not started yet" state.
export const statusDotClass: Record<ApplicationStatus, string> = {
  wishlist: "bg-slate-400",
  applied: "bg-teal-500",
  assessment: "bg-orange-500",
  interview: "bg-amber-500",
  offer: "bg-emerald-500",
  closed: "bg-slate-500",
};

// Tinted pill for status badges, readable in both themes.
export const statusBadgeClass: Record<ApplicationStatus, string> = {
  wishlist:
    "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  applied:
    "border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300",
  assessment:
    "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
  interview:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  offer:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  closed:
    "border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

// Status choices shown in dropdowns. Closing picks an outcome in the same step.
export type StatusChoice = {
  key: string;
  status: ApplicationStatus;
  outcome?: ApplicationOutcome;
};

export const statusChoices: StatusChoice[] = [
  { key: "wishlist", status: "wishlist" },
  { key: "applied", status: "applied" },
  { key: "assessment", status: "assessment" },
  { key: "interview", status: "interview" },
  { key: "offer", status: "offer" },
  { key: "closed:accepted", status: "closed", outcome: "accepted" },
  { key: "closed:rejected", status: "closed", outcome: "rejected" },
  { key: "closed:withdrawn", status: "closed", outcome: "withdrawn" },
];

// "Applied", or "Closed · Rejected" for a closed application.
export function statusText(
  t: Dictionary,
  status: ApplicationStatus,
  outcome?: ApplicationOutcome | null,
) {
  return outcome
    ? `${t.status[status]} · ${t.outcome[outcome]}`
    : t.status[status];
}

export function choiceKey(
  status: ApplicationStatus,
  outcome: ApplicationOutcome | null,
) {
  return status === "closed" && outcome ? `closed:${outcome}` : status;
}

// "2026-11-07" -> "7 Nov 2026", without shifting across timezones.
// `intl` is a BCP 47 tag such as "en-GB" or "id-ID".
export function formatLocalDate(date: string, intl = "en-GB") {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(intl, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
