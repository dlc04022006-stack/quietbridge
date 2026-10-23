import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createQuietBridgeHttpServer } from "./http.js";

const directories: string[] = [];
const servers: Array<ReturnType<typeof createQuietBridgeHttpServer>> = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

async function startStaticServer() {
  const root = mkdtempSync(join(tmpdir(), "quietbridge-static-"));
  directories.push(root);
  writeFileSync(join(root, "index.html"), "<!doctype html><title>QuietBridge product</title>");
  const app = createQuietBridgeHttpServer(undefined, { staticRoot: root });
  servers.push(app);
  await new Promise<void>((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const address = app.server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

describe("production static assets", () => {
  it("serves the product shell with restrictive browser headers", async () => {
    const baseUrl = await startStaticServer();
    const response = await fetch(baseUrl);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("QuietBridge product");
    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("cache-control")).toBe("no-cache");
  });

  it("supports HEAD and rejects encoded traversal outside the static root", async () => {
    const baseUrl = await startStaticServer();
    const head = await fetch(baseUrl, { method: "HEAD" });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe("");

    const traversal = await fetch(`${baseUrl}/%2e%2e%2fpackage.json`);
    expect(traversal.status).toBe(404);
  });
});
