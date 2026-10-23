# QuietBridge: What to Build, What to Use, and How to Prove It Works

Date checked: 23 October 2026  
Target: Amazon Developer Hackathon — Alexa+ track  
Goal: demonstrate a privacy control layer that lets Alexa remain useful in shared spaces without speaking sensitive information to the wrong audience.

## 1. The simple version

QuietBridge receives a request such as, “When is my cardiology appointment?” It retrieves a simulated appointment, identifies which fields are sensitive, checks who is present and which device is being used, and then chooses one of four outcomes:

- **PUBLIC** — safe to say aloud.
- **REDACTED** — say only a harmless summary aloud.
- **PRIVATE** — say a neutral message and send the details to an authenticated private view.
- **BLOCKED** — reveal nothing because identity or context is unsafe.

Afterward, the user can ask why the decision was made, inspect a privacy receipt, or delete the request and see whether deletion succeeded locally and at the connected service.

The seven pieces are one product, not seven separate submissions.

```text
Alexa simulator
      |
      v
real MCP server ----> simulated calendar connector
      |
      v
Sensitivity Map -> Audience Policy -> Output Router
                                         | \
                                  public voice private handoff
                                         |        |
                                         v        v
                                      receipt   phone view
                                         |
                                         v
                                  deletion/revocation
```

## 2. What the organizers actually expect

### Mandatory for the Alexa+ entry

1. Build a **real self-hosted MCP server** that supports MCP specification **2025-11-25 or later** and **Streamable HTTP**, or build an Agent Skill. QuietBridge should use the MCP route.
2. The submitted source must genuinely call the required technology. A README claiming MCP support is not enough.
3. It is acceptable to build your own Alexa+ web simulator because participants do not receive the gated Alexa+ SDK, Toolkit, CLI, or official simulator.
4. Put the simulator source, MCP server source, all assets, and complete run instructions in the repository.
5. Show the MCP/Agent Skill working in the video. For QuietBridge, visibly demonstrate `initialize`, `tools/list`, and `tools/call` in a developer drawer.
6. Submit a public repository with an open-source license, or share a private repository with the reviewer accounts named in the rules/FAQ.
7. Provide a public English YouTube or Vimeo demo video under three minutes.
8. Complete the required product feedback for every Amazon tool, API, SDK, and AWS service used.
9. The experience must be intended for end consumers, not an internal enterprise tool.
10. The product needs its own useful domain behavior. It cannot merely relay requests to an LLM.

### Expectations that shape this product

- Give understandable errors and a useful next action; never expose JSON, tool names, internal identifiers, or stack traces to the customer.
- Preserve conversational state after recoverable errors and say “still working” for slow calls.
- Critical flows must work by voice on a screenless device. Never tell an Echo Dot user to tap or look at a screen.
- Voice responses should be under 30 seconds.
- Voice and visual information must agree.
- Destructive actions such as deletion require explicit confirmation with the important details.
- Store/listing claims, example utterances, MCP tools, privacy disclosures, and the working demo must match.
- If the product eventually collects customer data, its listing must accurately disclose the data types, retention, deletion, privacy policy, and terms.

### What may be simulated

| Item | May it be simulated? | Required honesty/evidence |
|---|---:|---|
| Alexa+ voice/device UI | Yes | Call it the “QuietBridge Alexa+ simulator” in the UI and video. Include its source. |
| Voice ID/profile selection | Yes | Label it simulated; do not claim real Alexa Voice ID access. |
| Phone notification/private phone | Yes | Show a simulated phone panel and authentication step. |
| Calendar/health appointment provider | Yes | Use invented test data and label the connector simulated. |
| MCP protocol and tool calls | **No** | Run a real MCP server over Streamable HTTP and show real calls. |
| Privacy policy decision | **No** | Execute actual server-side code and test it. |
| Token expiry and one-time use | **No** | Implement and demonstrate real expiry/replay rejection. |
| Local deletion | **No** | Really remove the stored request/token/receipt payload. |
| Downstream deletion | Yes, if clearly marked | Return a visible simulated connector status; include success and failure modes. |
| AWS Builder mini-challenge integration | **No** | Make a real AWS service call, show code/config, and document the integration. |

