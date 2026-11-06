import { describe, expect, it } from "vitest";
import { isSameOrigin } from "@/modules/auth/origin";

function request(method: string, headers: Record<string, string>) {
  return new Request("http://localhost:3000/api/v1/auth/login", {
    method,
    headers,
  });
}

describe("isSameOrigin", () => {
  it("allows safe methods without an Origin header", () => {
    expect(isSameOrigin(request("GET", { host: "localhost:3000" }))).toBe(true);
  });

  it("allows mutations from the same host", () => {
    const req = request("POST", {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    });
    expect(isSameOrigin(req)).toBe(true);
  });

  it("uses x-forwarded-host behind a proxy", () => {
    const req = request("POST", {
      host: "internal:8080",
      "x-forwarded-host": "habitflow.app",
      origin: "https://habitflow.app",
    });
    expect(isSameOrigin(req)).toBe(true);
  });

  it("rejects mutations from another site", () => {
    const req = request("POST", {
      host: "localhost:3000",
      origin: "https://evil.example",
    });
    expect(isSameOrigin(req)).toBe(false);
  });

  it("rejects mutations without an Origin header", () => {
    expect(isSameOrigin(request("DELETE", { host: "localhost:3000" }))).toBe(
      false,
    );
  });

  it("rejects a malformed Origin header", () => {
    const req = request("PATCH", { host: "localhost:3000", origin: "null" });
    expect(isSameOrigin(req)).toBe(false);
  });
});
