# Alexa+ Privacy Firewall — deduplicated feature backlog

Prepared: 23 October 2026  
Derived from:

- `alexa-plus-drawbacks-and-user-needs-report.md`
- `alexa-plus-not-publicly-implemented-feature-audit.md`
- `alexa-plus-unresolved-white-space-report.md`

## Product goal

Build a consumer-facing privacy layer for shared voice devices:

> Before Alexa speaks or transfers personal information, classify the sensitive fields, check who and what may hear them, disclose only what is safe, privately deliver the rest, and create a receipt that the user can inspect or delete.

This is not another Voice ID system, permission screen, or Send to Phone feature. It combines those concepts into an automatic, accountable privacy decision for each request.

## How duplicates were merged

The source reports contained overlapping requests such as “correct household-member recognition,” “conservative behavior when identity is uncertain,” “guest mode,” “audience-aware disclosure,” and “destination privacy.” These are one product capability: **Household Audience Policy**.

Likewise:

- sensitivity classification + private responses + private payment handling → **Sensitivity Map and Output Router**;
- what data was used + source + purpose + recipient + retention + inference → **Request Data Receipt**;
- forget + delete + revoke + downstream confirmation → **Deletion and Revocation Proof**;
- separate memories + inspect memory + expiry → **Personal Memory Vault**;
- cross-device privacy boundary + field transfer rules → **Context Passport**.

After merging overlaps, the privacy product has **11 distinct features**.

---

# The 11 non-duplicated privacy features

## PF-01 — Field-level Sensitivity Map

### What it does

Inspects the proposed response before it is spoken and labels individual fields rather than labelling the entire response.

Example:

```text
“Your cardiology appointment is Tuesday at 10:30 with Dr. Rao.”

appointment_type = health_sensitive
date_time         = personal
provider_name     = health_sensitive
```

### Required sensitivity categories

- public;
- personal;
- household-confidential;
- financial;
- health;
- precise location;
- child-related;
- authentication/security;
- relationship/communication;
- legal or employment;
- user-defined sensitive field.

### Required outputs

- classification per field;
- confidence score;
- short reason;
- uncertainty flag;
- recommended minimum disclosure level.

### Acceptance criteria

- It runs before public speech or display.
- It never places raw secrets in logs.
- Low-confidence sensitive decisions fail closed.
- A user can override a classification for future requests.

### Priority

**MVP — mandatory.** Everything else depends on it.

## PF-02 — Household Audience Policy

### What it does

Determines whether the current environment is safe for each classified field.

### Policy inputs

- recognized person and confidence;
- household role: adult, child, guest, caregiver;
- requesting profile and data owner;
- device: personal or shared;
- room: private, shared, or unknown;
- screen lock/authentication state;
- bystander/presence indicator when available;
- quiet/private/guest mode;
- user-defined disclosure rules.

### Policy outputs

- `PUBLIC` — safe to speak and display;
- `REDACTED` — speak/display only non-sensitive fields;
- `PRIVATE` — move sensitive fields to an authenticated channel;
- `CONFIRM` — ask the recognized user before disclosure;
- `BLOCKED` — reveal nothing.

### Fail-closed rules

- Unknown identity cannot access person-specific information.
- A recognized speaker does not automatically mean the room is private.
- Child and guest modes receive conservative defaults.
- A shared device never displays sensitive details merely because the speaker is recognized.

### Acceptance criteria

- The same request can produce different output on a bedroom device and a living-room device.
- The decision is deterministic for the same inputs.
- Every decision records the applied rule, not private content.

### Priority

**MVP — mandatory.**

## PF-03 — Privacy Output Router

### What it does

Applies the Audience Policy to the Sensitivity Map and constructs separate public and private outputs.

### Example

Requested response:

> “Your salary payment of ₹85,000 arrived in account ending 8142.”

Public response:

> “I found the account update and sent the private details to your phone.”

Private response:

> “Salary payment: ₹85,000. Account ending 8142.”

### Requirements

- Redact by field, not by hiding the whole response.
- Never mention the sensitive value in the explanation.
- Use the safest output when classification or identity is uncertain.
- Keep public speech brief.
- Support public-only, private-only, and split responses.

