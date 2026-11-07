import { describe, expect, it } from "vitest";
import { localeFromAcceptLanguage } from "@/i18n/config";
import en from "@/i18n/dictionaries/en";
import id from "@/i18n/dictionaries/id";

// Every key path in a dictionary, e.g. "dashboard.stats.streak".
function keyPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("dictionaries", () => {
  it("have the same keys in English and Indonesian", () => {
    // TypeScript already enforces this; the test guards against `as` casts.
    const ignored = (path: string) => path.startsWith("serverMessages");
    expect(
      keyPaths(id)
        .filter((p) => !ignored(p))
        .sort(),
    ).toEqual(
      keyPaths(en)
        .filter((p) => !ignored(p))
        .sort(),
    );
  });

  it("keep list lengths equal", () => {
    expect(id.habits.weekdays).toHaveLength(7);
    expect(id.landing.week.days).toHaveLength(7);
    expect(id.landing.points).toHaveLength(en.landing.points.length);
  });

  it("translate the same number of placeholders", () => {
    expect(id.dashboard.applicationsSent(3, 5)).toContain("3");
    expect(id.dashboard.applicationsSent(3, 5)).toContain("5");
    expect(id.applications.moved("Gojek", "Tes")).toContain("Gojek");
    expect(id.onboarding.linkedName(7)).toBe("Kirim 7 lamaran");
  });
});

describe("localeFromAcceptLanguage", () => {
  it("picks the highest-ranked supported language", () => {
    expect(localeFromAcceptLanguage("id-ID,id;q=0.9,en;q=0.8")).toBe("id");
    expect(localeFromAcceptLanguage("en-US,en;q=0.9")).toBe("en");
    expect(localeFromAcceptLanguage("fr-FR,id;q=0.5,en;q=0.7")).toBe("en");
  });

  it("falls back to English", () => {
    expect(localeFromAcceptLanguage(null)).toBe("en");
    expect(localeFromAcceptLanguage("ja-JP")).toBe("en");
  });
});
