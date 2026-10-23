# Hackathon friction log

## FL-001 — Node/MCP adapter type mismatch

- Task: mount the official MCP v2 handler on Node HTTP with strict TypeScript settings.
- Expected: Node's `IncomingMessage` should directly satisfy the adapter's public input type.
- Actual: with `exactOptionalPropertyTypes`, Node declares `method` as possibly undefined while
  the MCP structural type requires it.
- Severity: low; compile-time integration friction.
- Workaround: perform a narrow, documented cast only at the adapter boundary. Runtime requests
  from `createServer` always have a method.
- Suggestion: align the adapter input type with Node's upstream declaration or provide an official
  helper whose signature accepts `IncomingMessage` directly under strict optional typing.

## FL-002 — Prototype-key collision found by property testing

- Task: classify every unrecognized structured field as personal.
- Expected: arbitrary field names should fall back to `PERSONAL`.
- Actual: `toString` initially resolved through `Object.prototype`, producing a function instead
  of a sensitivity label.
- Severity: high for a fail-closed privacy classifier.
- Workaround/fix: require `Object.hasOwn` before accepting a configured rule.
- Suggestion: use own-property-safe maps in security examples and include prototype keys in
  classifier test corpora.

## FL-003 — Browser MCP client bundle size

- Task: demonstrate real MCP calls directly from the simulator.
- Expected: a small browser bundle.
- Actual: the complete official client and validation stack produce a roughly 537 kB minified
  JavaScript chunk before gzip.
- Severity: low for a hackathon simulator; relevant for production performance.
- Workaround: accept for the evidence-focused prototype. Production can proxy calls through a
  thin backend-for-frontend or code-split the developer drawer.
- Suggestion: publish a documented browser-minimal MCP client entry for simple Streamable HTTP
  tool/list and tool/call demonstrations.
