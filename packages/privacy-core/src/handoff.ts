import { createHash, randomBytes } from "node:crypto";
import type { SensitiveField } from "../../contracts/src/index.js";

interface HandoffRecord {
  requestId: string;
  profileId: string;
  fields: SensitiveField[];
  expiresAtMs: number;
  consumedAtMs: number | null;
}

export interface HandoffStore {
  create(input: { requestId: string; profileId: string; fields: readonly SensitiveField[] }): {
    token: string;
    expiresAt: string;
  };
  consume(token: string, profileId: string): { requestId: string; fields: SensitiveField[] };
  revokeRequest(requestId: string): number;
}

export type HandoffErrorCode = "INVALID" | "WRONG_PROFILE" | "EXPIRED" | "ALREADY_USED";

export class HandoffError extends Error {
  constructor(public readonly code: HandoffErrorCode) {
    super("The private handoff is unavailable.");
  }
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export class InMemoryHandoffStore implements HandoffStore {
  private readonly records = new Map<string, HandoffRecord>();

  constructor(
    private readonly ttlMs = 120_000,
    private readonly now: () => number = () => Date.now()
  ) {}

  create(input: { requestId: string; profileId: string; fields: readonly SensitiveField[] }): {
    token: string;
    expiresAt: string;
  } {
    const token = randomBytes(32).toString("base64url");
    const expiresAtMs = this.now() + this.ttlMs;
    this.records.set(tokenHash(token), {
      requestId: input.requestId,
      profileId: input.profileId,
      // Enforce the never-reveal boundary again even if an upstream router is misused.
      fields: input.fields
        .filter((field) => field.category !== "AUTH_SECRET")
        .map((field) => ({ ...field })),
      expiresAtMs,
      consumedAtMs: null
    });
    return { token, expiresAt: new Date(expiresAtMs).toISOString() };
  }

  consume(token: string, profileId: string): { requestId: string; fields: SensitiveField[] } {
    const record = this.records.get(tokenHash(token));
    if (!record) throw new HandoffError("INVALID");
    if (record.profileId !== profileId) throw new HandoffError("WRONG_PROFILE");
    if (this.now() >= record.expiresAtMs) throw new HandoffError("EXPIRED");
    if (record.consumedAtMs !== null) throw new HandoffError("ALREADY_USED");

    // No await occurs between the check and mutation, so only one JavaScript task can win.
    record.consumedAtMs = this.now();
    return {
      requestId: record.requestId,
      fields: record.fields.map((field) => ({ ...field }))
    };
  }

  revokeRequest(requestId: string): number {
    let revoked = 0;
    for (const [hash, record] of this.records.entries()) {
      if (record.requestId === requestId) {
        this.records.delete(hash);
        revoked += 1;
      }
    }
    return revoked;
  }
}
