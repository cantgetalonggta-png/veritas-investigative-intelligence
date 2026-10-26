# Grok hands-off activation and continuation

This repository is intentionally organized so Grok can inspect, edit, verify, and run the app without reconstructing the architecture from chat history.

## One-command activation

From the repository root:

```bash
bash scripts/grok-activate.sh
```

The script performs the following sequence:

1. Verifies Node.js and pnpm/Corepack are available.
2. Runs `pnpm install --prefer-offline` using the committed `pnpm-lock.yaml`.
3. Runs `pnpm db:push` only when `DATABASE_URL` or `DRIZZLE_DATABASE_URL` is present. It skips database DDL when no DSN is available so the fixture-backed app remains runnable.
4. Runs `pnpm check`.
5. Runs `pnpm lint`.
6. Runs `pnpm test`.
7. Runs `pnpm build`.
8. Starts the Expo Metro/Web frontend and API together with `nohup pnpm dev`.
9. Writes the background PID to `.grok-dev.pid` and logs to `.grok-dev.log`.
10. Waits for both `http://127.0.0.1:8081/manus-routes.json` and `http://127.0.0.1:3000/api/health` before returning success.

The script reuses already healthy ports and does not launch duplicate development processes.

## Background controls

```bash
# Inspect the current background process
cat .grok-dev.pid 2>/dev/null || true
ps -fp "$(cat .grok-dev.pid)" 2>/dev/null || true

# Follow logs
tail -f .grok-dev.log

# Stop the process when needed
kill "$(cat .grok-dev.pid)" 2>/dev/null || true
rm -f .grok-dev.pid
```

The development app uses Metro/Web `8081` and the API `3000`. The managed published app is separate from this local background process.

## What Grok should learn first

Read these in order:

1. `README.md` — commands, deployment contract, and security boundary.
2. `plan.md` — approved design and project structure.
3. `TODO.md` — completed outcomes and unresolved production work.
4. `docs/requirements.md` — normalized product requirements from the original brief.
5. `docs/ARCHITECTURE.md` — server/client boundaries and integration seams.
6. `docs/RELEASE_GATES.md` — production blockers and troubleshooting.
7. `server/research/registry.ts` and `shared/research.ts` — connector capabilities and status contract.
8. `app/search.tsx` and `server/research/public-research.ts` — the working public research flow.

Keep the existing separation: mobile UI in `app/` and `components/`, typed contracts in `shared/`, server integrations in `server/`, database definitions in `drizzle/`, regression checks in `tests/`, and operational documentation in `docs/`.

## Missing inputs that must be supplied by the operator

The repository cannot safely invent these values:

- A managed or external `DATABASE_URL` for durable case/evidence state.
- Authentication/provider configuration for production identity and case membership.
- A server-only `FIRECRAWL_API_KEY` if document acquisition is explicitly enabled.
- Any optional managed X/public-post connector entitlement.
- Native Android/iOS build credentials and device/test distribution settings through the managed Dashboard.
- Jurisdiction, retention, legal-hold, consent, and source-license policies for real investigations.
- Storage/key-management provider decisions for encrypted evidence custody.
- Malware scanning/quarantine provider and incident-response ownership.

Never put these values in the mobile bundle, ZIP archive, Git history, or `.env` files that are shared with Grok.

## What is already active

- Expo/React Native/TypeScript mobile frontend.
- Express/tRPC API on port 3000.
- Public research across Wikidata and SEC EDGAR, with optional GDELT and managed X.
- Safe public-record query templates with blocked credential/private-access patterns.
- Historical-index discovery seams for Wayback/Common Crawl.
- Optional server-only Firecrawl derivative adapter, intentionally unconfigured.
- Production Dockerfile and `/api/health` readiness endpoint.
- Typecheck, lint, tests, and server bundle build.

## What remains before sensitive production use

Grok must not mark these complete without implementation and evidence:

1. OAuth/session validation and case-level role authorization.
2. Authenticated persistence for cases, evidence, research leads, tasks, messages, and audit events.
3. Per-case key management, rotation, recovery, revocation, and documented trust model.
4. Evidence quarantine, malware scanning, content validation, immutable hashes, and admission transitions.
5. Append-only audit records for every mutation, connector run, copilot action, share, and access.
6. Source-license/consent review and jurisdiction/retention enforcement.
7. Expiring share links and access logging.
8. Staging deployment, rollback, backup/recovery drill, performance budgets, and observability.
9. Real-device validation for camera, file picker, secure storage, notifications, deep links, and haptics.

## Safe editing loop for Grok

```bash
# edit one bounded feature
pnpm check
pnpm lint
pnpm test
pnpm build

# start/restart the full local environment
bash scripts/grok-activate.sh
```

Do not use `pnpm db:push` against a shared production database as an exploratory command. Prefer reviewed additive migrations once durable schema work begins. Do not run blind recurring scrapers; create case-scoped watchlists with explicit cadence, source scope, retention, and alert destination first.
