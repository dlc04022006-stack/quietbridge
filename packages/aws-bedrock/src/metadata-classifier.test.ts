import type { ConverseCommand, ConverseCommandOutput } from "@aws-sdk/client-bedrock-runtime";
import { describe, expect, it } from "vitest";
import { BedrockMetadataClassifier } from "./metadata-classifier.js";

describe("Bedrock metadata classifier", () => {
  it("sends metadata only and schema-validates the JSON classification", async () => {
    let captured: ConverseCommand | undefined;
    const client = {
      async send(command: ConverseCommand): Promise<ConverseCommandOutput> {
        captured = command;
        return {
          $metadata: {},
          stopReason: "end_turn",
          usage: { inputTokens: 10, outputTokens: 3, totalTokens: 13 },
          metrics: { latencyMs: 1 },
          output: {
            message: {
              role: "assistant",
              content: [{ text: JSON.stringify({ category: "HEALTH", confidence: 0.97 }) }]
            }
          }
        };
      }
    };
    const classifier = new BedrockMetadataClassifier({
      region: "ap-south-1",
      modelId: "amazon.nova-micro-v1:0",
      client
    });

    const result = await classifier.classify({
      path: "carePlanReference",
      source: "QuietBridge simulated calendar",
      recordType: "appointment"
    });
    const outbound = JSON.stringify(captured?.input);

    expect(result).toEqual({
      category: "HEALTH",
      confidence: 0.97,
      provider: "AWS_BEDROCK",
      modelId: "amazon.nova-micro-v1:0"
    });
    expect(outbound).toContain("carePlanReference");
    expect(captured?.input.outputConfig).toBeUndefined();
    expect(outbound).not.toContain("Follow-up plan A");
    expect(outbound).not.toContain("cardiology consultation");
  });
});
