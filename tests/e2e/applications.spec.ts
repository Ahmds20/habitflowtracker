import { expect, test } from "@playwright/test";
import { registerAndOnboard } from "./helpers";

test("a new user adds an application and moves it through the pipeline", async ({
  page,
}) => {
  await registerAndOnboard(page);
  await expect(
    page.getByText("0 of 3 applications sent").first(),
  ).toBeVisible();

  await page.getByRole("button", { name: "Add application" }).first().click();
  await page.getByLabel("Company").fill("Tokopedia");
  await page.getByLabel("Position").fill("Frontend Engineer");
  await page.getByRole("button", { name: "Add", exact: true }).click();

  // The weekly goal counts it straight away.
  await expect(
    page.getByText("1 of 3 applications sent").first(),
  ).toBeVisible();

  await page.goto("/applications");
  const card = page.getByRole("article").filter({ hasText: "Tokopedia" });
  await card.getByRole("combobox", { name: "Status of Tokopedia" }).click();
  await page.getByRole("option", { name: "Interview", exact: true }).click();

  await expect(
    page
      .getByRole("region", { name: "Interview column" })
      .getByText("Tokopedia"),
  ).toBeVisible();

  // The move is recorded in the application's history.
  await card.getByRole("link", { name: "Tokopedia" }).click();
  await expect(page.getByText("Moved to Interview")).toBeVisible();
});