### Acceptance criteria

- Sensitive test values never appear in public TTS, public cards, URLs, logs, or error messages.
- Public and private outputs are generated from the same authoritative result.
- A test suite proves that known secrets cannot leak through fallback/error paths.

### Priority

**MVP — mandatory.**

## PF-04 — Authenticated Private Handoff

### What it does

Delivers only the sensitive fields to the correct personal device or simulated companion surface.

### Requirements

- One-time opaque handoff token.
- Token expires quickly.
- Token is bound to the intended profile/session.
- Sensitive content never appears inside the URL or QR code.
- Opening the handoff requires authentication or a clearly simulated equivalent.
- After expiry, the handoff cannot be replayed.
- Private payload can be deleted immediately.

### Hackathon implementation

Use a companion-phone panel in the simulator. The panel receives a one-time notification and requires the selected demo profile to unlock it. Clearly label this as a simulated private channel rather than claiming real Alexa push integration.

### Acceptance criteria

- A different profile cannot open the handoff.
- Reusing an already consumed token fails.
- Expired handoffs return no sensitive data.
- Only redacted identifiers appear in the audit trail.

### Priority

**MVP — mandatory.**

## PF-05 — Explainable Privacy Decision

### What it does

Explains why information was spoken, redacted, sent privately, or blocked without exposing the information itself.

### Good explanations

- “I sent the details privately because this is a shared-room device.”
- “I need to confirm it’s you before showing that information.”
- “That result includes health information, so I didn’t read it aloud.”

### Bad explanations

- “I hid your ₹85,000 salary because guests are present.”
- “Privacy policy rule PRV-482 failed.”
- “The model classified this as category H3.”

### Acceptance criteria

- The explanation contains no sensitive values.
- It names the practical reason in ordinary language.
- It offers one next action: authenticate, open privately, change the rule, or cancel.

### Priority

**MVP — mandatory.**

## PF-06 — Just-in-Time Consent and Permission Manager

### What it does

Requests the smallest permission required for the current action instead of relying only on permanent, category-wide consent.

### Permission options

- allow once;
- allow for this session;
- allow until a chosen time;
- always allow for this type of request;
- deny;
- allow the action but do not retain the data.

### Consent explanation

Every prompt states:

- the exact data requested;
- the current purpose;
- the recipient/service;
- whether it will be stored;
- retention duration;
- what will not work if denied.

### Acceptance criteria

- Denial does not break unrelated features.
- Consent is versioned and revocable.
- The application never upgrades a one-time permission into permanent access.
- High-risk changes require explicit confirmation.

### Priority

**Phase 2.** MVP can use predefined household rules and demonstrate one just-in-time prompt.

## PF-07 — Request Data Receipt

### What it does

Creates a plain-language receipt for each privacy-relevant request.

### Receipt fields

- request ID and time;
- recognized/requesting profile and confidence;
- source device and room type;
- data fields accessed;
- whether each field was supplied, retrieved, remembered, or inferred;
- purpose;
- recipient/service;
- public/private disclosure decision;
- retention duration;
- deletion endpoint/status;
- policy/rule used;
- completion, failure, or partial status.

### User-facing example

```text
Used: appointment date and clinic name
Source: linked calendar
Purpose: answer your appointment question
Shared with: Calendar Connector
Spoken aloud: no
Delivered privately: yes
Stored by this add-on: no
Delete status: nothing stored
```

### Acceptance criteria

- Receipt metadata never repeats the sensitive value unnecessarily.
- The user can filter receipts by person, service, device, and date.
- Each receipt links directly to revoke/delete actions.
- Receipts distinguish facts from model inferences.

### Priority

**MVP — simplified receipt mandatory.** Full filtering is Phase 2.

## PF-08 — Personal Memory Vault

### What it does

Makes remembered information visible, owned, expiring, and separable by household member.

### Capabilities

- “What do you remember about me?”
- View memory by category and source.
- Show why and when each item was saved.
- Set expiry: session, day, month, permanent, or never remember.
- Correct an item.
- Forget one item or an entire category.
- Keep adult, child, guest, and caregiver memories separate.
- Do not infer shared ownership from shared-device use.

