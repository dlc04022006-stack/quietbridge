import { randomUUID } from "node:crypto";
import type {
  AudienceContext,
  PolicyResult,
  PrivacyReceipt,
  RoutedOutput,
  SensitiveField
} from "../../../packages/contracts/src/index.js";
import {
  createPrivacyReceipt,
  DeletionCoordinator,
  evaluateAudiencePolicy,
  explainPrivacyDecision,
  HandoffError,
  type HandoffStore,
  InMemoryHandoffStore,
  routeOutput,
  classifyStructuredRecordWithAssistant,
  categoriesIn,
  restrictPolicyWithAuthorizer,
  type AudienceAuthorizer,
  type LocalRequestStore,
  type MetadataClassificationAssistant
} from "../../../packages/privacy-core/src/index.js";
import {
  SimulatedCalendarConnector,
  type ProtectedRecordConnector
} from "./connector.js";

interface StoredRequest {
  requestId: string;
  ownerProfileId: string;
  source: string;
  simulatedSource: boolean;
  recordType: string;
  record: Record<string, string>;
  evaluation: {
    audience: AudienceContext;
    fields: SensitiveField[];
    policy: PolicyResult;
    routed: RoutedOutput;
    explanation: string;
    receipt: PrivacyReceipt;
  } | null;
}

export class QuietBridgeService implements LocalRequestStore {
  private readonly requests = new Map<string, StoredRequest>();
  private readonly requestOwners = new Map<string, string>();
  readonly handoffs: HandoffStore;
  readonly connector: ProtectedRecordConnector;
  readonly deletion: DeletionCoordinator;
  private readonly classificationAssistant: MetadataClassificationAssistant | undefined;
  private readonly audienceAuthorizer: AudienceAuthorizer | undefined;

  constructor(options?: {
    handoffTtlMs?: number;
    handoffStore?: HandoffStore;
    now?: () => number;
    connector?: ProtectedRecordConnector;
    classificationAssistant?: MetadataClassificationAssistant;
    audienceAuthorizer?: AudienceAuthorizer;
  }) {
    this.handoffs =
      options?.handoffStore ?? new InMemoryHandoffStore(options?.handoffTtlMs, options?.now);
    this.connector = options?.connector ?? new SimulatedCalendarConnector();
    this.classificationAssistant = options?.classificationAssistant;
    this.audienceAuthorizer = options?.audienceAuthorizer;
    this.deletion = new DeletionCoordinator(this, this.handoffs, this.connector);
  }

  async resolvePrivateRequest(profileId: string): Promise<{
    requestId: string;
    source: string;
    simulatedSource: boolean;
    message: string;
  }> {
    const requestId = randomUUID();
    const resolved = await this.connector.resolve(profileId);
    this.requests.set(requestId, {
      requestId,
      ownerProfileId: profileId,
      source: resolved.source,
      simulatedSource: resolved.simulatedSource,
      recordType: resolved.recordType,
      record: { ...resolved.record },
      evaluation: null
    });
    this.requestOwners.set(requestId, profileId);

    return {
      requestId,
      source: resolved.source,
      simulatedSource: resolved.simulatedSource,
      message: "The protected record was retrieved and is being held server-side for privacy evaluation."
    };
  }