## 3. Recommended technology

Use one TypeScript monorepo so the simulator, server, schemas, and tests share the same types.

| Layer | Recommended choice | Why |
|---|---|---|
| Runtime | Node.js 22 + TypeScript | Fast to build, strong MCP SDK support, shared types. |
| MCP | Official Model Context Protocol TypeScript SDK, pinned to a current patched release | Implements the protocol and Streamable HTTP. Avoid `@modelcontextprotocol/sdk` 1.25.3 or older because of a disclosed cross-client data leak; use 1.26.0+ if staying on the v1 line. |
| HTTP server | Fastify or Express | Simple `/mcp`, health, private handoff, and simulator endpoints. |
| Validation | Zod + JSON Schema | Rejects malformed tool input before policy code runs. |
| Simulator | React + Vite + TypeScript | One responsive page can show Echo, phone, and developer evidence. |
| Styling/accessibility | Plain CSS or Tailwind; semantic HTML | Quick responsive UI with keyboard, focus, contrast, and screen-reader support. |
| Policy engine | Pure TypeScript rules with enumerated reason codes | Deterministic, auditable, and easy to test. The model must not own disclosure. |
| Optional intelligent classifier | Amazon Bedrock model call with strict structured output | Adds a real AWS integration and helps classify unfamiliar fields. A deterministic fail-closed fallback remains authoritative. |
| Ephemeral store | DynamoDB with expiry metadata, or an in-memory adapter for local runs | Easy record lifecycle. Do not depend on DynamoDB TTL for immediate deletion; explicitly delete records. |
| Encryption | Node `crypto` AES-256-GCM; AWS KMS for the data key if deployed | Sensitive payload is encrypted at rest and never placed in URLs/logs. |
| Tests | Vitest, Supertest, Playwright, Axe | Unit, API, end-to-end, and accessibility coverage. |
| Deployment | Container on AWS App Runner or ECS/Fargate | A normal long-running HTTPS endpoint is simpler for Streamable HTTP than a short-lived function. |
| CI | GitHub Actions | Runs lint, typecheck, unit, integration, leak scan, and browser tests. |

### Important MCP security rule

Create a separate MCP server/transport instance for each connection or request as the current SDK guidance requires. Never share a stateful transport/server instance across clients. Pin dependencies and commit the lockfile.

### Suggested repository layout

```text
quietbridge/
  apps/
    simulator/                 # React Alexa/phone/debug interface
    mcp-server/                # Streamable HTTP MCP endpoint and private view API
  packages/
    contracts/                 # Zod schemas and shared types
    sensitivity/               # PF-01
    audience-policy/           # PF-02
    output-router/             # PF-03
    private-handoff/           # PF-04
    explanations/              # PF-05
    receipts/                  # PF-07
    deletion/                  # PF-09
    test-fixtures/              # invented users, rooms, appointments
  tests/
    contract/
    integration/
    e2e/
    security/
  docs/
    architecture.md
    threat-model.md
    friction-log.md
    aws-integration.md
    product-feedback.md
  LICENSE
  README.md
```

## 4. How to build and test each of the seven pieces

### PF-01 — Sensitivity Map

**Purpose:** Label every returned field before anything can be spoken or displayed.

Use at least these five categories:

- `PUBLIC`: provider name or generic status that is harmless.
- `PERSONAL`: personal preference or ordinary calendar title.
- `FINANCIAL`: price, balance, account, payment information.
- `HEALTH`: specialty, diagnosis, medication, appointment details.
- `AUTH_SECRET`: tokens, passwords, account identifiers, private URLs.

Build it as a deterministic rules layer first. Optionally ask Bedrock for a structured classification when no rule matches, but accept only an allow-listed enum and treat uncertainty, timeout, or invalid output as sensitive. The raw value does not need to be sent to the model; prefer field name, data type, connector, and a masked sample.

