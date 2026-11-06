// Local calendar dates ("YYYY-MM-DD") and their mapping to Postgres DATE columns.
//
// A DATE column has no timezone. Prisma reads and writes it as a JS Date at
// midnight UTC, so we convert at the edges and use "YYYY-MM-DD" strings everywhere else.

export type LocalDate = string; // "YYYY-MM-DD"

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isLocalDate(value: string): value is LocalDate {
  if (!LOCAL_DATE.test(value)) return false;
  // Reject impossible dates like 2026-02-30.
  return toDbDate(value).toISOString().slice(0, 10) === value;
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

export function fromDbDate(date: Date): LocalDate;
export function fromDbDate(date: Date | null): LocalDate | null;
export function fromDbDate(date: Date | null): LocalDate | null {
  return date ? date.toISOString().slice(0, 10) : null;
}
