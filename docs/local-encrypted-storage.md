# Free local encrypted handoff storage

QuietBridge can preserve short-lived private handoffs across a local server restart without using
a paid cloud service. The store uses AES-256-GCM, writes only SHA-256 token hashes, and rejects a
file that was modified or opened with the wrong key. Authentication-secret fields are removed
before storage.

## Enable it locally

Generate a new 32-byte key on the development machine:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Set both variables in a private `.env` or in the shell that starts the server:

```text
QB_ENCRYPTED_HANDOFF_PATH=.quietbridge/handoffs.enc.json
QB_ENCRYPTION_KEY_BASE64=<generated base64 key>
```

Then run `npm run dev`. The path and key must be supplied together. Never commit the key or the
encrypted data file; the repository ignores `.env`, `.quietbridge/`, and `*.enc.json`.

## Security boundary

- This mode is for one local QuietBridge process. It does not implement distributed locking.
- Losing the key makes existing handoffs unrecoverable.
- Rotating the key requires revoking or expiring existing handoffs first.
- Complete request and receipt state remains in memory in this edition; only private handoffs persist.
- The store does not replace operating-system account security or full-disk encryption.

Automated tests cover ciphertext-at-rest, restart recovery, one-time consumption after restart,
wrong-profile rejection, expiry, revocation, wrong-key failure, tamper detection, and removal of
authentication-secret fields.