**Pass tests**

- A table of at least 30 invented fields maps to the expected category.
- Unknown fields default to `PERSONAL` or stricter, never `PUBLIC`.
- Invalid/slow Bedrock response fails closed.
- An `AUTH_SECRET` value is absent from speech, visual cards, receipts, URLs, traces, and application logs.

### PF-02 — Audience Policy

**Purpose:** Decide who may receive each sensitivity category in the current context.

Inputs should include `profileId`, `identityConfidence`, `deviceContext`, `roomType`, `audience`, `fieldLabels`, and `requestedAction`. Output should be only `PUBLIC`, `REDACTED`, `PRIVATE`, or `BLOCKED`, plus machine-readable reason codes.

Implement this as a pure server-side decision table. The browser, model, or connector may provide facts, but none may declare its own data public.

Use at least three audience contexts:

1. `SHARED_OR_UNKNOWN` — shared room, unknown listener, or unverified voice.
2. `RECOGNIZED_SHARED` — recognized adult but on a shared device.
3. `RECOGNIZED_PRIVATE` — recognized adult on their private device/context.

**Pass tests**

- Exhaustively test every sensitivity category against every audience context.
- Unknown identity always produces the safer of `PRIVATE` or `BLOCKED`.
- Child/guest context can never retrieve adult private details, receipts, or permanent grants.
- A client-supplied `classification: PUBLIC` cannot override the server’s map.
- The same fixed inputs always produce the same decision and reason code.

### PF-03 — Output Router

**Purpose:** Turn the policy decision into separate public and private outputs.

The router should return a structure such as:

```json
{
  "decision": "PRIVATE",
  "spokenText": "I found it, but I won't say the details in this shared room.",
  "visualText": "Private details withheld",
  "privateFieldRefs": ["appointment.when", "appointment.location"],
  "reasonCodes": ["HEALTH_DATA", "SHARED_ROOM"]
}
```

Use fixed, reviewed speech templates. Do not use an LLM to rewrite sensitive data into public speech.

**Pass tests**

- Seed every secret with a unique marker such as `QB_SECRET_HEALTH_7X9`; scan every public response and log and assert the marker never occurs.
- Spoken and on-screen public text agree.
- Public speech is understandable without a screen and stays below 30 seconds.
- `BLOCKED` returns no private reference or usable token.
- A slow connector produces a safe “still working” response and preserves the request state.

### PF-04 — Authenticated Private Handoff

**Purpose:** Let only the intended profile open the sensitive result.

Generate a cryptographically random 256-bit opaque token. Put only a SHA-256 hash of that token in storage, bind the record to the profile/request, give it a short lifetime such as two minutes, and make consumption atomic and one-time. Never put the sensitive payload itself in a URL, QR code, analytics event, or log.

For the demo, the phone panel should require a simulated unlock before it calls the private endpoint. Clearly label that unlock as simulated. The backend authorization, expiry, profile binding, and one-time consume must be real.

**Pass tests**

- Correct user + valid unused token returns the details exactly once.
- Wrong profile returns `403` without revealing whether the private record exists.
- Expired token returns `410` and no details.
- Reused token returns `409` or a generic invalid response.
- Two simultaneous requests cannot both consume the token.
- Token and secret values are absent from logs and analytics.

### PF-05 — Explainable Privacy Decision

**Purpose:** Answer “Why didn’t you say it aloud?” in plain language.

Generate explanations from trusted reason codes, for example:

> “The result contains health information, and this device is marked as shared, so I kept the details private.”

Use templates, not free-form model generation. Do not name a diagnosis, appointment, balance, or other hidden value while explaining why it was hidden.

**Pass tests**

- Every policy reason code has a plain-language explanation.
- The explanation states the data category and audience context, not the sensitive value.
- It is short enough to speak and includes one useful next step.
- Unknown reason codes use a safe generic explanation, not an internal error.

### PF-07 — Data Receipt

**Purpose:** Show what data was used, where it went, and how long it remains.

