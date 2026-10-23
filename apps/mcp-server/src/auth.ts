import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { z } from "zod";

const TOKEN_AUDIENCE = "quietbridge-private";
const TOKEN_ISSUER = "quietbridge-auth";

const ProfileTokenPayloadSchema = z.object({
  sub: z.string().min(1).max(100),
  exp: z.number().int().positive(),
  aud: z.literal(TOKEN_AUDIENCE),
  iss: z.literal(TOKEN_ISSUER)
});

export interface PrivateProfileAuthenticator {
  authenticate(request: IncomingMessage, claimedProfileId?: string): string | null;
}

export class DenyAllProfileAuthenticator implements PrivateProfileAuthenticator {
  authenticate(): null {
    return null;
  }
}

/** Only for the clearly labelled local showcase. Never use this in production. */
export class DemoProfileAuthenticator implements PrivateProfileAuthenticator {
  authenticate(_request: IncomingMessage, claimedProfileId?: string): string | null {
    return claimedProfileId?.trim() || null;
  }
}

function signatureFor(encodedPayload: string, key: Buffer): Buffer {
  return createHmac("sha256", key).update(encodedPayload).digest();
}

function readBearerToken(request: IncomingMessage): string | null {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export class HmacBearerProfileAuthenticator implements PrivateProfileAuthenticator {
  private readonly key: Buffer;

  constructor(
    key: Buffer,
    private readonly now: () => number = () => Date.now()
  ) {
    if (key.length < 32) throw new Error("QuietBridge authentication key must be at least 32 bytes.");
    this.key = Buffer.from(key);
  }

  authenticate(request: IncomingMessage, _claimedProfileId?: string): string | null {
    const token = readBearerToken(request);
    if (!token) return null;
    const [encodedPayload, encodedSignature, extra] = token.split(".");
    if (!encodedPayload || !encodedSignature || extra !== undefined) return null;

    try {
      const suppliedSignature = Buffer.from(encodedSignature, "base64url");
      const expectedSignature = signatureFor(encodedPayload, this.key);
      if (
        suppliedSignature.length !== expectedSignature.length ||
        !timingSafeEqual(suppliedSignature, expectedSignature)
      ) {
        return null;
      }
      const payload = ProfileTokenPayloadSchema.parse(
        JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as unknown
      );
      if (this.now() >= payload.exp * 1_000) return null;
      return payload.sub;
    } catch {
      return null;
    }
  }
}

/** Intended for tests or an external account-linking service, never a public HTTP route. */
export function createProfileBearerToken(input: {
  profileId: string;
  expiresAtMs: number;
  key: Buffer;
}): string {
  if (input.key.length < 32) throw new Error("QuietBridge authentication key must be at least 32 bytes.");
  const payload = ProfileTokenPayloadSchema.parse({
    sub: input.profileId,
    exp: Math.floor(input.expiresAtMs / 1_000),
    aud: TOKEN_AUDIENCE,
    iss: TOKEN_ISSUER
  });
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${signatureFor(encodedPayload, input.key).toString("base64url")}`;
}
