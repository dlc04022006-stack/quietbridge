import { randomBytes } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { describe, expect, it } from "vitest";
import {
  createProfileBearerToken,
  HmacBearerProfileAuthenticator
} from "./auth.js";

function requestWithAuthorization(value?: string): IncomingMessage {
  return { headers: value ? { authorization: value } : {} } as IncomingMessage;
}

describe("HmacBearerProfileAuthenticator", () => {
  it("accepts a valid signed profile token and ignores a caller profile claim", () => {
    const key = randomBytes(32);
    const token = createProfileBearerToken({
      profileId: "alice",
      expiresAtMs: 20_000,
      key
    });
    const authenticator = new HmacBearerProfileAuthenticator(key, () => 10_000);
    expect(authenticator.authenticate(requestWithAuthorization(`Bearer ${token}`), "bob")).toBe(
      "alice"
    );
  });

  it.each([
    ["missing header", undefined],
    ["wrong scheme", "Basic abc"],
    ["empty bearer", "Bearer "],
    ["malformed token", "Bearer not-a-token"],
    ["extra token segment", "Bearer a.b.c"]
  ])("rejects %s", (_name, authorization) => {
    const authenticator = new HmacBearerProfileAuthenticator(randomBytes(32));
    expect(authenticator.authenticate(requestWithAuthorization(authorization))).toBeNull();
  });

  it("rejects an expired, modified, or differently signed token", () => {
    const key = randomBytes(32);
    const token = createProfileBearerToken({
      profileId: "alice",
      expiresAtMs: 20_000,
      key
    });
    const expired = new HmacBearerProfileAuthenticator(key, () => 20_000);
    const wrongKey = new HmacBearerProfileAuthenticator(randomBytes(32), () => 10_000);
    const [payload, signature] = token.split(".");

    expect(expired.authenticate(requestWithAuthorization(`Bearer ${token}`))).toBeNull();
    expect(wrongKey.authenticate(requestWithAuthorization(`Bearer ${token}`))).toBeNull();
    expect(
      expired.authenticate(requestWithAuthorization(`Bearer ${payload}.${signature}x`))
    ).toBeNull();
  });

  it("rejects keys shorter than 32 bytes", () => {
    expect(() => new HmacBearerProfileAuthenticator(Buffer.alloc(31))).toThrow(
      "at least 32 bytes"
    );
    expect(() =>
      createProfileBearerToken({ profileId: "alice", expiresAtMs: 20_000, key: Buffer.alloc(31) })
    ).toThrow("at least 32 bytes");
  });
});
