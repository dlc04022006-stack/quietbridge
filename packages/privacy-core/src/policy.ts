import type {
  AudienceContext,
  PolicyReason,
  PolicyResult,
  SensitiveField,
  SensitivityCategory
} from "../../contracts/src/index.js";

const IDENTITY_CONFIDENCE_THRESHOLD = 0.8;

function hasCategory(fields: readonly SensitiveField[], category: SensitivityCategory): boolean {
  return fields.some((field) => field.category === category);
}

function addDataReasons(fields: readonly SensitiveField[], reasons: Set<PolicyReason>): void {
  if (hasCategory(fields, "PERSONAL")) reasons.add("PERSONAL_DATA");
  if (hasCategory(fields, "HEALTH")) reasons.add("HEALTH_DATA");
  if (hasCategory(fields, "FINANCIAL")) reasons.add("FINANCIAL_DATA");
  if (hasCategory(fields, "AUTH_SECRET")) reasons.add("AUTH_SECRET_REMOVED");
}

export function evaluateAudiencePolicy(input: {
  fields: readonly SensitiveField[];
  audience: AudienceContext;
  resourceOwnerProfileId?: string;
  unknownPaths?: readonly string[];
}): PolicyResult {
  const { fields, audience } = input;
  const reasons = new Set<PolicyReason>();
  addDataReasons(fields, reasons);

  if ((input.unknownPaths?.length ?? 0) > 0) {
    reasons.add("UNKNOWN_FIELD_FAIL_CLOSED");
  }

  const revealableFields = fields.filter((field) => field.category !== "AUTH_SECRET");
  // AUTH_SECRET is never revealable, but its presence must still force an
  // audience check rather than making a secret-only record look public.
  const containsNonPublic = fields.some((field) => field.category !== "PUBLIC");
  const excludedPaths = fields
    .filter((field) => field.category === "AUTH_SECRET")
    .map((field) => field.path);

  if (!containsNonPublic) {
    reasons.add("ONLY_PUBLIC_DATA");
    return { decision: "PUBLIC", reasons: [...reasons], excludedPaths };
  }

  const unverified =
    audience.profileType === "UNKNOWN" ||
    audience.identityConfidence < IDENTITY_CONFIDENCE_THRESHOLD ||
    (input.resourceOwnerProfileId !== undefined &&
      audience.profileId !== input.resourceOwnerProfileId);
  const restrictedProfile = audience.profileType === "CHILD" || audience.profileType === "GUEST";

  if (unverified || restrictedProfile) {
    reasons.add(unverified ? "IDENTITY_UNVERIFIED" : "CHILD_OR_GUEST");
    return { decision: "BLOCKED", reasons: [...reasons], excludedPaths };
  }

  if (audience.deviceContext === "SHARED") {
    reasons.add("SHARED_DEVICE");
    const highSensitivity =
      hasCategory(revealableFields, "HEALTH") || hasCategory(revealableFields, "FINANCIAL");
    return {
      decision: highSensitivity ? "PRIVATE" : "REDACTED",
      reasons: [...reasons],
      excludedPaths
    };
  }

  reasons.add("PRIVATE_DEVICE");
  return { decision: "PUBLIC", reasons: [...reasons], excludedPaths };
}
