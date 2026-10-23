# Verification matrix

| Requirement | Implementation | Automated evidence | Manual evidence |
|---|---|---|---|
| Known fields receive sensitivity labels | `sensitivity.ts` | 38-case named-field decision table | Receipt category list |
| Unknown fields fail closed | `sensitivity.ts` | 1,000 property-generated cases, including prototype keys | Not needed |
| Shared health result is not spoken | `policy.ts`, `router.ts` | Policy/router and service leak tests | Shared-room workspace says neutral message |
| Unknown/guest/child is blocked | `policy.ts` | Audience table cases | Unknown-speaker workspace shows `BLOCKED` |
| Auth secrets are never released | `router.ts`, `handoff.ts` | Router and defense-in-depth handoff assertions | Private phone explicitly omits them |
| Private handoff is bound to profile | `handoff.ts`, `auth.ts` | Wrong-profile and signed-identity tests | Bob is denied in workspace |
| Handoff is one-time | `handoff.ts` | Replay and simultaneous-consume tests | Authorized phone consumes once |
| Handoff expires | `handoff.ts` | Fake-clock expiry test | Expiry time displayed |
| Explanation does not leak hidden value | `explanation.ts` | Explanation assertion | Safe `Why?` message visible |
| Receipt is redacted and accurate | `receipt.ts`, `service.ts` | Before/after handoff destination tests | Receipt visible without appointment content |
| Deletion requires confirmation | `deletion.ts` | Unconfirmed deletion test | UI presents separate confirmation step |
| Local and connector deletion are separate | `deletion.ts` | Partial failure and retry integration test | Result JSON has separate fields |
| MCP requirement is real | `mcp.ts`, `http.ts` | Official clients in legacy and auto modes | MCP traffic drawer shows negotiation/list/calls |
| Production UI and server compile | UI/server build configs | `npm run build` | Compiled server served UI and health locally |
| Dependency risk gate | package lock | `npm audit --audit-level=high` | Not applicable |
| Every sensitivity category has an audience matrix | `policy.ts` | 25 category/context assertions | Not needed |
| External authorization cannot relax local policy | `external-authorization.ts` | Allow/deny/error plus service integration tests | Receipt trace |
| AVP request contains no protected value | `audience-authorizer.ts` | Captured SDK request; profile ID hash assertion | Not needed |
| Private endpoint abuse is rate limited | `rate-limit.ts`, `http.ts` | Window reset and real HTTP 429 assertions | Safe retry message |
| Critical browser flows work end to end | `tests/e2e/quietbridge.spec.ts` | 3 real browser workflow tests | Same workspace used for product demo |
| WCAG serious/critical issues are gated | `tests/e2e/quietbridge.spec.ts` | axe scan; contrast regression fixed | Keyboard/focus styles visible |
| Free local handoffs survive restart securely | `encrypted-file-handoff.ts` | ciphertext, restart, replay, profile, expiry, revocation, wrong-key, and tamper tests | Encrypted mode is optional |
| Private HTTP access is authenticated | `auth.ts`, `http.ts` | valid, expired, modified, missing, wrong-key, deny-all tests | Production requires signed identity |
| Browser boundary is hardened | `http.ts`, `static-assets.ts` | hostile Origin, CSP, HEAD, traversal tests | Static product shell verified locally |
| Code quality remains bounded | `biome.json`, metrics script | complexity ≤15 and source files ≤350 lines | CI uses the same gate |

## Current verification result

- Typecheck: pass
- Test files: 9 passed
- Automated unit/integration tests: 87 passed
- Automated browser/accessibility tests: 4 passed
- Property-based generated examples: 1,000 per run
- MCP eras exercised: legacy 2025 and modern 2026
- High/critical npm audit findings: 0
- Statement/branch/function/line coverage: 88.50% / 78.21% / 92.98% / 89.81%
- Production UI and compiled server build: pass
- Compiled server static UI and health smoke test: pass
- Production missing-auth startup rejection: pass
- Biome lint and complexity gate: pass
- Secret scan: pass
- Serious/critical axe violations: 0

Testing provides strong evidence, not mathematical proof. Remaining production risks are listed
in `implementation-status.md` and must be resolved before handling real personal information.
