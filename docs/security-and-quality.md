# Security and code-quality gates

## Automated quality policy

`npm run quality` is the publish gate and CI runs the same command.

| Metric or gate | Enforced value |
|---|---:|
| TypeScript | strict, exact optional properties, no unchecked indexed access |
| Cognitive complexity | maximum 15 per function |
| Source file length | maximum 350 lines |
| Statement coverage | at least 85% |
| Branch coverage | at least 70% |
| Function coverage | at least 90% |
| Line coverage | at least 85% |
| Accessibility | zero serious/critical axe violations |
| Dependencies | zero high/critical production audit findings |
| Credentials | high-confidence local secret scan |

The current code also has a strict production compilation, a two-chunk lazy-loaded UI build, real
MCP contract tests, property tests, integration tests, and browser flows.

## Baseline security controls

- Deny-all private authentication unless an authenticator is explicitly configured.
- Signed, expiring profile assertions with issuer and audience checks.
- 256-bit random one-time handoff tokens; only SHA-256 token hashes are stored.
- Optional AES-256-GCM local persistence with tamper detection and atomic replacement.
- Authentication-secret filtering at routing and storage boundaries.
- Host and Origin allowlists.
- CSP, frame denial, no-sniff, no-referrer, restrictive permissions policy, and no-store API data.
- JSON and MCP body-size limits.
- Per-client endpoint rate limiting.
- Generic external errors and content-free operational logs.
- Confirmed deletion and immediate handoff revocation.
- Container runs as an unprivileged user.

## Honest production boundary

The repository is publishable as an open-source product, integration reference, and hackathon
entry. It should not process real customer health or financial data until the deployment supplies
real Alexa/account-linking identity, HTTPS, managed secrets, distributed transactional storage and
rate limiting, monitored backups/retention, and an independent security review. These are
deployment responsibilities that cannot be truthfully simulated in source code.
