import { describe, expect, it } from "vitest";
import {
  registerSchema,
  updateProfileSchema,
} from "@/modules/auth/auth.schema";
import { safeNextPath } from "@/lib/api-client";

describe("registerSchema", () => {
  const valid = {
    name: "  Faiz ",
    email: "  Faiz@Example.COM ",
    password: "password123",
    timezone: "Asia/Jakarta",
  };

  it("trims the name and normalizes the email", () => {
    const data = registerSchema.parse(valid);
    expect(data.name).toBe("Faiz");
    expect(data.email).toBe("faiz@example.com");
  });

  it("rejects unknown timezones", () => {
    const result = registerSchema.safeParse({
      ...valid,
      timezone: "Mars/Base",
    });
    expect(result.success).toBe(false);
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short" });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("rejects an empty update", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("keeps paths on this site", () => {
    expect(safeNextPath("/habits")).toBe("/habits");
  });

  it("blocks other domains and falls back to the dashboard", () => {
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
  });
});
