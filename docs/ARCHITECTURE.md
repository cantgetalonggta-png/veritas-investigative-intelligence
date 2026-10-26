# Veritas Architecture Handoff

## Current package

The delivered package is a functional Expo mobile prototype. It uses typed local fixtures to demonstrate the investigative workflow without placing credentials or sensitive data in the client. Every screen is ready to swap from fixtures to tRPC/API data.

## Runtime boundaries

- **Mobile client:** `app/`, `components/`, `shared/investigation-data.ts`. Owns layout, interaction state, filters, optimistic presentation, and redaction previews. It must never hold database credentials, storage presign credentials, or private model keys.
- **Application API:** `server/routers.ts` and future `server/investigations/*`. Owns authentication, authorization, case membership, evidence index, audit writes, signed upload/download URLs, copilot orchestration, source-check runs, and the public `research.search` procedure.
- **Public research adapter:** `server/research/public-research.ts` fans out to Wikidata, SEC EDGAR, GDELT DOC, and the optional managed X public-post API. Each normalized result retains a source label, public URL, provenance string, and confidence score. Upstream failures become explicit warnings instead of fabricated empty certainty.
- **Connector registry:** `server/research/registry.ts` declares capabilities, credential requirements, and retention boundaries for entity search, records, news, historical indexes, public posts, and document acquisition. The API exposes connector status so “unconfigured” is not confused with “no matches.”
- **Safe discovery:** `server/research/query-safety.ts` blocks credential/private-access targeting and emits provider-specific public-record templates. `server/research/historical-indexes.ts` searches Wayback/Common Crawl metadata as historical leads only; it never treats an indexed URL as proof of content.
- **Optional acquisition:** `server/research/firecrawl.ts` is a server-only, opt-in Firecrawl v2 Markdown derivative adapter. It requires `FIRECRAWL_API_KEY`, rejects credentialed/local/direct-IP URLs, caps response size/time, and labels output as derivative-only. Production must add DNS-aware egress controls, quarantine, malware scanning, and case authorization before enabling it.
- **Database:** Extend `drizzle/schema.ts` with `cases`, `caseMembers`, `evidenceItems`, `evidenceVersions`, `entities`, `relationships`, `insights`, `timelineEvents`, `tasks`, `messages`, `auditEvents`, and `copilotRuns`. Keep tenant ownership on every record.
- **Object storage:** Keep encrypted evidence bytes in managed object storage. Persist only stable object keys/URLs and hashes in the database. Use server-side presigned uploads after checking membership, file type, size, and malware/quarantine status.
- **AI adapters:** Put LLM, transcription, OCR, redaction, entity extraction, and source scoring behind interfaces in `shared/investigation-services.ts` or server-only adapters. Store prompts, model versions, input hashes, and outputs in `copilotRuns`/`auditEvents`.

## Recommended API shape

- `cases.list`, `cases.create`, `cases.get`
- `evidence.list`, `evidence.createUpload`, `evidence.completeUpload`, `evidence.get`, `evidence.annotate`, `evidence.createShare`
- `sourceChecker.evaluate`
- `analysis.runPatternFinder`, `analysis.insights`, `analysis.graph`
- `timeline.list`, `timeline.upsert`
- `collaboration.members`, `collaboration.tasks`, `collaboration.messages`, `collaboration.audit`
- `copilot.ask`, `copilot.summarize`, `copilot.suggestNextStep`
- `research.search` (currently public and source-cited; add case membership before attaching results to protected investigations)
- `research.capabilities`, `research.templates`, `research.historical` (safe discovery metadata and historical-index leads)

All protected procedures must enforce case membership and role permissions; never trust a case ID or evidence ID supplied by the client.

## Security gaps to close before handling real investigations

1. Implement real Manus OAuth session checks plus case-level authorization.
2. Add envelope encryption with per-case keys, device/key recovery, rotation, and secure deletion policy.
3. Add malware scanning/quarantine and immutable hash verification on upload.
4. Add source-license/consent workflows and manual review records; AI scores are not legal determinations.
5. Add append-only audit storage with export and monitoring.
6. Add secure notifications, expiring share links, revocation, and access logging.
7. Add a threat model and incident response runbook before production use.
8. Replace device-local saved research leads with an authenticated, encrypted `researchLeads`/evidence mutation and append-only audit event.
9. Add connector-run records with exact query, provider, filters, latency, status, quota outcome, and retrieval timestamp.

## Grok continuation order

1. Replace local fixture imports with tRPC hooks while preserving component props.
2. Add database tables and migrations, then case-scoped protected procedures.
3. Connect evidence upload to server validation and managed storage.
4. Implement source checker and copilot providers behind server-only adapters.
5. Add integration tests for authorization, evidence custody, upload completion, source-status transitions, and audit logging.
6. Add native device verification and release builds; do not treat Expo Web as proof that camera, notifications, secure storage, or deep links work on device.

## Background monitoring boundary

No permanent monitor is enabled in the current checkpoint. A broad recurring scraper would be unsafe and operationally meaningless without an explicit watchlist, cadence, jurisdiction/source scope, retention rule, and alert destination. The next production step is to add a case-scoped `researchWatchlists` table and protected CRUD procedures, then create a trigger that searches only those saved queries on an agreed schedule and writes source-cited deltas to the audit trail. Do not create a blind “swarm” that searches arbitrary people or businesses on a fixed timer.
