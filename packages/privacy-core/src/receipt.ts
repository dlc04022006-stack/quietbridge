import { randomUUID } from "node:crypto";
import type {
  AudienceContext,
  AuthorizationTrace,
  ClassificationAssistTrace,
  PolicyResult,
  PrivacyReceipt,
  RoutedOutput,
  SensitiveField
} from "../../contracts/src/index.js";
import { categoriesIn } from "./sensitivity.js";

export function createPrivacyReceipt(input: {
  requestId: string;
  source: string;
  simulatedSource: boolean;
  audience: AudienceContext;
  fields: readonly SensitiveField[];
  policy: PolicyResult;
  routed: RoutedOutput;
  classificationAssist?: ClassificationAssistTrace;
  authorization?: AuthorizationTrace;
  now?: Date;
}): PrivacyReceipt {
  const destinations: PrivacyReceipt["destinations"] = [];
  if (input.routed.spokenText) destinations.push("PUBLIC_VOICE");
  if (input.routed.visualText) destinations.push("PUBLIC_VISUAL");
  if (destinations.length === 0) destinations.push("NONE");

  return {
    receiptId: randomUUID(),
    requestId: input.requestId,
    createdAt: (input.now ?? new Date()).toISOString(),
    source: input.source,
    simulatedSource: input.simulatedSource,
    profileId: input.audience.profileId,
    categories: categoriesIn(input.fields),
    decision: input.policy.decision,
    reasons: [...input.policy.reasons],
    destinations,
    privateHandoffExpiresAt: null,
    processing: {
      classificationAssist: input.classificationAssist ?? {
        used: false,
        provider: null,
        modelId: null,
        assistedPaths: [],
        failedPaths: [],
        valuesSent: false
      },
      authorization: input.authorization ?? {
        attempted: false,
        used: false,
        provider: null,
        decision: null,
        failed: false,
        valuesSent: false,
        principalIdHashed: true
      }
    },
    deletion: { local: "ACTIVE", connector: "NOT_ATTEMPTED" }
  };
}
