import { z } from "zod";
import { AppError } from "@/lib/errors";

const uuid = z.uuid();

// IDs come from the URL. A malformed ID cannot exist, so it is a 404 like any
// other missing record (and never reaches Postgres, which would reject it with a 500).
export function parseId(value: string, resource = "Record") {
  const result = uuid.safeParse(value);
  if (!result.success) {
    throw new AppError("NOT_FOUND", `${resource} not found`);
  }
  return result.data;
}

export function searchParamsOf(request: Request) {
  return Object.fromEntries(new URL(request.url).searchParams);
}
