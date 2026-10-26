# Veritas Investigative Intelligence

Veritas is a mobile-first investigative journalism workspace built on the managed Expo Router / React Native / TypeScript starter. The current package combines local deterministic fixtures for the Northstar Ledger case with a live, source-cited public research route for names, organizations, tickers, and domains. It includes governed connector metadata, safe public-record query templates, historical-index discovery, an optional server-only Firecrawl acquisition seam, the briefing dashboard, Evidence Vault, Ethical Source Checker presentation, Pattern Finder, Collaboration Hub, Investigative Copilot, and public research.

## Run it

```bash
pnpm install --prefer-offline
pnpm db:push
pnpm dev
```

Metro/Web runs on `8081` and the API runs on `3000`. Open the managed Preview or connect Expo Go from the Dashboard; do not hardcode the generated preview hostname.

## Production container

The managed deployment uses [`Dockerfile`](Dockerfile), listens on `PORT` with `3000` as the default, and exposes `/api/health` for readiness. The container installs from the committed `pnpm-lock.yaml`, runs `pnpm build`, and starts `dist/index.js`. Runtime secrets such as `DATABASE_URL`, OAuth values, `MANUS_*` credentials, and an optional `FIRECRAWL_API_KEY` must be supplied by the deployment environment; none are copied into the client bundle or image source.

## Verify it

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
```

The package currently passes TypeScript, lint, the service-seam tests, and the server bundle build. The test suite includes the starter CORS coverage, source filtering, restricted-evidence quarantine behavior, metadata review, copilot guardrails, public-research normalization, and governed-query safety. The live research smoke test was exercised with a real `Microsoft` query; Wikidata and SEC results rendered, while unavailable GDELT/X sources were disclosed in the UI.

## Continue with Grok

Start with [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), then [`TODO.md`](TODO.md) and [`docs/RELEASE_GATES.md`](docs/RELEASE_GATES.md). The public research route is `app/search.tsx`, backed by `server/research/public-research.ts` and `research.search` in `server/routers.ts`. It queries Wikidata and SEC EDGAR directly, treats GDELT and historical indexes as optional public sources, uses the managed X search API only when configured, and exposes safe provider-specific templates without credential/private-access targeting. Firecrawl remains unconfigured until a server secret and production acquisition controls are explicitly enabled. Keep credentials server-only and preserve the visible distinction between verified evidence, uncertain leads, and restricted data.

Grok can continue editing the repository directly from the source tree. Preserve the existing folders and boundaries: `app/` for mobile routes, `components/` for shared UI, `shared/` for typed domain contracts, `server/` for protected integrations, `drizzle/` for schema, `tests/` for regression coverage, and `docs/` for requirements and release gates. For hands-off local activation, run [`scripts/grok-activate.sh`](scripts/grok-activate.sh) and read [`docs/GROK_AUTOMATION.md`](docs/GROK_AUTOMATION.md). After changes, run `pnpm check`, `pnpm lint`, `pnpm test`, and `pnpm build`. Do not commit `node_modules`, `.env` files, generated `dist/`, or runtime secrets.

## Release handoff

The managed mobile project is ready for an accepted checkpoint and Dashboard native build. Android APK/AAB and iOS/TestFlight artifacts must be built from the accepted source/configuration in the Dashboard; a successful Expo Web Preview does not prove native camera, notifications, secure storage, haptics, deep links, or file-picker behavior. Perform those native checks on a real device before handling real investigative material.

## Important security boundary

Do not use the fixture-backed case workspace with real sensitive material yet. Public-research results are real public records, but they are lead lists rather than findings. Production use requires authenticated case membership, envelope encryption and key recovery, malware/quarantine scanning, source-license and consent workflows, append-only audit storage, expiring share links, incident response procedures, and independent editorial review. The current UI intentionally labels AI output as assistive and keeps the source trail visible.
