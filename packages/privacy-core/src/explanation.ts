import type { PolicyReason } from "../../contracts/src/index.js";

export function explainPrivacyDecision(reasons: readonly PolicyReason[]): string {
  const dataType = reasons.includes("HEALTH_DATA")
    ? "health information"
    : reasons.includes("FINANCIAL_DATA")
      ? "financial information"
      : reasons.includes("PERSONAL_DATA") || reasons.includes("UNKNOWN_FIELD_FAIL_CLOSED")
        ? "personal information"
        : "information";

  if (reasons.includes("EXTERNAL_POLICY_UNAVAILABLE")) {
    return `I kept the ${dataType} blocked because the authorization service was unavailable.`;
  }
  if (reasons.includes("EXTERNAL_POLICY_DENY")) {
    return `I kept the ${dataType} blocked because the authorization policy did not allow this request.`;
  }

  if (reasons.includes("IDENTITY_UNVERIFIED")) {
    return `I protected the ${dataType} because I could not verify an allowed profile.`;
  }
  if (reasons.includes("CHILD_OR_GUEST")) {
    return `I protected the ${dataType} because this profile is not allowed to receive the requested details.`;
  }
  if (reasons.includes("SHARED_DEVICE")) {
    return `The result contains ${dataType}, and this device is shared, so I kept the details private.`;
  }
  if (reasons.includes("PRIVATE_DEVICE")) {
    return `The profile was verified on a private device, so the requested ${dataType} could be provided.`;
  }
  return "The result contained only information that the current policy allows here.";
}
