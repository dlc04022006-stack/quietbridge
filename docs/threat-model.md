# QuietBridge threat model

## Protected assets

- Sensitive appointment fields.
- Authentication-secret fields, which must never be released.
- Private handoff bearer tokens.
- Profile identity and audience context.
- Privacy receipts and deletion state.

## Trust boundaries

```text
Untrusted browser/assistant context
        |
        | MCP calls and private consume request
        v
QuietBridge HTTP/MCP boundary
        |
        | validated structured inputs
        v
Server-side policy and routing boundary
        |
        +---- protected request store
        +---- one-time encrypted handoff store
        +---- replaceable downstream connector
```

The integration workspace, MCP caller, connector, and model are not trusted to mark information safe. Only the
server-side sensitivity map and audience policy control disclosure.

## Primary threats and controls

| Threat | Current control | Evidence |
|---|---|---|
| Model/client labels a secret as public | Server reclassifies stored fields; caller never supplies labels | MCP and policy tests |
| Unknown field bypasses classification | Own-property lookup and default `PERSONAL` classification | 1,000 property-generated fields |
| Shared-room disclosure | Health/financial data routes to private handoff | Router leak test and live UI |
| Wrong person opens private handoff | Signed bearer identity plus profile-bound server-side token record | Auth, HTTP, and browser tests |
| Token guessing | 256-bit random opaque token; hash stored | Code review and token tests |
| Token copied/replayed | Atomic one-time consume and short expiry | Replay/concurrency/expiry tests |
| Auth secret slips into private payload | Router filtering plus handoff-store defense-in-depth filter | Two independent assertions |
| Token or payload leaks through URL/log | POST body; no token/value logging; debug UI redacts token | HTTP code and live debug drawer |
| Cross-client response leak | Fresh MCP server instance per request through official v2 handler | Legacy/modern concurrent-safe architecture |
| Deletion overclaims success | Separate local and connector status; retryable partial failure | Deletion integration test |
| Unauthorized deletion retry | Content-free request-owner tombstone retained | Service authorization code |
| Malformed/oversized request | Zod schemas and explicit body-size limits | MCP SDK validation and HTTP code |
| Browser origin/host abuse | Explicit Host and Origin allowlists | HTTP boundary tests |
| Clickjacking/content injection | CSP, frame denial, no-sniff, permissions, and referrer headers | HTTP/static asset tests |
| Accidentally insecure deployment | Production startup requires auth, encrypted handoffs, host and origin configuration | Startup configuration |
| Repository credential leak | Local high-confidence secret scan in the quality gate | `npm run security:secrets` |

## Known deployment limitations

- The included Alexa identity signals and companion UI are test adapters, not Alexa production authentication.
- Protected request and receipt objects are in process memory; handoffs have optional encrypted persistence.
- The one-time consume operation is atomic only inside one Node process. A deployed multi-instance
  service must use a transactional conditional write.
- The built-in limiter is single-process; multi-instance deployment needs a shared limiter.
- The application serves HTTP and expects a trusted deployment proxy to terminate HTTPS.
- No real customer data may be used until authentication, storage encryption, retention,
  operational logging review, and an external security review are complete.

## Deployment controls still required

1. OAuth/OIDC and trusted server-derived profile identity.
2. DynamoDB conditional consume/delete or an equivalent transactional store.
3. KMS-backed application-level encryption for any persisted protected payload.
4. HTTPS, restrictive CORS/origin policy, WAF/rate limiting, and secret management.
5. Content-free operational telemetry with access controls and retention limits.
6. OWASP ASVS Level 2 review and independent penetration testing before real-data use.
