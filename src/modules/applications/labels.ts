import type {
  ApplicationOutcome,
  ApplicationStatus,
  EmploymentType,
} from "./applications.schema";

export const statusLabels: Record<ApplicationStatus, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  assessment: "Assessment",
  interview: "Interview",
  offer: "Offer",
  closed: "Closed",
};

export const outcomeLabels: Record<ApplicationOutcome, string> = {
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const employmentTypeLabels: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

// One color per status, used on cards, badges, and (later) charts.
export const statusDotClass: Record<ApplicationStatus, string> = {
  wishlist: "bg-slate-400",
  applied: "bg-sky-500",
  assessment: "bg-violet-500",
  interview: "bg-amber-500",
  offer: "bg-emerald-500",
  closed: "bg-zinc-500",
};

// Status choices shown in dropdowns. Closing picks an outcome in the same step.
export type StatusChoice = {
  key: string;
  label: string;
  status: ApplicationStatus;
  outcome?: ApplicationOutcome;
};

export const statusChoices: StatusChoice[] = [
  { key: "wishlist", label: "Wishlist", status: "wishlist" },
  { key: "applied", label: "Applied", status: "applied" },
  { key: "assessment", label: "Assessment", status: "assessment" },
  { key: "interview", label: "Interview", status: "interview" },
  { key: "offer", label: "Offer", status: "offer" },
  {
    key: "closed:accepted",
    label: "Closed · Accepted",
    status: "closed",
    outcome: "accepted",
  },
  {
    key: "closed:rejected",
    label: "Closed · Rejected",
    status: "closed",
    outcome: "rejected",
  },
  {
    key: "closed:withdrawn",
    label: "Closed · Withdrawn",
    status: "closed",
    outcome: "withdrawn",
  },
];

export function choiceKey(
  status: ApplicationStatus,
  outcome: ApplicationOutcome | null,
) {
  return status === "closed" && outcome ? `closed:${outcome}` : status;
}

export function formatLocalDate(date: string) {
  // "2026-11-07" -> "7 Nov 2026", without shifting across timezones.
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
