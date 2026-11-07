import { expect, type Page } from "@playwright/test";

let counter = 0;

export function uniqueEmail(prefix: string) {
  counter += 1;
  return `e2e-${prefix}-${Date.now()}-${counter}@example.com`;
}

// Forms are server-rendered; wait until React has attached its handlers so a
// click is not lost before hydration.
export async function waitForHydration(page: Page, selector = "form") {
  await page.waitForFunction(
    (sel) =>
      Object.keys(document.querySelector(sel) ?? {}).some((key) =>
        key.startsWith("__react"),
      ),
    selector,
  );
}

export async function registerAndOnboard(page: Page, name = "E2E User") {
  await page.goto("/register");
  await waitForHydration(page);
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(uniqueEmail("user"));
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await waitForHydration(page);
  await page.getByLabel("Applications per week").fill("3");
  await page.getByLabel("Practice coding").check();
  await page.getByRole("button", { name: "Start tracking" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
