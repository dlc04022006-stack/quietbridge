import type {
  IsAuthorizedCommand,
  IsAuthorizedCommandOutput
} from "@aws-sdk/client-verifiedpermissions";
import { describe, expect, it } from "vitest";
import { VerifiedPermissionsAudienceAuthorizer } from "./audience-authorizer.js";

describe("Verified Permissions audience authorizer", () => {
  it("hashes the profile ID and sends context metadata without protected values", async () => {
    let captured: IsAuthorizedCommand | undefined;
    const client = {
      async send(command: IsAuthorizedCommand): Promise<IsAuthorizedCommandOutput> {
        captured = command;
        return {
          $metadata: {},
          decision: "ALLOW",
          determiningPolicies: [],
          errors: []
        };
      }
    };
    const authorizer = new VerifiedPermissionsAudienceAuthorizer({
      region: "ap-south-1",
      policyStoreId: "test-policy-store",
      client
    });

    const result = await authorizer.authorize({
      profileId: "alice",
      profileType: "ADULT",
      identityConfidence: 0.99,
      deviceContext: "SHARED",
      ownerMatch: true,
      categories: ["HEALTH", "AUTH_SECRET"],
      unknownFieldPresent: true
    });
    const outbound = JSON.stringify(captured?.input);

    expect(result.decision).toBe("ALLOW");
    expect(outbound).not.toContain("alice");
    expect(outbound).not.toContain("Follow-up plan A");
    expect(outbound).not.toContain("cardiology consultation");
    expect(captured?.input.principal?.entityId).toMatch(/^[a-f0-9]{64}$/);
    expect(captured?.input.context).toMatchObject({
      contextMap: {
        profileType: { string: "ADULT" },
        ownerMatch: { boolean: true }
      }
    });
  });
});
