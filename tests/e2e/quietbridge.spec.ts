import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("shared-room details stay private and the bound phone can consume them", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Run protected request" }).click();

  await expect(page.locator(".decision")).toHaveText("PRIVATE");
  const alexaSpeech = page.locator(".alexa-utterance");
  await expect(alexaSpeech).toContainText("won't say the details");
  await expect(alexaSpeech).not.toContainText("Dr. Mehta");
  await expect(alexaSpeech).not.toContainText("City Heart Hospital");
  await expect(page.getByText("Private result ready")).toBeVisible();

  await page.getByLabel("Test authenticated profile").selectOption("bob");
  await page.getByRole("button", { name: "Verify and open" }).click();
  await expect(page.getByRole("alert")).toContainText("unavailable");

  await page.getByLabel("Test authenticated profile").selectOption("alice");
  await page.getByRole("button", { name: "Verify and open" }).click();
  await expect(page.getByText("VERIFIED FOR ALICE")).toBeVisible();
  await expect(page.getByText("Dr. Mehta")).toBeVisible();

  await page.getByRole("button", { name: "View privacy receipt" }).click();
  const receipt = page.locator(".lower-grid > article").first().locator("pre");
  await expect(receipt).toContainText('"valuesSent": false');
  await expect(receipt).not.toContainText("Dr. Mehta");
  await expect(page.getByText(/real tools discovered/)).toBeVisible();
});

test("unknown speaker is blocked without a private handoff", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Test identity signal").selectOption("UNKNOWN");
  await page.getByRole("button", { name: "Run protected request" }).click();

  await expect(page.locator(".decision")).toHaveText("BLOCKED");
  await expect(page.locator(".phone-empty")).toContainText("No private handoff");
  await expect(page.getByRole("button", { name: "Verify and open" })).toHaveCount(0);
});

test("confirmed deletion removes local state and reports connector status", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Run protected request" }).click();
  await expect(page.locator(".decision")).toHaveText("PRIVATE");

  await page.getByRole("button", { name: "Delete request" }).click();
  await expect(page.getByText("Delete QuietBridge’s copy")).toBeVisible();
  await page.getByRole("button", { name: "Yes, delete it" }).click();
  await expect(page.locator(".echo-panel .result-block")).toContainText("DOWNSTREAM_CONFIRMED");
  await expect(page.locator(".echo-panel .result-block")).toContainText('"local": "DELETED"');
});

test("initial product workspace has no serious or critical accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((violation) =>
    violation.impact === "serious" || violation.impact === "critical"
  );
  expect(blocking).toEqual([]);
});
