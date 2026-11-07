import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { waitForHydration } from "./helpers";

// Automated accessibility checks (WCAG 2.1 A and AA) on the main pages, in
// both themes. axe catches missing labels, contrast, and ARIA misuse; it does
// not replace testing with a keyboard and a screen reader.

async function audit(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(" "))
        .join("\n  ")}`,
  );
  expect(summary, summary.join("\n")).toEqual([]);
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => {
        localStorage.setItem("hf-theme", value);
      }, theme);
    });

    test("landing and login pages", async ({ page }) => {
      await page.goto("/");
      await audit(page);
      await page.goto("/login");
      await audit(page);
    });

    test("app pages in the demo account", async ({ page }) => {
      await page.goto("/");
      await waitForHydration(page, "main button");
      await page.getByRole("button", { name: "Try the demo" }).click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByText(/applications sent/).first()).toBeVisible();

      for (const path of [
        "/dashboard",
        "/applications",
        "/interviews",
        "/habits",
        "/settings",
      ]) {
        await page.goto(path);
        await page.getByRole("heading", { level: 1 }).waitFor();
        // Let client data load so the audit sees the real content.
        await page.waitForLoadState("networkidle");
        await audit(page);
      }
    });
  });
}
