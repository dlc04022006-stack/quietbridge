import type {
  AudienceContext,
  AuthorizationTrace,
  PolicyResult,
  SensitivityCategory
} from "../../contracts/src/index.js";

export interface AudienceAuthorizationInput {
  profileId: string;
  profileType: AudienceContext["profileType"];
  identityConfidence: number;
  deviceContext: AudienceContext["deviceContext"];
  ownerMatch: boolean;
  categories: SensitivityCategory[];
  unknownFieldPresent: boolean;
}

export interface AudienceAuthorizationResult {
  decision: "ALLOW" | "DENY";
  provider: "AWS_VERIFIED_PERMISSIONS";
}

export interface AudienceAuthorizer {
  authorize(input: AudienceAuthorizationInput): Promise<AudienceAuthorizationResult>;
}

export interface AuthorizedPolicyResult {
  policy: PolicyResult;
  trace: AuthorizationTrace;
}

const emptyTrace = (): AuthorizationTrace => ({
  attempted: false,
  used: false,
  provider: null,
  decision: null,
  failed: false,
  valuesSent: false,
  principalIdHashed: true
});

export async function restrictPolicyWithAuthorizer(
  localPolicy: PolicyResult,
  input: AudienceAuthorizationInput,
  authorizer?: AudienceAuthorizer
): Promise<AuthorizedPolicyResult> {
  const trace = emptyTrace();
  const containsProtectedData = input.categories.some((category) => category !== "PUBLIC");
  if (!authorizer || !containsProtectedData || localPolicy.decision === "BLOCKED") {
    return { policy: localPolicy, trace };
  }

  trace.attempted = true;
  try {
    const result = await authorizer.authorize(input);
    trace.used = true;
    trace.provider = result.provider;
    trace.decision = result.decision;
    if (result.decision === "ALLOW") return { policy: localPolicy, trace };

    return {
      policy: {
        decision: "BLOCKED",
        reasons: [...new Set([...localPolicy.reasons, "EXTERNAL_POLICY_DENY" as const])],
        excludedPaths: [...localPolicy.excludedPaths]
      },
      trace
    };
  } catch {
    trace.failed = true;
    return {
      policy: {
        decision: "BLOCKED",
        reasons: [...new Set([...localPolicy.reasons, "EXTERNAL_POLICY_UNAVAILABLE" as const])],
        excludedPaths: [...localPolicy.excludedPaths]
      },
      trace
    };
  }
}