  async evaluateDisclosure(requestId: string, audience: AudienceContext) {
    const request = this.requireRequest(requestId);
    const classification = await classifyStructuredRecordWithAssistant(
      request.record,
      request.source,
      request.recordType,
      this.classificationAssistant
    );
    const localPolicy = evaluateAudiencePolicy({
      fields: classification.fields,
      audience,
      resourceOwnerProfileId: request.ownerProfileId,
      unknownPaths: classification.unknownPaths
    });
    const authorization = await restrictPolicyWithAuthorizer(
      localPolicy,
      {
        profileId: audience.profileId,
        profileType: audience.profileType,
        identityConfidence: audience.identityConfidence,
        deviceContext: audience.deviceContext,
        ownerMatch: audience.profileId === request.ownerProfileId,
        categories: categoriesIn(classification.fields),
        unknownFieldPresent: classification.unknownPaths.length > 0
      },
      this.audienceAuthorizer
    );
    const policy = authorization.policy;
    const routed = routeOutput(classification.fields, policy);
    const explanation = explainPrivacyDecision(policy.reasons);
    const receipt = createPrivacyReceipt({
      requestId,
      source: request.source,
      simulatedSource: request.simulatedSource,
      audience,
      fields: classification.fields,
      policy,
      routed,
      classificationAssist: classification.assistTrace,
      authorization: authorization.trace
    });

    request.evaluation = {
      audience,
      fields: classification.fields,
      policy,
      routed,
      explanation,
      receipt
    };

    return {
      requestId,
      decision: policy.decision,
      reasons: policy.reasons,
      spokenText: routed.spokenText,
      visualText: routed.visualText,
      explanation,
      privateDeliveryAvailable: routed.privateFields.length > 0,
      excludedPaths: routed.excludedPaths,
      receiptId: receipt.receiptId,
      classificationAssist: classification.assistTrace,
      authorization: authorization.trace
    };
  }

  createPrivateHandoff(requestId: string, profileId: string) {
    const request = this.requireRequest(requestId);
    const evaluation = this.requireEvaluation(request);
    if (request.ownerProfileId !== profileId || evaluation.audience.profileId !== profileId) {
      throw new Error("HANDOFF_NOT_ALLOWED");
    }
    if (evaluation.policy.decision !== "PRIVATE" || evaluation.routed.privateFields.length === 0) {
      throw new Error("HANDOFF_NOT_AVAILABLE");
    }

    const handoff = this.handoffs.create({
      requestId,
      profileId,
      fields: evaluation.routed.privateFields
    });
    evaluation.receipt.privateHandoffExpiresAt = handoff.expiresAt;
    if (!evaluation.receipt.destinations.includes("PRIVATE_VIEW")) {
      evaluation.receipt.destinations.push("PRIVATE_VIEW");
    }
    return {
      requestId,
      token: handoff.token,
      expiresAt: handoff.expiresAt,
      simulatedPrivateView: true
    };
  }

  consumePrivateHandoff(token: string, profileId: string) {
    const consumed = this.handoffs.consume(token, profileId);
    return {
      requestId: consumed.requestId,
      fields: Object.fromEntries(consumed.fields.map((field) => [field.path, field.value])),
      message: "Private details released to the bound simulated profile."
    };
  }

  getPrivacyReceipt(requestId: string, profileId: string): PrivacyReceipt {
    const request = this.requireRequest(requestId);
    if (request.ownerProfileId !== profileId) throw new Error("RECEIPT_NOT_AVAILABLE");
    const evaluation = this.requireEvaluation(request);
    return structuredClone(evaluation.receipt);
  }

  async deletePrivateRequest(requestId: string, profileId: string, confirmed: boolean) {
    const ownerProfileId = this.requestOwners.get(requestId);
    if (ownerProfileId !== undefined && ownerProfileId !== profileId) {
      throw new Error("DELETE_NOT_ALLOWED");
    }
    return this.deletion.deleteRequest(requestId, confirmed);
  }

  deleteRequest(requestId: string): boolean {
    return this.requests.delete(requestId);
  }

  hasRequest(requestId: string): boolean {
    return this.requests.has(requestId);
  }

  private requireRequest(requestId: string): StoredRequest {
    const request = this.requests.get(requestId);
    if (!request) throw new Error("REQUEST_NOT_AVAILABLE");
    return request;
  }

  private requireEvaluation(request: StoredRequest): NonNullable<StoredRequest["evaluation"]> {
    if (!request.evaluation) throw new Error("EVALUATION_REQUIRED");
    return request.evaluation;
  }
}

export function safePrivateHandoffError(error: unknown): { status: number; message: string } {
  if (error instanceof HandoffError) {
    if (error.code === "EXPIRED") return { status: 410, message: "This private handoff has expired." };
    if (error.code === "ALREADY_USED") {
      return { status: 409, message: "This private handoff has already been used." };
    }
  }
  return { status: 403, message: "This private handoff is unavailable." };
}
