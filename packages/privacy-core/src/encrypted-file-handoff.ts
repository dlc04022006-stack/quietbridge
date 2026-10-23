import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes
} from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import { SensitiveFieldSchema, type SensitiveField } from "../../contracts/src/index.js";
import { HandoffError, type HandoffStore } from "./handoff.js";

const FORMAT_VERSION = 1;
const AAD = Buffer.from("quietbridge-handoffs-v1", "utf8");

interface PersistedRecord {
  requestId: string;
  profileId: string;
  fields: SensitiveField[];
  expiresAtMs: number;
  consumedAtMs: number | null;
}

interface EncryptedEnvelope {
  version: 1;
  algorithm: "aes-256-gcm";
  iv: string;
  authTag: string;
  ciphertext: string;
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function assertKey(key: Buffer): void {
  if (key.length !== 32) {
    throw new Error("QuietBridge handoff encryption key must contain exactly 32 bytes.");
  }
}

function parseRecords(value: unknown): Map<string, PersistedRecord> {
  if (!Array.isArray(value)) throw new Error("HANDOFF_STORE_UNAVAILABLE");
  const records = new Map<string, PersistedRecord>();
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length !== 2) throw new Error("HANDOFF_STORE_UNAVAILABLE");
    const [hash, candidate] = entry as [unknown, unknown];
    if (
      typeof hash !== "string" ||
      !candidate ||
      typeof candidate !== "object" ||
      typeof (candidate as PersistedRecord).requestId !== "string" ||
      typeof (candidate as PersistedRecord).profileId !== "string" ||
      typeof (candidate as PersistedRecord).expiresAtMs !== "number" ||
      !(
        (candidate as PersistedRecord).consumedAtMs === null ||
        typeof (candidate as PersistedRecord).consumedAtMs === "number"
      ) ||
      !Array.isArray((candidate as PersistedRecord).fields)
    ) {
      throw new Error("HANDOFF_STORE_UNAVAILABLE");
    }
    const fields = (candidate as PersistedRecord).fields.map((field) =>
      SensitiveFieldSchema.parse(field)
    );
    records.set(hash, { ...(candidate as PersistedRecord), fields });
  }
  return records;
}

/**
 * Single-process, encrypted, file-backed handoff storage for free local demos.
 * Only token hashes are persisted; AES-GCM detects an incorrect key or file tampering.
 */
export class EncryptedFileHandoffStore implements HandoffStore {
  private readonly records: Map<string, PersistedRecord>;
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(options: {
    filePath: string;
    key: Buffer;
    ttlMs?: number;
    now?: () => number;
  }) {
    assertKey(options.key);
    this.filePath = options.filePath;
    this.key = Buffer.from(options.key);
    this.ttlMs = options.ttlMs ?? 120_000;
    this.now = options.now ?? (() => Date.now());
    this.records = this.load();
  }

  private readonly filePath: string;
  private readonly key: Buffer;

  create(input: { requestId: string; profileId: string; fields: readonly SensitiveField[] }): {
    token: string;
    expiresAt: string;
  } {
    const token = randomBytes(32).toString("base64url");
    const expiresAtMs = this.now() + this.ttlMs;
    this.records.set(tokenHash(token), {
      requestId: input.requestId,
      profileId: input.profileId,
      fields: input.fields
        .filter((field) => field.category !== "AUTH_SECRET")
        .map((field) => ({ ...field })),
      expiresAtMs,
      consumedAtMs: null
    });
    this.persist();
    return { token, expiresAt: new Date(expiresAtMs).toISOString() };
  }

  consume(token: string, profileId: string): { requestId: string; fields: SensitiveField[] } {
    const record = this.records.get(tokenHash(token));
    if (!record) throw new HandoffError("INVALID");
    if (record.profileId !== profileId) throw new HandoffError("WRONG_PROFILE");
    if (this.now() >= record.expiresAtMs) throw new HandoffError("EXPIRED");
    if (record.consumedAtMs !== null) throw new HandoffError("ALREADY_USED");

    record.consumedAtMs = this.now();
    this.persist();
    return {
      requestId: record.requestId,
      fields: record.fields.map((field) => ({ ...field }))
    };
  }

  revokeRequest(requestId: string): number {
    let revoked = 0;
    for (const [hash, record] of this.records) {
      if (record.requestId === requestId) {
        this.records.delete(hash);
        revoked += 1;
      }
    }
    if (revoked > 0) this.persist();
    return revoked;
  }

  private load(): Map<string, PersistedRecord> {
    if (!existsSync(this.filePath)) return new Map();
    try {
      const envelope = JSON.parse(readFileSync(this.filePath, "utf8")) as EncryptedEnvelope;
      if (
        envelope.version !== FORMAT_VERSION ||
        envelope.algorithm !== "aes-256-gcm" ||
        typeof envelope.iv !== "string" ||
        typeof envelope.authTag !== "string" ||
        typeof envelope.ciphertext !== "string"
      ) {
        throw new Error("HANDOFF_STORE_UNAVAILABLE");
      }
      const decipher = createDecipheriv(
        "aes-256-gcm",
        this.key,
        Buffer.from(envelope.iv, "base64")
      );
      decipher.setAAD(AAD);
      decipher.setAuthTag(Buffer.from(envelope.authTag, "base64"));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(envelope.ciphertext, "base64")),
        decipher.final()
      ]);
      return parseRecords(JSON.parse(plaintext.toString("utf8")) as unknown);
    } catch {
      throw new Error("HANDOFF_STORE_UNAVAILABLE");
    }
  }

  private persist(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    cipher.setAAD(AAD);
    const plaintext = Buffer.from(JSON.stringify([...this.records]), "utf8");
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const envelope: EncryptedEnvelope = {
      version: FORMAT_VERSION,
      algorithm: "aes-256-gcm",
      iv: iv.toString("base64"),
      authTag: cipher.getAuthTag().toString("base64"),
      ciphertext: ciphertext.toString("base64")
    };
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    try {
      writeFileSync(temporaryPath, JSON.stringify(envelope), { encoding: "utf8", mode: 0o600 });
      renameSync(temporaryPath, this.filePath);
    } catch (error) {
      rmSync(temporaryPath, { force: true });
      throw error;
    }
  }
}
