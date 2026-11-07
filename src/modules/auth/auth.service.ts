import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  ChangePasswordInput,
  DeleteAccountInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "./auth.schema";
import { getDummyHash, hashPassword, verifyPassword } from "./password";
import {
  createSession,
  invalidateOtherSessions,
  type SessionUser,
} from "./session";

const userSelect = {
  id: true,
  email: true,
  name: true,
  timezone: true,
  isDemo: true,
} as const;

export async function register(input: RegisterInput) {
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await db.user.create({
      data: {
        email: input.email,
        name: input.name,
        timezone: input.timezone,
        passwordHash,
      },
      select: userSelect,
    });
    const session = await createSession(user.id);
    return { user, session };
  } catch (error) {
    // P2002 = unique constraint violation on email.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        "CONFLICT",
        "An account with this email already exists",
      );
    }
    throw error;
  }
}

export async function login(input: LoginInput) {
  const user = await db.user.findUnique({
    where: { email: input.email },
    select: { ...userSelect, passwordHash: true },
  });

  // Demo accounts have no password (only "Try demo" signs them in), so they
  // take the same path as an unknown email.
  const account = user && !user.isDemo ? user : null;

  // Always run one hash verification so response time does not reveal whether the email exists.
  const valid = await verifyPassword(
    account?.passwordHash ?? (await getDummyHash()),
    input.password,
  );
  if (!account || !valid) {
    throw new AppError("UNAUTHENTICATED", "Incorrect email or password");
  }

  const session = await createSession(account.id);
  return {
    user: {
      id: account.id,
      email: account.email,
      name: account.name,
      timezone: account.timezone,
      isDemo: account.isDemo,
    },
    session,
  };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  return db.user.update({
    where: { id: userId },
    data: input,
    select: userSelect,
  });
}

export async function changePassword(
  user: SessionUser,
  sessionId: string,
  input: ChangePasswordInput,
) {
  if (user.isDemo) {
    throw new AppError("FORBIDDEN", "Demo accounts cannot change the password");
  }

  const current = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!(await verifyPassword(current.passwordHash, input.currentPassword))) {
    throw new AppError("VALIDATION_ERROR", "Current password is incorrect", {
      currentPassword: ["Current password is incorrect"],
    });
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(input.newPassword) },
  });
  await invalidateOtherSessions(user.id, sessionId);
}

// Deletes the account and everything in it: sessions, applications, history,
// interviews, habits, and check-ins (all foreign keys cascade).
// Real accounts must confirm with their password; demo accounts have none.
export async function deleteAccount(
  user: SessionUser,
  input: DeleteAccountInput,
) {
  if (!user.isDemo) {
    const current = await db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    const valid =
      input.password !== undefined &&
      input.password.length > 0 &&
      (await verifyPassword(current.passwordHash, input.password));
    if (!valid) {
      throw new AppError("VALIDATION_ERROR", "Password is incorrect", {
        password: ["Password is incorrect"],
      });
    }
  }
  await db.user.delete({ where: { id: user.id } });
}
