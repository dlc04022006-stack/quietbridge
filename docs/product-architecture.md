# QuietBridge product architecture

## Product definition

QuietBridge is a reusable privacy-delivery layer between an assistant or agent and its output
channels. It is not an Alexa clone and it is not a prompt wrapper. A connector retrieves a record;
QuietBridge classifies every field, evaluates the authenticated audience and device context, and
creates separate public and private outputs before any text reaches a speaker or display.

```text
Alexa+ / agent / application
          |
          | MCP Streamable HTTP
          v
  QuietBridge control plane
  ├─ connector adapter
  ├─ sensitivity map (fail closed)
  ├─ audience policy
  ├─ output router
  ├─ one-time private handoff
  ├─ privacy explanation + receipt
  └─ deletion/revocation coordinator
          |                         |
          v                         v
 safe shared output       authenticated private channel
```

## How it is added as a layer

1. Implement `ProtectedRecordConnector.resolve(profileId)` and `deleteRequest(requestId)` for the
   product's existing calendar, health, commerce, or account API.
2. Map the platform's trusted identity, confidence, device, room, and audience signals into
   `AudienceContext`.
3. Call the real MCP tools in order: resolve, evaluate, optionally create a private handoff, obtain
   a receipt, and delete when requested.
4. Send only `spokenText` and `visualText` to shared channels. Never bypass the output router.
5. Open private results only after the companion channel supplies an authenticated principal. In
   production, QuietBridge ignores caller-supplied profile claims and derives the profile from a
   signed bearer token.

The included simulated calendar proves the adapter contract. The service integration test also
plugs in a banking-style connector without changing any policy code.

## What is distinctive

The individual building blocks—classification tables, policy engines, signed tokens, audit
receipts, and deletion APIs—exist elsewhere. QuietBridge's contribution is their composition at the
assistant output boundary:

- disclosure is decided before language generation and before channel delivery;
- one decision creates mutually consistent public and private outputs;
- authentication secrets are excluded independently by both routing and storage;
- unknown metadata can never become public through a model suggestion;
- every decision produces a content-free explanation and receipt;
- deletion revokes outstanding delivery capability and reports downstream failure honestly;
- the same layer is exposed through real MCP rather than being tied to one Alexa UI.

This is stronger than telling an LLM to “be private,” because the model and client are not trusted
to approve disclosure.

## Why it is difficult to build correctly

The hard part is not the decision enum. It is maintaining one security invariant across identity,
classification, speech, visuals, private delivery, retries, expiry, replay, deletion, logs, and
external services. A small inconsistency can expose the original value after the public response
looked safe. QuietBridge therefore uses deterministic policy, defense-in-depth filtering,
single-consumer tokens, fail-closed adapters, and executable evidence for the complete flow.

It does not claim new cryptography or universal privacy correctness. Its innovation is an
auditable, channel-aware control plane and integration contract for shared conversational devices.
