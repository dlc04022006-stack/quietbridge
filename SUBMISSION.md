# QuietBridge — Devpost submission copy

## Project name

QuietBridge

## Tagline

The privacy-delivery layer that keeps shared assistants useful aloud and sensitive results private.

## Tracks

- Primary: Alexa+
- Mini challenge: Open Source
- Do not select AWS Builder: the optional AWS adapters are disabled in the submitted free-only runtime.

## Short description

QuietBridge is a self-hosted MCP privacy control plane for Alexa+ experiences in shared spaces. It
classifies every returned field, evaluates who is present and which device is speaking, and routes
only safe content to public voice. Sensitive results move through a short-lived, one-time,
profile-bound private handoff. Every decision includes a plain-language explanation, a redacted
privacy receipt, and honest deletion status.

## Full description

Voice assistants are most useful in kitchens, living rooms, and other shared spaces—the exact
places where speaking a medical appointment, balance, address, or account detail can expose it to
the wrong person. Most assistants treat “answer the request” and “choose a safe channel” as the
same problem. QuietBridge separates them.

QuietBridge sits between an Alexa+ capability and its output channels as a real self-hosted MCP
server using Streamable HTTP. A server-side connector retrieves protected data. A deterministic
sensitivity map labels each field as public, personal, financial, health, or authentication secret.
An audience policy considers the authenticated profile, identity confidence, shared/private device,
and resource ownership. The output router then chooses PUBLIC, REDACTED, PRIVATE, or BLOCKED.

For a shared-room health request, Alexa receives only a neutral sentence. QuietBridge creates a
256-bit opaque handoff token for an authenticated companion channel, stores only its SHA-256 hash,
binds it to the intended profile, expires it quickly, and permits exactly one successful use.
Authentication-secret fields are removed independently by the router and store. The user can ask
why the answer was withheld, inspect a content-free privacy receipt, or confirm deletion and see
separate local and connector outcomes.

The submitted integration workspace uses invented Alexa, identity, phone, and calendar adapters,
but the protocol, policy, private handoff, expiry, replay prevention, receipt, deletion, security
headers, signed production authentication boundary, and tests are real. A replaceable connector
contract proves the same layer can protect calendar, health, commerce, or account data without
changing the privacy engine.

## How we built it

- TypeScript/Node.js monorepo with strict compiler settings.
- Official Model Context Protocol TypeScript client/server packages.
- MCP Streamable HTTP with modern 2026 and legacy 2025-era client contract coverage.
- React/Vite product integration workspace with lazy-loaded MCP client.
- Deterministic sensitivity, audience policy, routing, explanation, receipt, and deletion modules.
- 256-bit one-time profile-bound handoffs and optional AES-256-GCM local persistence.
- Signed expiring production profile assertions, Host/Origin allowlists, CSP, body limits, and rate limiting.
- Vitest, fast-check, Playwright, axe, Biome, coverage thresholds, secret scan, and dependency audit.
- Compiled production server/static UI and a multi-stage non-root container definition.

## What makes it different

QuietBridge does not ask an LLM to “be private.” The model, connector, browser, and caller cannot
declare data safe. Disclosure is enforced before language generation and channel delivery. One
auditable decision produces consistent public speech, private delivery, explanation, receipt, and
deletion behavior. The novelty is the composition of channel-aware policy, capability-style
one-time delivery, and content-free accountability at the assistant output boundary—not new
cryptography.

## Challenges

- Supporting real MCP Streamable HTTP across protocol eras while keeping transports isolated.
- Preventing values from leaking through speech, receipts, logs, explanations, URLs, or error paths.
- Making one-time consume, expiry, replay, wrong-profile denial, and deletion revocation consistent.
- Turning a showcase into a reusable connector/channel architecture without pretending simulated
  Alexa identity is production authentication.
- Preserving fail-closed behavior when optional model or external-policy services fail.

## Accomplishments

- 87 passing unit/integration/security/contract tests and 4 passing browser/accessibility tests.
- 38 explicit sensitivity rules plus 1,000 generated unknown-field checks per run.
- 88.50% statements, 78.21% branches, 92.98% functions, and 89.81% lines covered.
- Cognitive complexity capped at 15 and source files capped at 350 lines.
- Zero high/critical production dependency vulnerabilities and zero serious/critical axe issues.
- Real MCP initialize, tools/list, and five tool calls visible in the working product flow.