Store/redact metadata, not a second copy of the private content. A receipt can show:

- request ID and time;
- recognized/simulated profile;
- source connector;
- categories accessed;
- decision and reason;
- recipients such as “public voice” and “authenticated private view”;
- retention/expiry;
- model/AWS usage, if any;
- deletion state.

**Pass tests**

- Receipt schema validates and every displayed statement matches the actual trace.
- No raw health/financial/auth-secret value appears.
- A blocked request correctly says that no private data was delivered.
- A deleted receipt is unavailable or retained only as a content-free deletion tombstone according to the documented policy.
- Receipt is readable by keyboard/screen reader and retrievable in a voice-safe summary.

### PF-09 — Deletion/Revocation Proof

**Purpose:** Let the user revoke the handoff and delete the project’s copy, while honestly reporting downstream status.

Treat deletion as an idempotent state machine:

```text
CONFIRM_REQUIRED -> IN_PROGRESS -> LOCAL_DELETED
                              -> DOWNSTREAM_CONFIRMED
                              -> DOWNSTREAM_FAILED_RETRYABLE
                              -> DOWNSTREAM_UNSUPPORTED
```

Ask for explicit confirmation before starting. Immediately invalidate all handoff tokens. Explicitly delete the local payload; do not merely wait for TTL. The simulated calendar connector should support selectable success, failure, and unsupported responses so the demo proves honest partial failure.

**Pass tests**

- “Delete that request” asks for confirmation and does nothing before “yes.”
- Local payload and outstanding tokens are gone after confirmation.
- Repeating delete is safe and returns the same final state.
- Downstream success is shown only after a connector confirmation.
- Downstream failure remains visible and can be retried without restoring local data.
- The UI never says “deleted everywhere” when only local deletion succeeded.

## 5. The MCP tools to expose

Keep the tool set small and meaningful:

| Tool | Job | Important output |
|---|---|---|
| `resolve_private_request` | Retrieve the invented calendar result and source metadata; it does not generate speech. | Structured fields, field provenance, request ID. |
| `evaluate_disclosure` | Run PF-01, PF-02, PF-03, and PF-05 server-side. | Decision, safe speech, safe visual text, reason codes. |
| `create_private_handoff` | Create PF-04 after policy allows it. | One-time short-lived opaque token/reference; no sensitive value. |
| `get_privacy_receipt` | Return PF-07’s redacted trace. | Categories, destinations, expiry, status. |
| `delete_private_request` | Run PF-09 after explicit confirmation is represented. | Local and downstream statuses separately. |

Validate every input and output with Zod/JSON Schema. The server must compute the profile and authorization context from trusted session data wherever possible, not blindly accept it as a tool argument.

## 6. Complete test strategy

### Automated gates on every commit

```text
lint -> typecheck -> unit tests -> policy matrix -> MCP contract tests
     -> API integration tests -> secret leak scan -> Playwright E2E -> accessibility
```

1. **Unit tests:** every sensitivity rule, policy row, routing template, explanation, receipt, token transition, and deletion transition.
2. **Property/fuzz tests:** generate arbitrary field names/values and verify unknown or suspicious data never becomes publicly speakable by accident.
3. **MCP contract tests:** connect with a real MCP client; execute `initialize`, `tools/list`, and every `tools/call`; check protocol negotiation, schemas, errors, and concurrent clients.
4. **API/security tests:** malformed JSON, oversized input, rate limiting, CORS/origin validation, authentication, wrong profile, expired token, replay, parallel consumption, and log redaction.
5. **End-to-end browser tests:** operate the Echo panel, private phone, receipt, confirmation, deletion, and failure/retry flows.
6. **Accessibility tests:** keyboard-only flow, visible focus, accessible names, contrast, zoom, screen-reader announcements, and no color-only status.
7. **Voice-only review:** hide the screen and verify the user can understand and finish every critical flow. Private content itself should remain withheld; the voice path must offer a safe next action that does not assume a display.
8. **Performance/failure tests:** connector timeout, Bedrock timeout, store error, downstream deletion failure, and server restart. Acknowledge slow work, fail closed, and preserve or clearly expire state.

