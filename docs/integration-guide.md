# Integration guide

## Connector adapter

Implement `ProtectedRecordConnector` from `apps/mcp-server/src/connector.ts`:

```ts
interface ProtectedRecordConnector {
  resolve(profileId: string): Promise<{
    source: string;
    simulatedSource: boolean;
    recordType: string;
    record: Record<string, string>;
  }>;
  deleteRequest(requestId: string): Promise<ConnectorDeletionStatus>;
}
```

The connector stays server-side. Do not send provider access tokens to the browser, MCP response,
model classifier, receipt, or logs. Add connector-specific field names to the deterministic
sensitivity map and keep unknown fields fail-closed.

## Identity adapter

The local integration workspace uses `DemoProfileAuthenticator` so wrong-profile behavior is easy
to demonstrate. Production mode instead requires `HmacBearerProfileAuthenticator`, which validates
the signature, issuer, audience, expiry, and subject using constant-time signature comparison.

In a real Alexa+ deployment, an account-linking/OIDC gateway should mint the signed assertion from
the authenticated customer identity. Do not expose `createProfileBearerToken` as a public route;
it exists for tests and a trusted identity service.

## Channel adapters

- Shared voice/display receives only `spokenText` and `visualText`.
- A private companion channel receives the opaque handoff token and exchanges it over POST after
  authentication.
- Receipts display category and destination metadata, never protected values.
- Deletion requires explicit confirmation and reports local and connector results separately.

## Production configuration

`QB_RUNTIME_MODE=production` enforces required safeguards at startup:

- `QB_AUTH_HMAC_KEY_BASE64`: separate 32+ byte authentication key;
- `QB_ENCRYPTED_HANDOFF_PATH` and `QB_ENCRYPTION_KEY_BASE64`;
- `QB_TRUSTED_HOSTS` and `QB_ALLOWED_ORIGINS`;
- authenticated access to both MCP and private consumption;
- production UI served from `QB_STATIC_ROOT` or `apps/simulator/dist`.

Use different values for authentication and encryption keys. Terminate TLS at a trusted reverse
proxy and store keys in the deployment platform's secret manager, not an image or repository.

## Container build

```bash
docker build -t quietbridge .
docker run --rm -p 3100:3100 \
  -e QB_RUNTIME_MODE=production \
  -e QB_BIND_HOST=0.0.0.0 \
  -e QB_TRUSTED_HOSTS=quietbridge.example.com \
  -e QB_ALLOWED_ORIGINS=https://quietbridge.example.com \
  -e QB_AUTH_HMAC_KEY_BASE64=... \
  -e QB_ENCRYPTED_HANDOFF_PATH=/data/handoffs.enc.json \
  -e QB_ENCRYPTION_KEY_BASE64=... \
  -v quietbridge-data:/data \
  quietbridge
```

The command is an example. Never place real secrets in shell history; use the host's secret
injection mechanism.
