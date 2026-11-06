import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AppError, toErrorResponse } from "@/lib/errors";

describe("toErrorResponse", () => {
  it("maps AppError to its status and code", async () => {
    const res = toErrorResponse(new AppError("NOT_FOUND", "Not found"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Not found" },
    });
  });

  it("maps ZodError to VALIDATION_ERROR with field details", async () => {
    const result = z.object({ email: z.email() }).safeParse({ email: "x" });
    const res = toErrorResponse(result.error);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toHaveProperty("email");
  });

  it("hides unknown errors behind INTERNAL_ERROR", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = toErrorResponse(new Error("secret db detail"));
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("secret");
    spy.mockRestore();
  });
});

describe("AppError headers", () => {
  it("adds extra headers such as Retry-After to the response", () => {
    const res = toErrorResponse(
      new AppError("RATE_LIMITED", "Slow down", undefined, {
        "Retry-After": "30",
      }),
    );
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
  });
});
