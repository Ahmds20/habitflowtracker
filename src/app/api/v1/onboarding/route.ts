import { connection } from "next/server";
import { getDictionary, getLocale } from "@/i18n/server";
import { apiHandler, readJson } from "@/lib/api";
import { requireSession } from "@/modules/auth/session";
import { onboardingSchema } from "@/modules/onboarding/onboarding.schema";
import { completeOnboarding } from "@/modules/onboarding/onboarding.service";

export const POST = apiHandler(async (request) => {
  await connection();
  const { user } = await requireSession();
  const input = onboardingSchema.parse(await readJson(request));
  // Starter habits are named in the language the user is using right now.
  const t = getDictionary(await getLocale());
  await completeOnboarding(user, input, new Date(), t);
  return new Response(null, { status: 204 });
});
