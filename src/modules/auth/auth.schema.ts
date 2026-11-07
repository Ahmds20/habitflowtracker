import { z } from "zod";

export function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email").max(254));

// Upper limit protects the server from very long inputs to the hash function.
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

const name = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(80, "Name must be at most 80 characters");

const timezone = z.string().refine(isValidTimezone, "Unknown timezone");

export const registerSchema = z.object({ name, email, password, timezone });

export const loginSchema = z.object({
  email,
  // No length rules on login: a wrong password is simply wrong.
  password: z.string().min(1, "Password is required").max(128),
});

export const updateProfileSchema = z
  .object({ name: name.optional(), timezone: timezone.optional() })
  .refine((data) => data.name !== undefined || data.timezone !== undefined, {
    message: "Nothing to update",
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(128),
  newPassword: password,
});

// Demo accounts have no password, so for them the field is optional.
export const deleteAccountSchema = z.object({
  password: z.string().max(128).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
