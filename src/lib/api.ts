import "server-only";
import { isSameOrigin } from "@/modules/auth/origin";
import { AppError, toErrorResponse } from "@/lib/errors";

type Handler<Ctx> = (request: Request, context: Ctx) => Promise<Response>;

// Wraps every API Route Handler:
// - rejects cross-origin state-changing requests (CSRF defense)
// - turns thrown errors into the standard error response
export function apiHandler<Ctx = unknown>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (request, context) => {
    try {
      if (!isSameOrigin(request)) {
        throw new AppError("FORBIDDEN", "Cross-origin request blocked");
      }
      return await handler(request, context);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

// Parses a JSON body. Malformed JSON becomes a 400 instead of a 500.
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Request body must be valid JSON");
  }
}
