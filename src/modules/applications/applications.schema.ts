import { z } from "zod";
import { isLocalDate } from "@/lib/date";

export const applicationStatuses = [
  "wishlist",
  "applied",
  "assessment",
  "interview",
  "offer",
  "closed",
] as const;
export const applicationOutcomes = [
  "accepted",
  "rejected",
  "withdrawn",
] as const;
export const employmentTypes = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "freelance",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];
export type ApplicationOutcome = (typeof applicationOutcomes)[number];
export type EmploymentType = (typeof employmentTypes)[number];

export const statusSchema = z.enum(applicationStatuses);
export const outcomeSchema = z.enum(applicationOutcomes);

export const localDate = z
  .string()
  .refine(isLocalDate, "Use a valid date (YYYY-MM-DD)");

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

// Optional text: empty strings become null so the field can be cleared.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .transform((value) => value || null)
    .nullable()
    .optional();

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .transform((value) => value || null)
  .pipe(
    z
      .url({ protocol: /^https?$/, message: "Use a full http(s) link" })
      .nullable(),
  )
  .nullable()
  .optional();

const editableFields = {
  company: requiredText("Company", 120),
  position: requiredText("Position", 120),
  appliedDate: localDate.nullable().optional(),
  followUpDate: localDate.nullable().optional(),
  jobUrl: optionalUrl,
  location: optionalText(120),
  employmentType: z.enum(employmentTypes).nullable().optional(),
  salaryExpectation: optionalText(120),
  description: optionalText(10_000),
  notes: optionalText(10_000),
};

export const createApplicationSchema = z
  .object({
    ...editableFields,
    // Closed is reached only through a status change, which records an outcome.
    status: statusSchema.exclude(["closed"]).default("applied"),
  })
  .strict();

// Status is changed only through PATCH /applications/:id/status.
export const updateApplicationSchema = z
  .object({
    ...editableFields,
    company: editableFields.company.optional(),
    position: editableFields.position.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nothing to update",
  });

export const changeStatusSchema = z
  .object({
    status: statusSchema,
    outcome: outcomeSchema.optional(),
  })
  .strict()
  .refine(
    (data) => (data.status === "closed") === (data.outcome !== undefined),
    {
      message:
        "Closing an application requires an outcome; other statuses take none",
      path: ["outcome"],
    },
  );

export const listApplicationsQuery = z.object({
  status: statusSchema.optional(),
  q: z.string().trim().max(120).optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuery>;
