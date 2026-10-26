# Veritas release gates and troubleshooting

## Current status

**Status: upgraded prototype; production release remains blocked for sensitive investigations.** The package has a working public research route and governed discovery seams, but the fixture-backed case workspace is not yet an authenticated evidence system.

## Required verification gates

Run these from `/home/ubuntu/veritas`:

```bash
pnpm install --prefer-offline
pnpm db:push
pnpm check
pnpm lint
pnpm test
pnpm build
pnpm dev
```

Then verify:

- Metro/Web responds on `8081`.
- API responds on `3000`.
- `/manus-routes.json` returns JSON and includes every page route.
- A harmless public query such as `Microsoft` returns source-cited Wikidata/SEC results when upstreams are available.
- Unavailable GDELT/X/archive connectors appear as warnings rather than empty certainty.
- Credential/private-access search patterns are rejected.
- Historical-index results are labeled `historicalOnly` and never presented as verified evidence.
- Firecrawl remains `unconfigured` unless a server-only secret and acquisition controls are explicitly enabled.

## Production blockers

Do not enable sensitive case work until all of the following are implemented and tested:

1. Real OAuth session validation and case-level membership/role enforcement.
2. Per-case key management with documented trust boundaries, rotation, revocation, recovery, and backup/key-destruction policy. Do not call server-decryptable envelope encryption “end-to-end encryption.”
3. Quarantine, malware scanning, content-type/size checks, immutable hashes, and an auditable admission state machine before evidence reaches the vault.
4. Source-license/consent review, jurisdictional rules, retention/legal-hold policy, and deletion/backup-expiry policy.
5. Append-only audit storage for connector runs, evidence mutations, copilot actions, sharing, and access.
6. Authenticated encrypted persistence for saved research leads; device-local storage is prototype-only.
7. Staging deployment, rollback procedure, recovery drill, and native Android/iOS checks for camera, file picker, secure storage, notifications, haptics, and deep links.

## Troubleshooting

### Metro exits with `DependencyGraph._onHasteChange` / `addedFiles`

This is a Metro/nativewind hot-reload graph failure observed during broad file edits, not a TypeScript application error. Stop the watcher and restart `pnpm dev` cleanly. Verify `pnpm check`, `pnpm lint`, `pnpm test`, and `pnpm build` before using Preview again. Do not infer a production failure from this development watcher crash.

### Public source is unavailable

The connector contract intentionally returns `unavailable`, `unconfigured`, or `rate_limited` instead of turning a failed source into zero matches. Check upstream availability, timeout budgets, fair-access requirements, and provider credentials. Do not retry aggressively or remove the warning.

### Firecrawl setup

Set `FIRECRAWL_API_KEY` only as a server secret. Before enabling acquisition, add DNS-aware egress controls, redirect/response-size limits, quarantine and malware scanning, case authorization, original/derivative hashes, and retention/audit records. Never send private case narrative, session cookies, or internal authorization headers to the acquisition provider.

### Historical-index result interpretation

Wayback/Common Crawl records are URL-discovery metadata. The original or archived page must be reviewed manually, captured under an authorized case workflow, and preserved with its own custody/hash record before it can be treated as evidence.
