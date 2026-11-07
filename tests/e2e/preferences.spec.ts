import { expect, test } from "@playwright/test";

test("language and theme switch and are remembered", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Stay consistent until you land the job.",
  );

  await page.getByRole("radio", { name: "Indonesia" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Tetap konsisten sampai kamu diterima kerja.",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "id");

  await page.getByRole("radio", { name: "Gelap" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  // Both choices survive a full reload, with no flash back to the defaults.
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Tetap konsisten sampai kamu diterima kerja.",
  );
});

test("signed-out visitors are sent to log in", async ({ page }) => {
  await page.goto("/applications");
  await expect(page).toHaveURL(/\/login\?next=%2Fapplications$/);
});