### Acceptance criteria

- A profile cannot inspect another profile's memory.
- Expired memory cannot be retrieved by the assistant.
- Deletion creates a completion record without retaining the deleted secret.
- No sensitive information is remembered by default in the MVP.

### Priority

**Phase 2.** For MVP, implement session-only context and “forget this request.”

## PF-09 — Deletion and Revocation Proof

### What it does

Coordinates deletion or permission revocation across the privacy layer and every simulated downstream service.

### Status model

- requested;
- acknowledged;
- pending;
- completed;
- failed;
- not supported;
- legally retained with reason;
- already absent.

### Requirements

- One conversational command starts the operation.
- Show separate status for local/add-on/vendor data.
- Retry transient failures.
- Never report success until each participating service confirms.
- Clearly identify data the system cannot delete.
- Let the user revoke future access even when historic deletion is unavailable.

### Acceptance criteria

- Demo includes one successful deletion and one downstream failure.
- The failure remains visible and retryable.
- Deleted values disappear from the private payload and memory store.
- The proof record contains identifiers/status only, not the deleted value.

### Priority

**MVP — implement for the project’s own store plus one simulated external service.**

## PF-10 — Context Passport

### What it does

Attaches enforceable privacy rules to every context field that may move between turns, devices, or add-ons.

### Passport fields

- data owner;
- sensitivity category;
- origin;
- permitted purpose;
- permitted add-ons;
- permitted device types;
- allowed audience/household role;
- expiry;
- storage permission;
- re-authentication requirement;
- onward-sharing permission.

### Example

```json
{
  "field": "appointment_time",
  "owner": "profile_alice",
  "sensitivity": "health",
  "allowedDevices": ["personal_phone"],
  "allowedAudience": ["owner"],
  "expiresAt": "2026-10-23T13:00:00Z",
  "onwardSharing": false
}
```

### Acceptance criteria

- Moving to a shared device automatically removes disallowed fields.
- Expired fields cannot be carried forward.
- An add-on cannot widen the passport's permissions.
- Every transfer is represented in the Request Data Receipt.

### Priority

**Phase 2.** MVP can demonstrate one cross-device transfer using the same policy structure.

## PF-11 — Dynamic Privacy Downgrade

### What it does

Changes disclosure behavior during an active conversation when the audience or identity confidence changes.

### Trigger examples

- an unrecognized person appears;
- the recognized user walks away;
- conversation continues on a shared device;
- device becomes unlocked/locked;
- child or guest takes over speaking;
- identity confidence falls below threshold.

### Responses

- stop speaking sensitive information;
- redact or hide the screen;
- invalidate pending handoff tokens;
- require re-authentication;
- continue only with public context;
- record the change without storing biometric/raw-presence data.

### Hackathon implementation

Provide simulator controls such as `Alice recognized`, `Guest entered`, and `Identity uncertain`. These must feed the real policy engine rather than switch to canned screens.

### Acceptance criteria

- A guest-entered event immediately changes the same conversation from public to private output.
- Previously visible sensitive cards are removed or masked.
- The transition is recorded in the receipt.

### Priority

**Phase 3 / stretch goal.** Excellent final demo if core features are stable.

---

# Cross-cutting requirements, not separate features

These appeared repeatedly in the source reports but should apply to every feature rather than become duplicate backlog items.

## Accessibility

- Voice-complete critical flows.
- Large-text and high-contrast cards.
- Repeat, slower, simplify, and explain commands.
- One decision per prompt.
- Never require a screen on a screenless device; offer a safe voice alternative.

## Child and guest safety

- Conservative defaults.
- No access to adult memories or receipts.
- No permanent permission grant by a guest or child.
- No sensitive spoken output when identity is uncertain.

## Data minimization

- Store no sensitive payload by default.
- Use opaque IDs in logs.
- Short TTL for private payloads and tokens.
- Encrypt stored demo data.
- Do not use sensitive content for model training.

## Security

- Authentication and authorization on every private endpoint.
- Rate limiting and replay protection.
- No secrets in URLs, QR codes, browser history, analytics, or logs.
- Deterministic policy code owns disclosure; an LLM may classify or explain but cannot bypass policy.

