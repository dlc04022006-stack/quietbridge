import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandOutput
} from "@aws-sdk/client-bedrock-runtime";
import { z } from "zod";
import type {
  MetadataClassificationAssistant,
  MetadataClassificationInput,
  MetadataClassificationSuggestion
} from "../../privacy-core/src/sensitivity.js";

const ModelResponseSchema = z.object({
  category: z.enum(["PERSONAL", "FINANCIAL", "HEALTH", "AUTH_SECRET"]),
  confidence: z.number().min(0).max(1)
});

interface BedrockSender {
  send(command: ConverseCommand): Promise<ConverseCommandOutput>;
}

export class BedrockMetadataClassifier implements MetadataClassificationAssistant {
  readonly modelId: string;
  private readonly client: BedrockSender;

  constructor(options: { region: string; modelId: string; client?: BedrockSender }) {
    this.modelId = options.modelId;
    this.client = options.client ?? new BedrockRuntimeClient({ region: options.region });
  }

  async classify(input: MetadataClassificationInput): Promise<MetadataClassificationSuggestion> {
    const command = new ConverseCommand({
      modelId: this.modelId,
      system: [
        {
          text:
            "Classify data-field metadata for privacy routing. You receive no field value. Choose the most protective plausible category. Never output PUBLIC. Return only one JSON object with category and confidence, with no markdown or preamble. category must be PERSONAL, FINANCIAL, HEALTH, or AUTH_SECRET; confidence must be a number from 0 to 1."
        }
      ],
      messages: [
        {
          role: "user",
          content: [{ text: JSON.stringify(input) }]
        }
      ],
      inferenceConfig: { maxTokens: 80, temperature: 0 }
    });

    const response = await this.client.send(command);
    const text = response.output?.message?.content?.find((block) => "text" in block)?.text;
    if (!text) throw new Error("BEDROCK_EMPTY_RESPONSE");
    const parsed = ModelResponseSchema.parse(JSON.parse(text));

    return {
      ...parsed,
      provider: "AWS_BEDROCK",
      modelId: this.modelId
    };
  }
}