### Minimum end-to-end acceptance scenarios

| # | Scenario | Expected result |
|---:|---|---|
| 1 | Harmless public fact | Spoken normally; receipt says public. |
| 2 | Cardiology appointment, shared living room, recognized adult | Neutral speech; details only through private handoff. |
| 3 | Same request, unknown speaker | Blocked or private with no details. |
| 4 | Same request in recognized private context | Apply the documented less restrictive policy, while never speaking auth secrets. |
| 5 | Low-confidence sensitivity classification | Fails closed to private/blocked. |
| 6 | Correct profile opens valid handoff | Details appear once. |
| 7 | Wrong profile opens handoff | Denied; no metadata leak. |
| 8 | Expired handoff | Denied; safe option to request again. |
| 9 | Handoff replay | Denied. |
| 10 | User asks why details were withheld | Safe, correct plain-language reason. |
| 11 | User inspects receipt | Accurate destinations and retention; no raw secret. |
| 12 | User requests deletion then says “no” | Nothing deleted. |
| 13 | User confirms deletion | Local content and token really disappear. |
| 14 | Downstream deletion succeeds | Separate confirmed status shown. |
| 15 | Downstream deletion fails | Local deletion stays complete; downstream failure and retry shown honestly. |
| 16 | Connector is slow | Safe “still working” response, then continuation. |
| 17 | Connector/server error | No JSON/internal IDs; one actionable next step. |
| 18 | Two clients use the server concurrently | No response or secret crosses between clients. |
| 19 | Screenless mode | No “tap,” “look,” or “as shown”; public-safe flow is fully understandable by voice. |
| 20 | Automated artifact scan | All public output/logs contain zero secret markers. |

## 7. Build order

Do not build seven independent mini-apps. Build one thin vertical slice, then add controls.

1. **Contracts and invented data:** define schemas, five categories, three audience contexts, and fixtures.
2. **MCP skeleton:** real `/mcp` Streamable HTTP endpoint with `initialize`, `tools/list`, and one working tool call.
3. **Core privacy path:** implement PF-01 → PF-02 → PF-03 as pure functions with tests.
4. **Simulator:** create Echo, shared-room/private-room selector, and developer MCP drawer.
5. **Private delivery:** implement PF-04 and the simulated authenticated phone panel.
6. **Trust UI:** add PF-05 explanations and PF-07 receipts.
7. **Control:** add PF-09 confirmation, deletion states, failure, and retry.
8. **AWS integration:** connect Bedrock for unfamiliar-field classification or explanation assistance, but retain deterministic policy authority and a safe fallback. Record exactly what data is sent.
9. **Hardening:** concurrency, leak scanning, accessibility, timeouts, replay, and voice-only review.
10. **Submission evidence:** README, diagrams, tests, product feedback, friction log, license, and video.

If time is very short, protect the first seven steps and the real MCP evidence. Remove decorative UI before removing tests or privacy controls.

## 8. The three-minute demo the judges should see

| Time | Proof |
|---|---|
| 0:00–0:15 | One-sentence problem and product promise. |
| 0:15–0:35 | Start the simulator; open the developer drawer showing real MCP `initialize` and `tools/list`. |
| 0:35–1:10 | Ask for the cardiology appointment in the shared living room. Show real `tools/call`, neutral speech, sensitivity labels, and `PRIVATE` decision. |
| 1:10–1:35 | Unlock the simulated phone; consume the one-time handoff and view the invented details. Attempt replay and show rejection if it fits. |
| 1:35–1:55 | Ask, “Why didn’t you say it?” and open the redacted data receipt. |
| 1:55–2:25 | Ask to delete; confirm “yes”; show local success and simulated downstream success. Briefly show the failure/retry state. |
| 2:25–2:45 | Repeat with unknown identity or a private room to prove the context changes the decision and failure is safe. |
| 2:45–3:00 | Show architecture, automated test count, AWS call if used, and the consumer impact. |

