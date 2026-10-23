import { z } from "zod";

export const SensitivityCategorySchema = z.enum([
  "PUBLIC",
  "PERSONAL",
  "FINANCIAL",
  "HEALTH",
  "AUTH_SECRET"
]);
export type SensitivityCategory = z.infer<typeof SensitivityCategorySchema>;

export const DisclosureDecisionSchema = z.enum([
  "PUBLIC",
  "REDACTED",
  "PRIVATE",
  "BLOCKED"
]);
export type DisclosureDecision = z.infer<typeof DisclosureDecisionSchema>;

export const ProfileTypeSchema = z.enum(["ADULT", "CHILD", "GUEST", "UNKNOWN"]);
export type ProfileType = z.infer<typeof ProfileTypeSchema>;

export const DeviceContextSchema = z.enum(["SHARED", "PRIVATE"]);
export type DeviceContext = z.infer<typeof DeviceContextSchema>;

export const AudienceContextSchema = z.object({
  profileId: z.string().min(1).max(100),
  profileType: ProfileTypeSchema,
  identityConfidence: z.number().min(0).max(1),
  deviceContext: DeviceContextSchema,
  roomName: z.string().min(1).max(100)
});
export type AudienceContext = z.infer<typeof AudienceContextSchema>;

export const SensitiveFieldSchema = z.object({
  path: z.string().min(1),
  value: z.string(),
  category: SensitivityCategorySchema,
  source: z.string().min(1)
});
export type SensitiveField = z.infer<typeof SensitiveFieldSchema>;

export const PolicyReasonSchema = z.enum([
  "ONLY_PUBLIC_DATA",
  "PERSONAL_DATA",
  "HEALTH_DATA",
  "FINANCIAL_DATA",
  "AUTH_SECRET_REMOVED",
  "SHARED_DEVICE",
  "PRIVATE_DEVICE",
  "IDENTITY_UNVERIFIED",
  "CHILD_OR_GUEST",
  "UNKNOWN_FIELD_FAIL_CLOSED",
  "EXTERNAL_POLICY_DENY",
  "EXTERNAL_POLICY_UNAVAILABLE"
]);
export type PolicyReason = z.infer<typeof PolicyReasonSchema>;

export interface PolicyResult {
  decision: DisclosureDecision;
  reasons: PolicyReason[];
  excludedPaths: string[];
}

export interface RoutedOutput {
  decision: DisclosureDecision;
  spokenText: string;
  visualText: string;
  publicFields: SensitiveField[];
  privateFields: SensitiveField[];
  excludedPaths: string[];
}

export interface ClassificationAssistTrace {
  used: boolean;
  provider: "AWS_BEDROCK" | null;
  modelId: string | null;
  assistedPaths: string[];
  failedPaths: string[];
  valuesSent: false;
}

export interface AuthorizationTrace {
  attempted: boolean;
  used: boolean;
  provider: "AWS_VERIFIED_PERMISSIONS" | null;
  decision: "ALLOW" | "DENY" | null;
  failed: boolean;
  valuesSent: false;
  principalIdHashed: true;
}

export const ConnectorDeletionStatusSchema = z.enum([
  "CONFIRMED",
  "FAILED_RETRYABLE",
  "UNSUPPORTED",
  "NOT_ATTEMPTED"
]);
export type ConnectorDeletionStatus = z.infer<typeof ConnectorDeletionStatusSchema>;

export interface PrivacyReceipt {
  receiptId: string;
  requestId: string;
  createdAt: string;
  source: string;
  simulatedSource: boolean;
  profileId: string;
  categories: SensitivityCategory[];
  decision: DisclosureDecision;
  reasons: PolicyReason[];
  destinations: Array<"PUBLIC_VOICE" | "PUBLIC_VISUAL" | "PRIVATE_VIEW" | "NONE">;
  privateHandoffExpiresAt: string | null;
  processing: {
    classificationAssist: ClassificationAssistTrace;
    authorization: AuthorizationTrace;
  };
  deletion: {
    local: "ACTIVE" | "DELETED" | "NOT_FOUND";
    connector: ConnectorDeletionStatus;
  };
}

export interface DeletionResult {
  requestId: string;
  state:
    | "CONFIRM_REQUIRED"
    | "DOWNSTREAM_CONFIRMED"
    | "DOWNSTREAM_FAILED_RETRYABLE"
    | "DOWNSTREAM_UNSUPPORTED";
  local: "NOT_DELETED" | "DELETED" | "NOT_FOUND";
  handoffsRevoked: number;
  connector: ConnectorDeletionStatus;
  message: string;
}
