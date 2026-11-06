import { z } from "zod";

// Every API error uses one shape: { error: { code, message, details? } }.
export const errorStatus = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
} as const;

export type ErrorCode = keyof typeof errorStatus;

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
    // Extra response headers, e.g. Retry-After for RATE_LIMITED.
    public readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
  }

  get status() {
    return errorStatus[this.code];
  }
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown,
  headers?: Record<string, string>,
) {
  return Response.json(
    { error: { code, message, ...(details === undefined ? {} : { details }) } },
    { status: errorStatus[code], headers },
  );
}

// Converts any thrown value into the standard error response.
// Unknown errors are logged and hidden from the client.
export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return errorResponse(
      error.code,
      error.message,
      error.details,
      error.headers,
    );
  }
  if (error instanceof z.ZodError) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid request",
      z.flattenError(error).fieldErrors,
    );
  }
  console.error(error);
  return errorResponse("INTERNAL_ERROR", "Something went wrong");
}
