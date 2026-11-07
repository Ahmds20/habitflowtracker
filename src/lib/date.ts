// Local calendar dates ("YYYY-MM-DD") and their mapping to Postgres DATE columns.
//
// A DATE column has no timezone. Prisma reads and writes it as a JS Date at
// midnight UTC, so we convert at the edges and use "YYYY-MM-DD" strings everywhere else.

export type LocalDate = string; // "YYYY-MM-DD"

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isLocalDate(value: string): value is LocalDate {
  if (!LOCAL_DATE.test(value)) return false;
  const date = toDbDate(value);
  // Month 13 is an Invalid Date; 2026-02-30 rolls over to March. Reject both.
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

// "Today" on the user's calendar, e.g. still the 6th in Jakarta when it is
// already the 7th in UTC, or vice versa.
export function todayIn(timezone: string, now = new Date()): LocalDate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function toDbDate(date: LocalDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

// ---------- Calendar math ----------
// A LocalDate is a calendar day, not a moment. Doing the math on UTC midnight
// avoids daylight-saving jumps: every day is exactly 24 hours long here.

const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(date: LocalDate, days: number): LocalDate {
  return new Date(toDbDate(date).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

// Whole days from `a` to `b` (positive when b is later).
export function daysBetween(a: LocalDate, b: LocalDate) {
  return Math.round((toDbDate(b).getTime() - toDbDate(a).getTime()) / DAY_MS);
}

// ISO weekday: 1 = Monday ... 7 = Sunday.
export function isoWeekday(date: LocalDate) {
  const day = toDbDate(date).getUTCDay(); // 0 = Sunday
  return day === 0 ? 7 : day;
}

// Weeks start on Monday (ISO 8601).
export function startOfWeek(date: LocalDate): LocalDate {
  return addDays(date, 1 - isoWeekday(date));
}

export function fromDbDate(date: Date): LocalDate;
export function fromDbDate(date: Date | null): LocalDate | null;
export function fromDbDate(date: Date | null): LocalDate | null {
  return date ? date.toISOString().slice(0, 10) : null;
}