Never spend video time scrolling code. Show behavior, real protocol traffic, and a concise architecture/test proof.

## 9. How this scores against the judging criteria

| Judging area | Evidence to show |
|---|---|
| Technical implementation | Real MCP server, typed tools, server-side deterministic policy, secure one-time handoff, real deletion, tests, and optional real Bedrock call. |
| Design | Voice-first shared-room behavior, private continuation, clear explanations, accessible receipt, honest error/retry states. |
| Potential impact | Shared households can use assistants for health, finance, family, and work tasks without public disclosure. |
| Quality of idea | A reusable privacy control plane, not merely one calendar feature or an LLM wrapper. |

The optional friction log can strengthen the entry and may earn the judging bonus stated in the rules. For each problem record: task, steps, expected behavior, actual behavior, severity, workaround, and one actionable improvement.

## 10. Submission checklist

- [ ] Real MCP Streamable HTTP endpoint using protocol 2025-11-25 or later.
- [ ] `initialize`, `tools/list`, and all five tools work from a real client.
- [ ] Simulator and all source are in the repository.
- [ ] Clear “simulated” labels on profile, device, phone, notification, and calendar connector.
- [ ] At least five sensitivity categories and three audience contexts.
- [ ] Deterministic disclosure policy with exhaustive tests.
- [ ] Secret-marker scan proves no sensitive value in public outputs or logs.
- [ ] One-time profile-bound handoff with expiry and replay/concurrency protection.
- [ ] Redacted, plain-language privacy receipt.
- [ ] Explicit deletion confirmation and separate local/downstream statuses.
- [ ] Screenless safe path, voice under 30 seconds, visual/voice consistency.
- [ ] Graceful timeout, error, and recovery path.
- [ ] README includes install, run, test, architecture, environment variables, and exact demo steps.
- [ ] No committed secrets; `.env.example` contains placeholders only.
- [ ] Public repository has a license, or private reviewer access is configured exactly as instructed.
- [ ] Product feedback completed for MCP/Alexa+ materials, Bedrock/AWS, and every other Amazon technology used.
- [ ] AWS Builder entry documents the real AWS call and its purpose, if entered.
- [ ] Public English YouTube/Vimeo video is under three minutes.
- [ ] Submission claims, example utterances, code, and demonstrated behavior all match.

## 11. Do not do these things

- Do not build seven repos or submit seven disconnected features.
- Do not let Bedrock, the browser, or a tool argument make the final disclosure decision.
- Do not send raw secrets to logs, analytics, URLs, QR codes, receipts, or model prompts.
- Do not claim access to Alexa Voice ID, notifications, or private-device APIs that the hackathon does not provide.
- Do not say data was deleted everywhere unless each destination confirms it.
- Do not make a private visual screen the only way to complete a critical voice flow.
- Do not call the product “Alexa Privacy” or imply it is an official Amazon feature; use the independent QuietBridge identity.
- Do not rely on README text as proof of MCP or AWS usage.
- Do not use real medical, financial, or household data in development or the video.

## 12. Reuse versus build ourselves

The seven ideas are not individually new. Their equivalents exist in other areas of software, but the shared-room voice-assistant combination is the product. Reuse maintained packages through their public APIs; do not copy an entire third-party project and rename it.

| QuietBridge piece | Existing field/pattern | Reuse | Build ourselves |
|---|---|---|---|
| Sensitivity Map | PII detection and data-loss prevention | Optionally use Presidio for free-text PII; use Bedrock structured classification for unfamiliar metadata | QuietBridge categories, connector-aware field rules, confidence handling, and fail-closed behavior |
| Audience Policy | IAM, zero trust, ABAC policy engines | Cedar or OPA can evaluate policies | The shared-room/private-room rules, identity thresholds, child/guest behavior, and four disclosure outcomes |
| Output Router | Information-flow control and DLP redaction | Standard schema/validation utilities | Exact public/private split and voice-safe templates |
| Private Handoff | Magic links, step-up authentication, password-reset tokens | Node Web Crypto/`crypto`, an identity provider if available, and a transactional store | Profile binding, one-use consume, short expiry, replay behavior, and Alexa-to-private-view flow |
| Explanation | Explainable authorization and policy decision logs | Policy reason codes | Consumer wording that explains the choice without revealing the hidden content |
| Data Receipt | Audit trails, provenance, consent/privacy receipts | Optional OpenTelemetry for content-free technical traces | The privacy receipt schema and redaction rules |
| Deletion Proof | Distributed deletion sagas and revocation workflows | Database atomic operations and retry utilities | The deletion state machine, connector adapter, truthful partial-failure UI, and voice confirmation flow |

