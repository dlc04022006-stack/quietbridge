import type { AddressInfo } from "node:net";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { randomBytes } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  createProfileBearerToken,
  DemoProfileAuthenticator,
  HmacBearerProfileAuthenticator
} from "../apps/mcp-server/src/auth.js";
import {
  createQuietBridgeHttpServer,
  type QuietBridgeHttpOptions
} from "../apps/mcp-server/src/http.js";

describe("real MCP Streamable HTTP contract", () => {
  const running: Array<ReturnType<typeof createQuietBridgeHttpServer>> = [];

  afterEach(async () => {
    await Promise.all(running.splice(0).map((app) => app.close()));
  });

  async function start(options?: QuietBridgeHttpOptions) {
    const app = createQuietBridgeHttpServer(
      undefined,
      options ?? { profileAuthenticator: new DemoProfileAuthenticator() }
    );
    running.push(app);
    await new Promise<void>((resolve) => app.server.listen(0, "127.0.0.1", resolve));
    const address = app.server.address() as AddressInfo;
    return { app, endpoint: new URL(`http://127.0.0.1:${address.port}/mcp`) };
  }

  it.each(["legacy", "auto"] as const)(
    "negotiates the %s client mode, lists five tools, and makes real tool calls",
    async (mode) => {
      const { endpoint } = await start();
      const client = new Client(
        { name: `quietbridge-test-${mode}`, version: "1.0.0" },
        { versionNegotiation: { mode } }
      );
      const transport = new StreamableHTTPClientTransport(endpoint);
      await client.connect(transport);

      const listed = await client.listTools();
      expect(listed.tools.map((tool) => tool.name).sort()).toEqual([
        "create_private_handoff",
        "delete_private_request",
        "evaluate_disclosure",
        "get_privacy_receipt",
        "resolve_private_request"
      ]);

      const resolved = await client.callTool({
        name: "resolve_private_request",
        arguments: { profileId: "alice" }
      });
      const resolvedData = resolved.structuredContent as { requestId: string };
      expect(resolvedData.requestId).toMatch(/^[0-9a-f-]{36}$/i);
      expect(JSON.stringify(resolved)).not.toContain("cardiology consultation");

      const evaluated = await client.callTool({
        name: "evaluate_disclosure",
        arguments: {
          requestId: resolvedData.requestId,
          audience: {
            profileId: "alice",
            profileType: "ADULT",
            identityConfidence: 0.99,
            deviceContext: "SHARED",
            roomName: "Living Room"
          }
        }
      });
      const evaluatedData = evaluated.structuredContent as { decision: string; spokenText: string };
      expect(evaluatedData.decision).toBe("PRIVATE");
      expect(evaluatedData.spokenText).not.toContain("cardiology");

      await client.close();
    },
    15_000
  );

  it("enforces profile binding and one-time use through the real private HTTP endpoint", async () => {
    const authKey = randomBytes(32);
    const { endpoint } = await start({
      profileAuthenticator: new HmacBearerProfileAuthenticator(authKey)
    });
    const client = new Client(
      { name: "quietbridge-private-http-test", version: "1.0.0" },
      { versionNegotiation: { mode: "auto" } }
    );
    await client.connect(new StreamableHTTPClientTransport(endpoint));

    const resolved = await client.callTool({
      name: "resolve_private_request",
      arguments: { profileId: "alice" }
    });
    const requestId = (resolved.structuredContent as { requestId: string }).requestId;
    await client.callTool({
      name: "evaluate_disclosure",
      arguments: {
        requestId,
        audience: {
          profileId: "alice",
          profileType: "ADULT",
          identityConfidence: 0.99,
          deviceContext: "SHARED",
          roomName: "Living Room"
        }
      }
    });
    const handoff = await client.callTool({
      name: "create_private_handoff",
      arguments: { requestId, profileId: "alice" }
    });
    const token = (handoff.structuredContent as { token: string }).token;
    const privateEndpoint = new URL("/private/consume", endpoint);
    const aliceBearer = createProfileBearerToken({
      profileId: "alice",
      expiresAtMs: Date.now() + 60_000,
      key: authKey
    });
    const bobBearer = createProfileBearerToken({
      profileId: "bob",
      expiresAtMs: Date.now() + 60_000,
      key: authKey
    });

    const wrongProfile = await fetch(privateEndpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${bobBearer}`, "content-type": "application/json" },
      body: JSON.stringify({ token, profileId: "alice" })
    });
    expect(wrongProfile.status).toBe(403);
    expect(await wrongProfile.text()).not.toContain("cardiology consultation");

    const allowed = await fetch(privateEndpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${aliceBearer}`, "content-type": "application/json" },
      body: JSON.stringify({ token, profileId: "bob" })
    });
    expect(allowed.status).toBe(200);
    const allowedBody = (await allowed.json()) as { fields: Record<string, string> };
    expect(allowedBody.fields.appointmentType).toBe("cardiology consultation");
    expect(allowedBody.fields).not.toHaveProperty("accessToken");

    const replay = await fetch(privateEndpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${aliceBearer}`, "content-type": "application/json" },
      body: JSON.stringify({ token, profileId: "alice" })
    });
    expect(replay.status).toBe(409);
    expect(await replay.text()).not.toContain("cardiology consultation");

    await client.close();
  });

  it("rate limits private endpoint abuse without returning protected data", async () => {
    const app = createQuietBridgeHttpServer(undefined, {
      profileAuthenticator: new DemoProfileAuthenticator(),
      rateLimitMaxRequests: 2,
      rateLimitWindowMs: 60_000
    });
    running.push(app);
    await new Promise<void>((resolve) => app.server.listen(0, "127.0.0.1", resolve));
    const address = app.server.address() as AddressInfo;
    const endpoint = `http://127.0.0.1:${address.port}/private/consume`;
    const request = () =>
      fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "invalid", profileId: "alice" })
      });

    expect((await request()).status).toBe(403);
    expect((await request()).status).toBe(403);
    const limited = await request();
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("60");
    expect(await limited.text()).not.toContain("cardiology consultation");
  });

  it("rejects untrusted browser origins and returns defensive security headers", async () => {
    const { endpoint } = await start();
    const healthEndpoint = new URL("/health", endpoint);
    const blocked = await fetch(healthEndpoint, {
      headers: { origin: "https://attacker.example" }
    });
    expect(blocked.status).toBe(403);
    expect(blocked.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(blocked.headers.get("x-content-type-options")).toBe("nosniff");
    expect(blocked.headers.get("permissions-policy")).toContain("camera=()");
  });

  it("denies private consumption when no profile authenticator is configured", async () => {
    const app = createQuietBridgeHttpServer();
    running.push(app);
    await new Promise<void>((resolve) => app.server.listen(0, "127.0.0.1", resolve));
    const address = app.server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/private/consume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "opaque", profileId: "alice" })
    });
    expect(response.status).toBe(401);
  });

  it("requires an authenticated principal at the MCP boundary in production mode", async () => {
    const app = createQuietBridgeHttpServer(undefined, {
      profileAuthenticator: new HmacBearerProfileAuthenticator(randomBytes(32)),
      requireMcpAuthentication: true
    });
    running.push(app);
    await new Promise<void>((resolve) => app.server.listen(0, "127.0.0.1", resolve));
    const address = app.server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    });
    expect(response.status).toBe(401);
  });
});
