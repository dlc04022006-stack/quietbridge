# Amazon Verified Permissions boundary

## Purpose

QuietBridge's TypeScript policy remains the final disclosure authority. The
optional Amazon Verified Permissions (AVP) call adds a centralized identity and
authorization check for protected records. It cannot turn `PRIVATE`, `REDACTED`,
or `BLOCKED` into `PUBLIC`.

The combination rule is intentionally one-way:

| Local decision | AVP result | Final result |
|---|---|---|
| Any non-blocked result | `ALLOW` | Keep the local result unchanged |
| Any non-blocked result | `DENY` | `BLOCKED` |
| Any non-blocked result | Error/invalid | `BLOCKED` |
| `BLOCKED` | Not called | `BLOCKED` |

## Metadata sent

The AVP request contains:

- a SHA-256 hash of the profile ID;
- profile type;
- identity confidence as an integer from 0–1000;
- shared/private device context;
- whether the requester matches the resource owner;
- sensitivity category names;
- whether an unknown field was present.

It does not contain the original profile ID, room name, request text,
appointment values, handoff token, or authentication secrets. The receipt marks
`valuesSent: false` and `principalIdHashed: true`.

## Cloud policy

The Cedar template is in
`infrastructure/verified-permissions/quietbridge.cedar`. It permits processing
only for an adult, matching owner with identity confidence of at least 0.8. A
forbid rule explicitly rejects all other contexts.

No AVP policy store has been provisioned yet. Creating one changes the AWS
account and may incur usage charges, so it requires explicit confirmation.

After a policy store and validated schema/policy exist, configure:

```text
QB_AVP_ENABLED=true
QB_AVP_POLICY_STORE_ID=<policy-store-id-or-alias>
AWS_REGION=ap-south-1
AWS_PROFILE=quietbridge
```

If `QB_AVP_ENABLED=true` without a store ID, the server refuses to start rather
than silently pretending that cloud authorization is active.