### Recommended hackathon decision

- Use the official MCP TypeScript SDK rather than implementing MCP.
- Use Zod, Node cryptography, the database client, React, and the testing tools as dependencies.
- Write the QuietBridge sensitivity rules, policy table, router, explanations, receipt, and deletion coordinator in TypeScript.
- Do not add Presidio, OPA, Cedar, Temporal, and OpenTelemetry all at once. Add a package only when it removes more risk than it creates.
- For the first demo, structured appointment fields make a small custom sensitivity map clearer and easier to verify than a separate Python Presidio service.
- If there is time for one advanced policy dependency, use Cedar or Amazon Verified Permissions for the audience authorization decision. Keep the final public/private routing constraints in application code as an additional safety boundary.

### Open-source hygiene

- Install packages from their official registries and pin versions in the lockfile.
- Check every license; Apache-2.0 and MIT dependencies are straightforward for this project when their conditions are followed.
- Keep `LICENSE`, dependency lockfile, and a `THIRD_PARTY_NOTICES.md` file.
- When adapting an official example, retain required copyright/license notices, identify the source, and describe the changes.
- Do not claim third-party infrastructure code as the original innovation. Explain that QuietBridge's contribution is its voice privacy model and integration.

## 13. Verification standard

No nontrivial software can be proven “perfect” merely by testing. The defensible target is high assurance with traceable evidence:

1. Give every requirement an ID.
2. Link each requirement to the code module that implements it.
3. Link it to at least one automated test.
4. Link it to a demo step or captured test report.
5. Record the remaining risk and mitigation.

The six non-negotiable invariants are:

1. Sensitive values never enter public output.
2. Unknown or failed classification becomes private/blocked, never public.
3. Only the bound profile can consume a private handoff.
4. A handoff can be consumed at most once and only before expiry.
5. Explanations and receipts never reveal the hidden value.
6. Deletion status never claims more success than was confirmed.

Use unit and decision-table tests, property-based randomized records, real MCP contract tests, API/integration tests, simultaneous token-consumption tests, browser end-to-end tests, accessibility checks, and a manual threat-model review. Map the security checks to OWASP ASVS Level 2 because this is an application handling sensitive data. Add mutation testing if time permits: it deliberately breaks a rule and confirms that the test suite catches the break.

## Official references

- [Hackathon rules](https://amazonappdev2026.devpost.com/rules)
- [Hackathon FAQ](https://amazonappdev2026.devpost.com/details/faqs)
- [Alexa+ functional requirements](https://www.developer.amazon.com/docs/alexaplus/add-ons/functional-requirements)
- [Alexa+ policy requirements](https://www.developer.amazon.com/docs/alexaplus/add-ons/policy-requirements)
- [Official MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP TypeScript SDK protocol compatibility](https://ts.sdk.modelcontextprotocol.io/v2/migration/support-2026-07-28)
- [MCP TypeScript SDK cross-client data-leak advisory](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-345p-7cg4-v4c7)
- [Presidio privacy engineering tools](https://github.com/data-privacy-stack/presidio)
- [Cedar policy language](https://github.com/cedar-policy)
- [Open Policy Agent](https://github.com/open-policy-agent/opa)
- [OpenTelemetry JavaScript](https://github.com/open-telemetry/opentelemetry-js)
- [OWASP Application Security Verification Standard](https://asvs.owasp.org/)

