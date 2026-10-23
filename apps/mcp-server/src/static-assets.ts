import { readFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, resolve, sep } from "node:path";

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function staticHeaders(filePath: string): Record<string, string> {
  const immutableAsset = filePath.includes(`${sep}assets${sep}`);
  return {
    "cache-control": immutableAsset ? "public, max-age=31536000, immutable" : "no-cache",
    "content-security-policy": [
      "default-src 'self'",
      "base-uri 'none'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data:",
      "object-src 'none'",
      "script-src 'self'",
      "style-src 'self'"
    ].join("; "),
    "cross-origin-resource-policy": "same-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY"
  };
}

function safeAssetPath(root: string, pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const relativePath = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const rootPath = resolve(root);
  const candidate = resolve(rootPath, relativePath);
  return candidate === rootPath || candidate.startsWith(`${rootPath}${sep}`) ? candidate : null;
}

export async function serveStaticAsset(
  request: IncomingMessage,
  response: ServerResponse,
  root: string
): Promise<boolean> {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  const filePath = safeAssetPath(root, pathname);
  if (!filePath) return false;
  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "content-length": body.length,
      "content-type": CONTENT_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream",
      ...staticHeaders(filePath)
    });
    response.end(request.method === "HEAD" ? undefined : body);
    return true;
  } catch {
    return false;
  }
}
