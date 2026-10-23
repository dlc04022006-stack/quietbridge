import { chromium } from "playwright";
import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("docs/assets/demo-recording");
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  recordVideo: { dir: outputDir, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();

async function caption(text, durationMs) {
  await page.evaluate((value) => {
    let banner = document.querySelector("#submission-caption");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "submission-caption";
      Object.assign(banner.style, {
        position: "fixed",
        zIndex: "2147483647",
        left: "50%",
        bottom: "22px",
        transform: "translateX(-50%)",
        width: "min(1180px, calc(100vw - 48px))",
        padding: "14px 20px",
        borderRadius: "14px",
        color: "#ffffff",
        background: "rgba(5, 18, 13, 0.94)",
        border: "1px solid rgba(99, 230, 174, 0.7)",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
        font: "600 22px/1.35 system-ui, sans-serif",
        textAlign: "center",
      });
      document.body.append(banner);
    }
    banner.textContent = value;
  }, text);
  await page.waitForTimeout(durationMs);
}

await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
await caption("QuietBridge · Privacy delivery before an assistant speaks", 6500);
await caption("Real MCP server · Clearly labelled Alexa, identity, phone, and calendar test adapters", 7500);

await page.getByRole("button", { name: "Run protected request" }).click();
await page.locator(".decision").filter({ hasText: "PRIVATE" }).waitFor();
await caption("Shared room → PRIVATE · Protected values never enter Alexa's spoken response", 9500);
await caption("Live evidence: initialize → tools/list → tools/call over MCP Streamable HTTP", 7500);

await page.getByLabel("Test authenticated profile").selectOption("bob");
await page.getByRole("button", { name: "Verify and open" }).click();
await page.getByRole("alert").waitFor();
await caption("Wrong profile: Bob is denied", 6500);

await page.getByLabel("Test authenticated profile").selectOption("alice");
await page.getByRole("button", { name: "Verify and open" }).click();
await page.getByText("VERIFIED FOR ALICE").waitFor();
await caption("Right profile: Alice opens a short-lived, one-time private handoff", 9000);

await page.getByRole("button", { name: "View privacy receipt" }).click();
await page.locator(".lower-grid > article").first().locator("pre").waitFor();
await page.locator(".lower-grid").scrollIntoViewIfNeeded();
await caption("Content-free receipt: categories and reasons, never the appointment value", 9000);

await page.getByRole("button", { name: "Delete request" }).click();
await page.getByRole("button", { name: "Yes, delete it" }).click();
await page.locator(".echo-panel .result-block").filter({ hasText: "DOWNSTREAM_CONFIRMED" }).waitFor();
await caption("Deletion reports local and connector outcomes separately", 8500);

await page.reload({ waitUntil: "networkidle" });
await page.getByLabel("Test identity signal").selectOption("UNKNOWN");
await page.getByRole("button", { name: "Run protected request" }).click();
await page.locator(".decision").filter({ hasText: "BLOCKED" }).waitFor();
await caption("Unknown identity → BLOCKED · No private handoff is created", 9000);

await caption("Reusable connector layer for calendar, health, commerce, and account systems", 8000);
await caption("87 tests · 88.5% coverage · 0 serious/critical accessibility findings · 0 production vulnerabilities", 9500);
await caption("QuietBridge · A visible, testable privacy decision before speech", 6000);

await context.close();
await browser.close();

const files = (await readdir(outputDir)).filter((file) => file.endsWith(".webm"));
if (files.length !== 1) {
  throw new Error(`Expected one recorded video, found ${files.length}`);
}
console.log(path.join(outputDir, files[0]));
