## Why I built this

I kept coming back to one awkward moment: an assistant in a living room can know the right answer and still choose the wrong place to say it. A medical appointment, bank balance, address, or account detail may be useful to the person who asked, but uncomfortable or harmful when it is spoken to everyone nearby.

Most assistant demos focus on getting the answer. I wanted to work on the decision that comes immediately after that: **where is this answer safe to go?**

That became QuietBridge.

## What it does

QuietBridge sits between a data source and an assistant's output channels. It looks at the fields in a result, the recognized profile, and whether the device is in a shared or private space. It then makes one of three decisions:

- **PUBLIC**: safe information can be spoken normally.
- **PRIVATE**: Alexa gives a neutral response and the protected result moves to a short-lived private handoff.
- **BLOCKED**: if identity or classification is uncertain, nothing sensitive is released.

The private handoff is profile-bound, expires, and can be consumed only once. QuietBridge also creates a privacy receipt that explains the decision without copying the protected value into the receipt. Deletion reports local and connector outcomes separately instead of pretending that one delete button erased every downstream copy.

## What is real, and what is simulated

I wanted the demo to be honest about its boundary. The Alexa screen, identity signal, phone view, and sample calendar record are test adapters built for the hackathon. They do not claim access to real Alexa Voice ID or customer data.

The underlying product is real: a self-hosted MCP server using Streamable HTTP, five MCP tools, the field classifier, audience policy, one-time handoff, redacted receipt, deletion flow, authentication boundary, encrypted local persistence option, and security controls all run as working code. The activity panel shows the actual MCP `initialize`, `tools/list`, and `tools/call` traffic.

## How I built it

I used TypeScript throughout. The MCP server uses the official Model Context Protocol SDK. The integration workspace is React and Vite. A connector interface keeps the privacy layer independent from any one calendar, health, commerce, or account system.

The policy is deliberately deterministic and fail-closed. An optional Amazon Bedrock adapter can classify field metadata, but it never receives field values and it cannot weaken the local decision. Because I committed to a free-only submitted runtime, the paid AWS adapters remain disabled and I am not entering the AWS Builder mini challenge.

For production mode, QuietBridge requires authenticated MCP and private-result access, trusted hosts, allowed origins, and encrypted persistence. It also adds signed expiring identity assertions, constant-time credential comparison, request-size limits, rate limits, security headers, and token hashing.

## The hardest parts

The hardest part was not hiding text in the interface. It was keeping sensitive values out of every secondary path: spoken output, explanations, receipts, logs, optional model calls, persistence, and error messages.

Another challenge was making deletion truthful. Local state can be deleted immediately, but a connector may confirm, reject, or fail independently. Modeling those states separately made the interface less magical, but much more trustworthy.

I also spent time drawing a firm line between the real privacy layer and the simulated device surfaces. That made the demo less flashy than pretending everything was connected to a production Alexa account, but it made the result reproducible and reviewable.

## What I am proud of

The repository has 87 automated unit, integration, security, and contract tests plus four browser flows. Statement coverage is 88.5%. The browser tests found no serious or critical accessibility violations, and the production dependency audit reports zero vulnerabilities. The demo covers the happy path, a wrong-profile denial, one-time private consumption, deletion, and an unknown-identity block.

More importantly, the same connector contract can protect results from very different domains. QuietBridge is not tied to the invented cardiology example.

## What I learned

Privacy is easier to reason about when it is treated as a delivery decision, not a collection of UI warnings. The safest default is also the simplest one to test: unknown means private or blocked, never public.

I also learned that an audit record is only useful when it is safe to keep. A receipt that repeats the secret is another leak.

## What's next

The next step is to connect QuietBridge to an approved Alexa+ development environment and replace each test adapter with the corresponding production identity, device-context, private-channel, and data connectors. I would also add household policy controls, an SDK for connector authors, and independent security review before handling real customer data.
