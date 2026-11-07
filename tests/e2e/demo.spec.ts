import { expect, test } from "@playwright/test";
import { waitForHydration } from "./helpers";

test("a visitor opens the demo and checks in a habit", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page, "main button");
  await page.getByRole("button", { name: "Try the demo" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("status")).toContainText("demo account");
  await expect(page.getByText(/of 5 applications sent/).first()).toBeVisible();

  const habits = page
    .locator("section", { hasText: "Today's habits" })
    .getByRole("button");
  const first = habits.first();
  await expect(first).toHaveAttribute("aria-pressed", "false");
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");

  // The check-in is saved: it survives a reload.
  await page.reload();
  await expect(
    page
      .locator("section", { hasText: "Today's habits" })
      .getByRole("button")
      .first(),
  ).toHaveAttribute("aria-pressed", "true");
});
