import { describe, expect, it } from "vitest";
import {
  dayStatus,
  dailyStreaks,
  weeklyStreaks,
  type DaysSchedule,
} from "@/modules/habits/streak";

// Calendar used below (November 2026):
// Mon 2  Tue 3  Wed 4  Thu 5  Fri 6  Sat 7  Sun 8
// Mon 9  Tue 10 Wed 11 Thu 12 Fri 13 Sat 14 Sun 15

const everyDay: DaysSchedule = {
  daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
  startDate: "2026-11-01",
};
const weekdays: DaysSchedule = {
  daysOfWeek: [1, 2, 3, 4, 5],
  startDate: "2026-11-01",
};

function dates(...days: number[]) {
  return days.map((d) => `2026-11-${String(d).padStart(2, "0")}`);
}

describe("dailyStreaks (days schedule)", () => {
  it("counts consecutive scheduled days that were checked in", () => {
    const result = dailyStreaks(everyDay, dates(10, 11, 12), "2026-11-12");
    expect(result).toEqual({ current: 3, longest: 3 });
  });

  it("is zero with no check-ins", () => {
    expect(dailyStreaks(everyDay, [], "2026-11-12")).toEqual({
      current: 0,
      longest: 0,
    });
  });

  it("does not break the streak just because today is not done yet", () => {
    const result = dailyStreaks(everyDay, dates(10, 11), "2026-11-12");
    expect(result.current).toBe(2);
  });

  it("breaks the streak when a past scheduled day was missed", () => {
    // 11 missed, today (12) not done yet.
    const result = dailyStreaks(everyDay, dates(9, 10), "2026-11-12");
    expect(result).toEqual({ current: 0, longest: 2 });
  });

  it("skips unscheduled days without breaking the streak", () => {
    // Weekdays only: Fri 6, then Mon 9 and Tue 10. The weekend is not scheduled.
    const result = dailyStreaks(weekdays, dates(5, 6, 9, 10), "2026-11-10");
    expect(result.current).toBe(4);
  });

  it("ignores check-ins on unscheduled days", () => {
    // Sat 7 is not a weekday; it neither adds to nor breaks the streak.
    const result = dailyStreaks(weekdays, dates(6, 7, 9), "2026-11-09");
    expect(result.current).toBe(2);
  });

  it("keeps the longest streak after a break", () => {
    const result = dailyStreaks(
      everyDay,
      dates(2, 3, 4, 5, 7, 8),
      "2026-11-08",
    );
    expect(result).toEqual({ current: 2, longest: 4 });
  });

  it("does not count days before the habit started", () => {
    const late = { ...everyDay, startDate: "2026-11-10" };
    const result = dailyStreaks(late, dates(10, 11), "2026-11-11");
    expect(result).toEqual({ current: 2, longest: 2 });
  });

  it("works across a year boundary", () => {
    const schedule = {
      daysOfWeek: everyDay.daysOfWeek,
      startDate: "2026-12-01",
    };
    const result = dailyStreaks(
      schedule,
      ["2026-12-30", "2026-12-31", "2027-01-01"],
      "2027-01-01",
    );
    expect(result.current).toBe(3);
  });
});

describe("weeklyStreaks (weekly target)", () => {
  const habit = { target: 3, startDate: "2026-10-01" };

  // Week of Mon 26 Oct, Mon 2 Nov, Mon 9 Nov.
  const counts = (entries: Record<string, number>) =>
    new Map(Object.entries(entries));

  it("counts consecutive weeks that met the target", () => {
    const result = weeklyStreaks(
      habit,
      counts({ "2026-10-26": 3, "2026-11-02": 4 }),
      "2026-11-09",
    );
    expect(result).toEqual({ current: 2, longest: 2 });
  });

  it("does not break the streak during the current week", () => {
    const result = weeklyStreaks(
      habit,
      counts({ "2026-11-02": 3, "2026-11-09": 1 }),
      "2026-11-11",
    );
    expect(result.current).toBe(1);
  });

  it("counts the current week once its target is met", () => {
    const result = weeklyStreaks(
      habit,
      counts({ "2026-11-02": 3, "2026-11-09": 3 }),
      "2026-11-11",
    );
    expect(result.current).toBe(2);
  });

  it("breaks the streak after a week below target", () => {
    const result = weeklyStreaks(
      habit,
      counts({ "2026-10-19": 3, "2026-10-26": 3, "2026-11-02": 2 }),
      "2026-11-09",
    );
    expect(result).toEqual({ current: 0, longest: 2 });
  });

  it("does not count weeks before the habit started", () => {
    const late = { target: 3, startDate: "2026-11-04" };
    const result = weeklyStreaks(
      late,
      counts({ "2026-11-02": 3 }),
      "2026-11-09",
    );
    expect(result.current).toBe(1);
  });
});

describe("dayStatus", () => {
  it("labels history days for the 30-day grid", () => {
    const done = new Set(dates(9));
    const today = "2026-11-10";
    expect(dayStatus(weekdays, done, "2026-11-09", today)).toBe("done");
    expect(dayStatus(weekdays, done, "2026-11-06", today)).toBe("missed");
    expect(dayStatus(weekdays, done, "2026-11-08", today)).toBe("unscheduled");
    expect(dayStatus(weekdays, done, "2026-11-10", today)).toBe("pending");
    expect(dayStatus(weekdays, done, "2026-10-30", today)).toBe("unscheduled"); // before start
  });
});