## What we learned

Privacy in a conversational product is a delivery problem, not only a data-classification problem.
A safe sentence is insufficient if the same value appears in a receipt, retry, visual card, token
URL, or deletion log. We also learned that strong hackathon evidence requires separating genuine
protocol/policy behavior from clearly labelled device and identity adapters.

## What's next

- Connect Alexa account linking/Voice ID when production access is available.
- Move requests, receipts, rate limits, and token consumption to a shared transactional store.
- Deploy behind HTTPS with managed secrets and independent security review.
- Add connector packs for calendars, health portals, finance, shopping, and smart-home workflows.
- Explore user-defined household privacy policies without allowing them to weaken authentication-secret controls.

## Open Source mini-challenge description

QuietBridge is a new MIT-licensed open-source project created during the hackathon. It provides a
reusable MCP privacy-delivery layer, replaceable connector contract, deterministic channel-aware
policy engine, secure one-time handoff, privacy receipts, deletion coordination, production
safeguards, tests, and an integration workspace. It matters because shared assistants need a
technical boundary that keeps sensitive results useful without speaking them to everyone nearby.

Required fields to complete after publishing:

- Contribution URL: `https://github.com/dlc04022006-stack/quietbridge`
- Project repository URL: `https://github.com/dlc04022006-stack/quietbridge`
- GitHub username: `dlc04022006-stack`

## Product feedback

### Alexa+ MCP documentation and requirements

Used for: designing the self-hosted MCP integration, Streamable HTTP endpoint, tool model, and
simulated Alexa+ experience.

Worked well: the open MCP requirement makes the integration portable and testable without gated
device tooling. The clear minimum spec/transport requirement helped define objective evidence.

Needs work: developers without Preview access need a first-party validation harness that checks
tool UX, voice constraints, authentication expectations, and Alexa-specific error behavior. The
gap between a standards-compliant MCP server and an Alexa-ready production integration is still
large.

Onboarding: straightforward for MCP concepts, less clear for production identity/account linking
when using the simulated-experience path.

Would build with it again: yes. MCP is a strong boundary for reusable assistant capabilities.

### Model Context Protocol TypeScript SDK

Used for: real server/client negotiation, Streamable HTTP, initialize, tools/list, tools/call, Zod
input validation, legacy compatibility, and browser evidence.

Worked well: shared typed contracts and the official handler made a genuine protocol integration
possible quickly. Automatic version negotiation was valuable.

Needs work: strict Node adapter types required a narrow cast, and the full browser client initially
created a large bundle. A documented browser-minimal entry and stricter Node HTTP types would help.

Onboarding: good once the current package split and transport lifecycle were understood.

Would build with it again: yes, with one server/transport instance per request and lazy browser loading.

### Amazon Bedrock Runtime SDK (optional adapter, disabled in submitted runtime)

Used for: a metadata-only classification adapter that never sends protected values. Real AWS
authorization failure paths were exercised; no paid successful inference is claimed.

Worked well: the SDK made request construction and failure handling explicit, and the model catalog
clearly exposed Nova metadata.

Needs work: model access UX changed while older guidance still referred to manual enablement. The
console now says serverless access is automatic on invocation, while account authorization can
still fail without a clear corrective action.

Onboarding: SDK integration was simple; account/model authorization diagnosis was the difficult part.

Would build with it again: yes for advisory metadata classification, never as the disclosure authority.

## Optional feature requests

1. First-party Alexa+ MCP conformance and voice-UX simulator — **critical**. Developers need to test
   authentication, errors, latency, voice-only output, and tool descriptions before Preview access.
2. Browser-minimal MCP TypeScript client — **important**. A smaller entry would improve integration
   workspaces and protocol evidence.
3. Standard privacy receipt and private-channel handoff primitives for Alexa+ — **important**.
   Shared-device developers should not reinvent cross-channel disclosure safety independently.

## Friction log summary

See `docs/friction-log.md` for full entries. The most important findings were a strict Node/MCP
adapter type mismatch, a prototype-key collision caught by property testing, and browser bundle
size from the complete MCP client. Each entry includes reproduction, severity, workaround, and an
actionable suggestion.
