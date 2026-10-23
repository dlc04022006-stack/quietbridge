// This cloud policy can only permit QuietBridge to continue processing.
// The local deterministic policy still chooses PUBLIC/REDACTED/PRIVATE/BLOCKED.
permit (
  principal is QuietBridge::Profile,
  action == QuietBridge::Action::"processProtectedResult",
  resource is QuietBridge::DataRequest
)
when {
  context.ownerMatch &&
  context.profileType == "ADULT" &&
  context.identityConfidencePermille >= 800
};

forbid (
  principal,
  action == QuietBridge::Action::"processProtectedResult",
  resource
)
when {
  !context.ownerMatch ||
  context.profileType != "ADULT" ||
  context.identityConfidencePermille < 800
};