## Honest simulation

- Label simulated Voice ID, presence, phone push, and Alexa screens.
- Use a real MCP server and real tool calls.
- Do not claim access to private-preview Alexa+ tooling.

---

# Recommended MVP scope

Build these seven pieces first:

1. **PF-01 Sensitivity Map** — classify a proposed response by field.
2. **PF-02 Audience Policy** — evaluate identity, role, device, and room.
3. **PF-03 Output Router** — split public and private output.
4. **PF-04 Private Handoff** — one-time authenticated companion card.
5. **PF-05 Explanation** — say why information was withheld.
6. **PF-07 Data Receipt** — show data, purpose, recipient, and retention.
7. **PF-09 Delete/Revocation Proof** — delete the request and show status.

Do not implement the full Memory Vault, Context Passport, or dynamic presence system until this vertical slice works end to end.

## MVP user story

> As a person using Alexa in a shared room, I can ask about a sensitive appointment. The system recognizes that the answer contains health information, sees that the device is in a shared room, avoids saying the details aloud, sends them to my authenticated phone, shows what data was used and why, and lets me delete the request with proof.

## MVP demo sequence

1. Select `Alice` as the recognized demo profile and `Living room` as a shared device.
2. Ask: “When is my cardiology appointment?”
3. The MCP service retrieves a simulated calendar result.
4. The Sensitivity Map labels the appointment type and provider as health-sensitive.
5. Audience Policy selects `PRIVATE`.
6. Alexa says: “I found it and sent the details privately because this is a shared-room device.”
7. Alice unlocks the simulated phone and views the details.
8. Open the Data Receipt to see fields, purpose, recipient, retention, and disclosure decision.
9. Say: “Delete that request.”
10. Show deletion completed locally and acknowledged by the simulated calendar connector.
11. Repeat on a personal bedroom device to show a different policy result.

---

# Suggested MCP tools

Keep tools narrow and non-overlapping.

## `resolve_private_request`

Retrieves the domain result for the demo scenario. It returns structured fields and data-source metadata, not final speech.

## `evaluate_disclosure`

Accepts structured fields plus audience context. Returns sensitivity labels, policy decision, public-safe fields, and private field references.

## `create_private_handoff`

Creates a short-lived, profile-bound handoff token for previously approved private field references.

## `get_privacy_receipt`

Returns a redacted receipt for one request ID.

## `delete_private_request`

Deletes the project's data for one request and coordinates deletion with the simulated connector. Returns per-system status.

The policy engine must validate every request server-side. The client or language model must not be able to mark sensitive data as public simply by changing a parameter.

---

# Minimal data model

```text
HouseholdProfile
  id, role, allowed_devices, privacy_preferences

AudienceContext
  profile_id, identity_confidence, device_id, room_type,
  device_privacy, guest_present, mode

SensitiveField
  reference_id, category, confidence, owner_id, source,
  value_encrypted, expires_at

DisclosureDecision
  request_id, field_reference, outcome, rule_id, explanation_code

PrivateHandoff
  token_hash, profile_id, request_id, expires_at, consumed_at

PrivacyReceipt
  request_id, timestamp, fields_used, sources, purposes,
  recipients, retention, disclosure_outcomes, deletion_status
```

---

# Definition of done for the privacy MVP

- Real self-hosted Streamable HTTP MCP server.
- Real `initialize`, `tools/list`, and `tools/call` visible in the simulator.
- At least five sensitivity categories and three audience contexts.
- Deterministic disclosure policy with automated tests.
- No sensitive values in public output or logs.
- One-time private handoff with expiration and replay protection.
- Plain-language request receipt.
- Local plus simulated downstream deletion with visible status.
- Voice-only safe fallback.
- One intentional failure path and recovery.
- Accessibility checks for keyboard, contrast, labels, and concise speech.
- Friction log documenting limitations and unavailable Alexa+ preview tooling.

# Working product name

Use **QuietBridge** as a temporary internal name.

One-line pitch:

> QuietBridge keeps Alexa useful in shared rooms by speaking only what is safe, moving sensitive details privately, and showing exactly where the data went.
