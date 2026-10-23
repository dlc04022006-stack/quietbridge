import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { EncryptedFileHandoffStore } from "./encrypted-file-handoff.js";
import { HandoffError } from "./handoff.js";

const fixtureFields = [
  {
    path: "appointmentType",
    value: "QB_SECRET_HEALTH_PERSISTED",
    category: "HEALTH" as const,
    source: "simulated calendar"
  },
  {
    path: "accessToken",
    value: "QB_SECRET_AUTH_NEVER_STORED",
    category: "AUTH_SECRET" as const,
    source: "simulated calendar"
  }
];

const directories: string[] = [];

function temporaryStore(now: () => number = () => 1_000) {
  const directory = mkdtempSync(join(tmpdir(), "quietbridge-handoff-"));
  directories.push(directory);
  return {
    directory,
    path: join(directory, "handoffs.enc.json"),
    key: randomBytes(32),
    now
  };
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function expectHandoffCode(action: () => unknown, code: HandoffError["code"]): void {
  try {
    action();
    throw new Error("Expected handoff action to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(HandoffError);
    expect((error as HandoffError).code).toBe(code);
  }
}

describe("EncryptedFileHandoffStore", () => {
  it("survives restart without writing protected values or raw tokens to disk", () => {
    const fixture = temporaryStore();
    const first = new EncryptedFileHandoffStore({
      filePath: fixture.path,
      key: fixture.key,
      now: fixture.now
    });
    const created = first.create({ requestId: "request-1", profileId: "alice", fields: fixtureFields });
    const diskText = readFileSync(fixture.path, "utf8");

    expect(diskText).not.toContain(created.token);
    expect(diskText).not.toContain("QB_SECRET_HEALTH_PERSISTED");
    expect(diskText).not.toContain("QB_SECRET_AUTH_NEVER_STORED");

    const restarted = new EncryptedFileHandoffStore({
      filePath: fixture.path,
      key: fixture.key,
      now: fixture.now
    });
    const consumed = restarted.consume(created.token, "alice");
    expect(consumed.fields.map((field) => field.path)).toEqual(["appointmentType"]);
    expect(consumed.fields[0]?.value).toBe("QB_SECRET_HEALTH_PERSISTED");

    const restartedAgain = new EncryptedFileHandoffStore({
      filePath: fixture.path,
      key: fixture.key,
      now: fixture.now
    });
    expect(() => restartedAgain.consume(created.token, "alice")).toThrowError(HandoffError);
  });

  it("preserves profile binding, expiry, and revocation across restarts", () => {
    let time = 2_000;
    const fixture = temporaryStore(() => time);
    const store = new EncryptedFileHandoffStore({
      filePath: fixture.path,
      key: fixture.key,
      ttlMs: 100,
      now: fixture.now
    });
    const wrongProfile = store.create({
      requestId: "request-profile",
      profileId: "alice",
      fields: fixtureFields
    });
    expectHandoffCode(() => store.consume(wrongProfile.token, "bob"), "WRONG_PROFILE");

    const expired = store.create({ requestId: "request-expired", profileId: "alice", fields: fixtureFields });
    time = 2_100;
    expectHandoffCode(() => store.consume(expired.token, "alice"), "EXPIRED");

    const revoked = store.create({ requestId: "request-revoked", profileId: "alice", fields: fixtureFields });
    expect(store.revokeRequest("request-revoked")).toBe(1);
    const restarted = new EncryptedFileHandoffStore({
      filePath: fixture.path,
      key: fixture.key,
      now: fixture.now
    });
    expectHandoffCode(() => restarted.consume(revoked.token, "alice"), "INVALID");
  });

  it("fails closed when ciphertext is tampered with or the key is wrong", () => {
    const fixture = temporaryStore();
    const store = new EncryptedFileHandoffStore({
      filePath: fixture.path,
      key: fixture.key,
      now: fixture.now
    });
    store.create({ requestId: "request-1", profileId: "alice", fields: fixtureFields });

    expect(
      () =>
        new EncryptedFileHandoffStore({
          filePath: fixture.path,
          key: randomBytes(32),
          now: fixture.now
        })
    ).toThrow("HANDOFF_STORE_UNAVAILABLE");

    const envelope = JSON.parse(readFileSync(fixture.path, "utf8")) as { ciphertext: string };
    envelope.ciphertext = `${envelope.ciphertext.slice(0, -2)}AA`;
    writeFileSync(fixture.path, JSON.stringify(envelope));
    expect(
      () =>
        new EncryptedFileHandoffStore({
          filePath: fixture.path,
          key: fixture.key,
          now: fixture.now
        })
    ).toThrow("HANDOFF_STORE_UNAVAILABLE");
  });
});
