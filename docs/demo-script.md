# Three-minute working-product demonstration

## 0:00–0:25 — Product and problem

“QuietBridge is a privacy-delivery layer for assistants used in shared rooms. It sits between an
Alexa+ capability and its output channels, so sensitive data never has to be spoken publicly.”

Show the architecture in `docs/product-architecture.md`, then open the integration workspace.

## 0:25–1:15 — Real protected flow

Keep Alice recognized and the Living Room shared. Choose **Run protected request**. Point out:

- real MCP `initialize`, `tools/list`, and `tools/call` activity;
- the `PRIVATE` policy result;
- neutral voice output with no appointment value;
- a short-lived private result;
- wrong-profile denial for Bob, followed by successful verification for Alice.

State clearly that Alexa, identity, phone, and calendar are test adapters while the MCP server,
policy, token, expiry, replay, receipt, and deletion code are real.

## 1:15–1:55 — Accountability and deletion

Open the privacy receipt and show categories, destination, model-use trace, and `valuesSent: false`.
Show that it contains no appointment value. Delete the request, confirm it, and show separate local
and connector outcomes plus immediate token revocation.

## 1:55–2:30 — Unsafe contexts and fail-closed behavior

Switch the identity signal to Unknown and run again. Show `BLOCKED` and the absence of a private
handoff. Briefly mention the 38-field map and 1,000 generated unknown-field cases.

## 2:30–3:00 — Integration and evidence

Show the connector contract and explain that any calendar, health, commerce, or account connector
can use the same layer. End with the quality evidence: complexity ≤15, coverage thresholds, 0
serious/critical accessibility violations, 0 production dependency vulnerabilities, signed
authentication boundary, encrypted handoff option, and container packaging.

Do not claim access to gated Alexa+ SDKs, real Voice ID, a deployed AWS service, or real customer
data. The strongest demo is one whose trust boundary is explicit.
