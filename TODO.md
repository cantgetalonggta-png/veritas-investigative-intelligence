# Veritas Investigative Intelligence TODO

## Delivered in this package

### Mobile investigative dashboard
- [x] Portrait-first dark-mode neon dashboard with a Global Investigation Map treatment showing active cases, entities, and relationships.
- [x] Quick actions for Start New Case, Import Evidence, and View Leads.
- [x] Live feed with AI-assistive summaries and a visible encryption/anonymity status.

### Evidence Vault and Ethical Source Checker
- [x] Evidence Vault surface for documents, images, audio, video, notes, metadata, tags, cross-links, and chain-of-custody context.
- [x] Search and filter controls by evidence type and source status.
- [x] Color-coded provenance badges: green verified, yellow uncertain, red restricted.
- [x] Traceability details show source type, license, custody events, and recommended review action.
- [x] Import flow is represented as a working local interaction with a clear seam for secure server-side storage.

### Pattern Finder and analysis
- [x] Analysis Mode with recurring entities, financial trails, shared metadata, communication timing, locations, and anomaly insight cards.
- [x] Network graph treatment, legend, confidence scores, and filters for date, geography, and source credibility.
- [x] Human-review posture: insights are recommendations, not conclusions.

### Collaboration and Investigative Copilot
- [x] Collaboration Hub with secure-room status, contextual team activity, task board, roles, verification progress, and audit events.
- [x] Investigative Copilot screen with assistive chat, contextual prompt chips, source-aware response language, confidence, and logged AI-assist posture.
- [x] Voice-command affordance is represented without claiming native recording/transcription is complete.

### Package handoff and verification
- [x] File-system architecture, requirements, integration seams, and future production responsibilities documented for continued work with Grok.
- [x] Public Research route lets a researcher search a person, business, ticker, or domain from the dashboard and query public Wikidata entity records, SEC EDGAR registrants, GDELT news, and an optional managed X public-post connector in parallel.
- [x] Every public result retains a source label, source URL, provenance text, public-only marker, confidence score, and explicit unavailable-source warnings; the UI labels the output as a lead list rather than a finding.
- [x] Researchers can filter results by person/organization, save complete public-result records locally for follow-up, and see a visible public-data boundary before searching.
- [x] Live smoke verification exercised a real `Microsoft` lookup: Wikidata and SEC results rendered in the mobile UI, and unavailable GDELT/X sources were disclosed instead of being hidden.
- [x] CORS and API-origin handling support both managed Preview and fixed local Metro/API ports without weakening strict remote-origin checks.
- [x] Add a capability-based connector registry with explicit source capabilities, credential requirements, retention class, and runtime status.
- [x] Add safe public-record query templates with blocked credential/private-access patterns and provider-syntax notes.
- [x] Add historical-index discovery through Wayback/Common Crawl metadata, clearly labeled as historical leads rather than evidence.
- [x] Add an optional server-only Firecrawl acquisition adapter with credential-free public URL validation, timeout/size caps, and derivative-only labeling.
- [ ] Replace fixture data with authenticated case/evidence APIs and real object storage.
- [ ] Add production end-to-end encryption/key management and verified journalist/team membership.
- [ ] Add authenticated case capture for saved public leads, with encrypted storage and append-only audit events.
- [ ] Add production LLM provider routing, speech transcription, maps, and WebSocket collaboration.
- [ ] Add a case-scoped research watchlist with an explicit cadence, source scope, retention policy, and alert destination before creating any permanent background monitor. Do not run a blind recurring scraper.
- [ ] Enable Firecrawl only after adding DNS-aware egress controls, case authorization, quarantine, malware scanning, content hashing, and derivative/original custody records.
- [ ] Add connector-run persistence for exact queries, provider filters, latency, quota outcomes, retrieval timestamps, and audit links.
- [ ] Add native-device checks for camera, file picker, secure storage, notifications, haptics, deep links, and release builds.
