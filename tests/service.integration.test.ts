import { describe, expect, it } from "vitest";
import { SimulatedCalendarConnector } from "../apps/mcp-server/src/connector.js";
import { QuietBridgeService } from "../apps/mcp-server/src/service.js";

const sharedAlice = {
  profileId: "alice",
  profileType: "ADULT" as const,
  identityConfidence: 0.99,
  deviceContext: "SHARED" as const,
  roomName: "Living Room"
};

describe("QuietBridge service integration", () => {
  it("applies the same privacy layer to a replaceable product connector", async () => {
    const service = new QuietBridgeService({
      connector: {
        async resolve() {
          return {
            source: "Example banking adapter",
            simulatedSource: false,
            recordType: "account-summary",
            record: { status: "found", balance: "$1,234.00", accountNumber: "000123" }
          };
        },
        async deleteRequest() {
          return "CONFIRMED" as const;
        }
      }
    });
    const resolved = await service.resolvePrivateRequest("alice");
    const evaluated = await service.evaluateDisclosure(resolved.requestId, sharedAlice);
    expect(resolved.source).toBe("Example banking adapter");
    expect(resolved.simulatedSource).toBe(false);
    expect(evaluated.decision).toBe("PRIVATE");
    expect(JSON.stringify(evaluated)).not.toContain("$1,234.00");
    expect(JSON.stringify(evaluated)).not.toContain("000123");
  });

  it("completes the protected shared-room flow without leaking fixture secrets", async () => {
    const service = new QuietBridgeService();
    const resolved = await service.resolvePrivateRequest("alice");
    const evaluated = await service.evaluateDisclosure(resolved.requestId, sharedAlice);
    const publicArtifact = JSON.stringify({ resolved, evaluated });

    expect(evaluated.decision).toBe("PRIVATE");
    expect(publicArtifact).not.toContain("QB_SECRET_CONFIRMATION_4K2");
    expect(publicArtifact).not.toContain("QB_SECRET_ACCESS_9P1");
    expect(publicArtifact).not.toContain("cardiology consultation");

    const beforeHandoff = service.getPrivacyReceipt(resolved.requestId, "alice");
    expect(beforeHandoff.destinations).not.toContain("PRIVATE_VIEW");

    const handoff = service.createPrivateHandoff(resolved.requestId, "alice");
    const privateResult = service.consumePrivateHandoff(handoff.token, "alice");
    expect(privateResult.fields.appointmentType).toBe("cardiology consultation");
    expect(privateResult.fields).not.toHaveProperty("confirmationCode");
    expect(privateResult.fields).not.toHaveProperty("accessToken");

    const receipt = service.getPrivacyReceipt(resolved.requestId, "alice");
    expect(JSON.stringify(receipt)).not.toContain("cardiology consultation");
    expect(receipt.categories).toContain("HEALTH");
    expect(receipt.destinations).toContain("PRIVATE_VIEW");
  });

  it("keeps local deletion complete while a connector failure remains visible and retryable", async () => {
    const connector = new SimulatedCalendarConnector("FAILED_RETRYABLE");
    const service = new QuietBridgeService({ connector });
    const request = await service.resolvePrivateRequest("alice");
    await service.evaluateDisclosure(request.requestId, sharedAlice);
    const handoff = service.createPrivateHandoff(request.requestId, "alice");

    const first = await service.deletePrivateRequest(request.requestId, "alice", true);
    expect(first.local).toBe("DELETED");
    expect(first.state).toBe("DOWNSTREAM_FAILED_RETRYABLE");
    expect(service.hasRequest(request.requestId)).toBe(false);
    expect(() => service.consumePrivateHandoff(handoff.token, "alice")).toThrow();

    connector.deletionMode = "CONFIRMED";
    const retry = await service.deletePrivateRequest(request.requestId, "alice", true);
    expect(retry.local).toBe("DELETED");
    expect(retry.state).toBe("DOWNSTREAM_CONFIRMED");
  });

  it("records metadata-only Bedrock assistance without exposing protected values", async () => {
    const observed: Array<{ path: string; source: string; recordType: string }> = [];
    const service = new QuietBridgeService({
      classificationAssistant: {
        async classify(input) {
          observed.push(input);
          return {
            category: "HEALTH",
            confidence: 0.95,
            provider: "AWS_BEDROCK",
            modelId: "amazon.nova-micro-v1:0"
          };
        }
      }
    });
    const request = await service.resolvePrivateRequest("alice");
    const evaluation = await service.evaluateDisclosure(request.requestId, sharedAlice);
    const receipt = service.getPrivacyReceipt(request.requestId, "alice");

    expect(observed).toEqual([
      {
        path: "carePlanReference",
        source: "QuietBridge simulated calendar adapter",
        recordType: "appointment"
      }
    ]);
    expect(evaluation.classificationAssist).toMatchObject({
      used: true,
      assistedPaths: ["carePlanReference"],
      valuesSent: false
    });
    expect(receipt.processing.classificationAssist).toEqual(evaluation.classificationAssist);
    expect(JSON.stringify({ observed, receipt })).not.toContain("Follow-up plan A");
  });

  it("lets external authorization restrict but never relax the local decision", async () => {
    const service = new QuietBridgeService({
      audienceAuthorizer: {
        async authorize() {
          return { decision: "DENY", provider: "AWS_VERIFIED_PERMISSIONS" };
        }
      }
    });
    const request = await service.resolvePrivateRequest("alice");
    const evaluation = await service.evaluateDisclosure(request.requestId, sharedAlice);
    const receipt = service.getPrivacyReceipt(request.requestId, "alice");

    expect(evaluation.decision).toBe("BLOCKED");
    expect(evaluation.reasons).toContain("EXTERNAL_POLICY_DENY");
    expect(evaluation.authorization).toMatchObject({
      attempted: true,
      used: true,
      decision: "DENY",
      valuesSent: false,
      principalIdHashed: true
    });
    expect(receipt.processing.authorization).toEqual(evaluation.authorization);
    expect(() => service.createPrivateHandoff(request.requestId, "alice")).toThrow(
      "HANDOFF_NOT_AVAILABLE"
    );
  });
});
