import type { PolicyResult, RoutedOutput, SensitiveField } from "../../contracts/src/index.js";

function fieldValue(fields: readonly SensitiveField[], path: string): string | undefined {
  return fields.find((field) => field.path === path)?.value;
}

function buildAllowedSpeech(fields: readonly SensitiveField[]): string {
  const type = fieldValue(fields, "appointmentType");
  const provider = fieldValue(fields, "provider");
  const startsAt = fieldValue(fields, "startsAt");
  const location = fieldValue(fields, "location");

  if (type && startsAt) {
    const providerPhrase = provider ? ` with ${provider}` : "";
    const locationPhrase = location ? ` at ${location}` : "";
    return `Your ${type} appointment${providerPhrase} is ${startsAt}${locationPhrase}.`;
  }

  const safeStatus = fieldValue(fields, "status");
  return safeStatus ? `The request status is ${safeStatus}.` : "I found the requested information.";
}

export function routeOutput(fields: readonly SensitiveField[], policy: PolicyResult): RoutedOutput {
  const neverReveal = new Set(policy.excludedPaths);
  const revealable = fields.filter((field) => !neverReveal.has(field.path));

  switch (policy.decision) {
    case "PUBLIC":
      return {
        decision: policy.decision,
        spokenText: buildAllowedSpeech(revealable),
        visualText: buildAllowedSpeech(revealable),
        publicFields: revealable,
        privateFields: [],
        excludedPaths: [...neverReveal]
      };
    case "REDACTED":
      return {
        decision: policy.decision,
        spokenText: "I found a result, but I left out personal details because this is a shared device.",
        visualText: "Personal details withheld on this shared device.",
        publicFields: revealable.filter((field) => field.category === "PUBLIC"),
        privateFields: revealable.filter((field) => field.category !== "PUBLIC"),
        excludedPaths: [...neverReveal]
      };
    case "PRIVATE":
      return {
        decision: policy.decision,
        spokenText: "I found it, but I won't say the details in this shared space. I can make them available privately.",
        visualText: "Sensitive details withheld. Private delivery is available.",
        publicFields: [],
        privateFields: revealable,
        excludedPaths: [...neverReveal]
      };
    case "BLOCKED":
      return {
        decision: policy.decision,
        spokenText: "I can't provide that information because I couldn't verify an allowed profile.",
        visualText: "Request blocked: profile not authorized.",
        publicFields: [],
        privateFields: [],
        excludedPaths: [...neverReveal]
      };
  }
}
