import { z } from "zod";

export const interviewTypes = ["phone", "video", "onsite"] as const;
export type InterviewType = (typeof interviewTypes)[number];

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .transform((value) => value || null)
    .nullable()
    .optional();

const fields = {
  // An exact moment, e.g. "2026-11-10T09:00:00+07:00". The browser converts
  // the user's local input to this before sending.
  scheduledAt: z.iso.datetime({
    offset: true,
    message: "Use a valid date and time",
  }),
  type: z.enum(interviewTypes),
  title: optionalText(120),
  meetingUrl: z
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
    .optional(),
  notes: optionalText(10_000),
};

export const createInterviewSchema = z.object(fields).strict();

export const updateInterviewSchema = z
  .object({
    ...fields,
    scheduledAt: fields.scheduledAt.optional(),
    type: fields.type.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nothing to update",
  });

export const listInterviewsQuery = z.object({
  range: z.enum(["upcoming", "past"]).default("upcoming"),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
