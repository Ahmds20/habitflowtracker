import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  isLocalDate,
  isoWeekday,
  startOfWeek,
  todayIn,
} from "@/lib/date";

describe("todayIn", () => {
  // 2026-03-01 23:30 UTC is already 2 March in Jakarta (UTC+7)
  // and still 1 March in New York (UTC-5).
  const moment = new Date("2026-03-01T23:30:00Z");

  it("uses the user's timezone, not the server's", () => {
    expect(todayIn("Asia/Jakarta", moment)).toBe("2026-03-02");
    expect(todayIn("America/New_York", moment)).toBe("2026-03-01");
    expect(todayIn("UTC", moment)).toBe("2026-03-01");
  });
});

describe("isLocalDate", () => {
  it("accepts real dates and rejects impossible ones", () => {
    expect(isLocalDate("2028-02-29")).toBe(true);
    expect(isLocalDate("2026-02-29")).toBe(false);
    expect(isLocalDate("2026-13-01")).toBe(false);
    expect(isLocalDate("2026-1-1")).toBe(false);
  });
});

describe("calendar math", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("is not affected by daylight-saving changes", () => {
    // US clocks move forward on 2026-03-08.
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09");
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2);
  });

  it("counts days between dates", () => {
    expect(daysBetween("2026-01-01", "2026-01-31")).toBe(30);
    expect(daysBetween("2026-01-31", "2026-01-01")).toBe(-30);
  });

  it("numbers weekdays from Monday = 1 to Sunday = 7", () => {
    expect(isoWeekday("2026-11-02")).toBe(1); // Monday
    expect(isoWeekday("2026-11-08")).toBe(7); // Sunday
  });

  it("starts weeks on Monday, including across a year boundary", () => {
    expect(startOfWeek("2026-11-08")).toBe("2026-11-02"); // Sunday -> Monday
    expect(startOfWeek("2026-11-02")).toBe("2026-11-02");
    expect(startOfWeek("2027-01-01")).toBe("2026-12-28"); // Friday
  });
});
