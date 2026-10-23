import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  toNodeHandler,
  type NodeIncomingMessageLike,
  type NodeServerResponseLike
} from "@modelcontextprotocol/node";
import {
  DenyAllProfileAuthenticator,
  type PrivateProfileAuthenticator
} from "./auth.js";
import { createQuietBridgeMcpHandler } from "./mcp.js";
import { InMemoryFixedWindowRateLimiter } from "./rate-limit.js";
import { QuietBridgeService, safePrivateHandoffError } from "./service.js";
import { serveStaticAsset } from "./static-assets.js";

const MAX_PRIVATE_BODY_BYTES = 16 * 1024;
const LOCAL_HOSTS = ["127.0.0.1", "localhost", "[::1]"];
const LOCAL_ORIGINS = ["http://127.0.0.1:5173", "http://localhost:5173"];

export interface QuietBridgeHttpOptions {
  rateLimitMaxRequests?: number;
  rateLimitWindowMs?: number;
  now?: () => number;
  profileAuthenticator?: PrivateProfileAuthenticator;
  trustedHosts?: readonly string[];
  allowedOrigins?: readonly string[];
  requireMcpAuthentication?: boolean;
  staticRoot?: string;
}

function securityHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    "cache-control": "no-store",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "cross-origin-resource-policy": "same-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    ...extraHeaders
  };
}

function writeJson(
  response: ServerResponse,
  status: number,
  body: unknown,
  extraHeaders: Record<string, string> = {}
): void {
  const encoded = JSON.stringify(body);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(encoded),
    ...securityHeaders(extraHeaders)
  });
  response.end(encoded);
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_PRIVATE_BODY_BYTES) throw new Error("BODY_TOO_LARGE");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function hostnameFromHeader(hostHeader: string | undefined): string | null {
  if (!hostHeader) return null;
  try {
    return new URL(`http://${hostHeader}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function requestBoundaryIsValid(
  request: IncomingMessage,
  trustedHosts: readonly string[],
  allowedOrigins: readonly string[]
): boolean {
  const hostname = hostnameFromHeader(request.headers.host);
  if (!hostname || !trustedHosts.includes(hostname)) return false;
  const origin = request.headers.origin;
  return origin === undefined || allowedOrigins.includes(origin);
}

function applyRateLimit(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  limiter: InMemoryFixedWindowRateLimiter
): boolean {
  if (pathname !== "/mcp" && pathname !== "/private/consume") return true;
  const clientKey = `${request.socket.remoteAddress ?? "unknown"}:${pathname}`;
  const rate = limiter.consume(clientKey);
  response.setHeader("x-ratelimit-remaining", String(rate.remaining));
  if (rate.allowed) return true;
  writeJson(
    response,
    429,
    { error: "Too many requests. Please wait and try again." },
    { "retry-after": String(rate.retryAfterSeconds) }
  );
  return false;
}

async function handlePrivateConsume(
  request: IncomingMessage,
  response: ServerResponse,
  service: QuietBridgeService,
  authenticator: PrivateProfileAuthenticator
): Promise<void> {
  try {
    const body = (await readJsonBody(request)) as { token?: unknown; profileId?: unknown };
    if (typeof body.token !== "string") {
      writeJson(response, 400, { error: "A private handoff token is required." });
      return;
    }
    const claimedProfileId = typeof body.profileId === "string" ? body.profileId : undefined;
    const authenticatedProfileId = authenticator.authenticate(request, claimedProfileId);
    if (!authenticatedProfileId) {
      writeJson(response, 401, { error: "Authentication is required." });
      return;
    }
    writeJson(response, 200, service.consumePrivateHandoff(body.token, authenticatedProfileId));
  } catch (error) {
    writePrivateError(response, error);
  }
}

function writePrivateError(response: ServerResponse, error: unknown): void {
  if (error instanceof SyntaxError) {
    writeJson(response, 400, { error: "The request body must be valid JSON." });
    return;
  }
  if (error instanceof Error && error.message === "BODY_TOO_LARGE") {
    writeJson(response, 413, { error: "The request body is too large." });
    return;
  }
  const safe = safePrivateHandoffError(error);
  writeJson(response, safe.status, { error: safe.message });
}

async function handleMcp(
  request: IncomingMessage,
  response: ServerResponse,
  nodeMcpHandler: ReturnType<typeof toNodeHandler>
): Promise<void> {
  try {
    await nodeMcpHandler(
      request as unknown as NodeIncomingMessageLike,
      response as unknown as NodeServerResponseLike
    );
  } catch (error) {
    console.error("QuietBridge HTTP transport error:", error instanceof Error ? error.name : "Error");
    if (!response.headersSent) {
      writeJson(response, 500, { error: "The MCP request could not be completed." });
    }
  }
}

async function dispatchRequest(input: {
  request: IncomingMessage;
  response: ServerResponse;
  pathname: string;
  service: QuietBridgeService;
  authenticator: PrivateProfileAuthenticator;
  requireMcpAuthentication: boolean;
  nodeMcpHandler: ReturnType<typeof toNodeHandler>;
  staticRoot?: string;
}): Promise<void> {
  const { request, response, pathname } = input;
  if (pathname === "/health" && request.method === "GET") {
    writeJson(response, 200, { status: "ok", service: "quietbridge", version: "0.1.0" });
    return;
  }
  if (pathname === "/private/consume" && request.method === "POST") {
    await handlePrivateConsume(request, response, input.service, input.authenticator);
    return;
  }
  if (pathname === "/mcp") {
    if (input.requireMcpAuthentication && !input.authenticator.authenticate(request)) {
      writeJson(response, 401, { error: "Authentication is required." });
      return;
    }
    await handleMcp(request, response, input.nodeMcpHandler);
    return;
  }
  if (input.staticRoot && (await serveStaticAsset(request, response, input.staticRoot))) return;
  writeJson(response, 404, { error: "Not found." });
}

export function createQuietBridgeHttpServer(
  service = new QuietBridgeService(),
  options: QuietBridgeHttpOptions = {}
) {
  const mcpHandler = createQuietBridgeMcpHandler(service);
  const nodeMcpHandler = toNodeHandler(mcpHandler);
  const authenticator = options.profileAuthenticator ?? new DenyAllProfileAuthenticator();
  const trustedHosts = options.trustedHosts ?? LOCAL_HOSTS;
  const allowedOrigins = options.allowedOrigins ?? LOCAL_ORIGINS;
  const requireMcpAuthentication = options.requireMcpAuthentication ?? false;
  const staticRoot = options.staticRoot;
  const rateLimiter = new InMemoryFixedWindowRateLimiter(
    options.rateLimitMaxRequests,
    options.rateLimitWindowMs,
    options.now
  );

  const server = createServer(async (request, response) => {
    if (!requestBoundaryIsValid(request, trustedHosts, allowedOrigins)) {
      writeJson(response, 403, { error: "Request origin is not allowed." });
      return;
    }
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    if (!applyRateLimit(request, response, url.pathname, rateLimiter)) return;

    await dispatchRequest({
      request,
      response,
      pathname: url.pathname,
      service,
      authenticator,
      requireMcpAuthentication,
      nodeMcpHandler,
      ...(staticRoot ? { staticRoot } : {})
    });
  });

  return {
    server,
    service,
    async close(): Promise<void> {
      await mcpHandler.close();
      if (server.listening) {
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve()))
        );
      }
    }
  };
}
