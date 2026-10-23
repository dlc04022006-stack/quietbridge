import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({
  headless: true,
  ...(process.platform === "win32" ? { channel: "msedge" } : {})
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
mkdirSync("docs/assets", { recursive: true });

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.screenshot({ path: "docs/assets/quietbridge-workspace.png", fullPage: true });

await page.getByRole("button", { name: "Run protected request" }).click();
await page.locator(".decision").filter({ hasText: "PRIVATE" }).waitFor();
await page.screenshot({ path: "docs/assets/quietbridge-private-flow.png", fullPage: true });

await browser.close();
console.log("Submission screenshots saved in docs/assets.");
