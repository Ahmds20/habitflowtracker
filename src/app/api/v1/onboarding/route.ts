import { connection } from "next/server";
import { apiHandler, readJson } from "@/lib/api";
import { requireSession } from "@/modules/auth/session";
import { onboardingSchema } from "@/modules/onboarding/onboarding.schema";
import { completeOnboarding } from "@/modules/onboarding/onboarding.service";

export const POST = apiHandler(async (request) => {
  await connection();
  const { user } = await requireSession();
  const input = onboardingSchema.parse(await readJson(request));
  await completeOnboarding(user, input);
  return new Response(null, { status: 204 });
});
