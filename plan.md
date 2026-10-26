# Veritas Investigative Intelligence Implementation Plan

> **For agentic workers:** Implement the approved mobile starter in small, testable slices. The app is a functional prototype with explicit seams for production storage, authentication, AI, and collaboration services.

**Goal:** Deliver a polished mobile-first investigative journalism workspace that lets a reporter orient on active cases, inspect evidence provenance, review detected patterns, collaborate with a team, and query an investigative copilot using realistic demo data.

**Architecture:** Keep the fixed Expo Router / React Native / TypeScript / NativeWind starter. Use route-level screens for Home, Vault, Analysis, and Team, with shared domain models and UI primitives under `shared/` and `components/`. Use the existing Express/tRPC/Drizzle server as the future backend seam; this first package renders deterministic local fixtures and exposes typed service boundaries so Grok can connect real storage, AI, maps, and collaboration later without rewriting the UI.

**Tech Stack:** Expo Router, React Native, TypeScript, NativeWind, Material Icons, Express/tRPC, Drizzle/MySQL, Vitest, pnpm.

**Spec:** `/home/ubuntu/upload/Document_Merged.pdf` and its extracted product requirements captured in `docs/requirements.md`.

## Global Constraints

- Portrait-first mobile UX with one-handed interactions and a dark-mode neon aesthetic.
- The app must distinguish verified evidence, uncertain leads, and restricted material.
- AI suggestions amplify human judgment; the UI must show confidence and provenance rather than present conclusions as facts.
- Keep secrets, storage credentials, model credentials, and authenticated server operations out of the native/web bundle.
- Keep the fixed managed mobile runtime on Metro 8081 and API 3000.
- Use local/demo data for the prototype while preserving typed seams for production integrations.

## Review Focus

- Evidence with a restricted source status must remain visibly restricted and never be presented as verified.
- Empty or filtered case states must remain understandable and actionable.
- Long evidence titles, narrow phone widths, and dense network data must not overflow the portrait layout.
- Copilot responses must retain an explicit "assistive draft" posture and show confidence/context.
- Native and web interactions must use React Native primitives that work on both surfaces.

## Design Direction

### Style options considered

- Neon-noir newsroom OS: restrained cyan/indigo signals on charcoal with evidence-first density (0.06).
- Holographic command deck: layered glass cards and brighter spectral accents (0.04).
- Field notebook minimalism: warm paper contrast with a forensic data layer (0.03).

### Chosen style: Neon-noir newsroom OS

- **Design Movement:** Cyber-noir information design, adapted from newsroom dashboards and mission-control interfaces.
- **Core Principles:** Evidence before decoration; high signal-to-noise; status is always legible; interaction stays calm under pressure.
- **Color Philosophy:** Near-black graphite reduces eye strain; cyan is the ownable signal for verified intelligence; violet marks analysis; amber flags uncertainty; red is reserved for restriction and risk.
- **Layout Paradigm:** A vertical command rail with asymmetric signal cards, a persistent bottom navigation rail, and short horizontal evidence strips instead of centered dashboard grids.
- **Signature Elements:** Hairline cyan dividers, circular confidence rings, and compact monospace metadata labels.
- **Interaction Philosophy:** Every tap either opens context, changes a filter, or records an intentional review action. Destructive or sensitive actions require a clear second step.
- **Animation:** Use short 150–220ms fades and scale responses on cards; avoid looping decoration; animate graph focus and status transitions only when they clarify change.
- **Typography System:** System sans for readable headlines and body copy; monospace for IDs, timestamps, confidence, and chain-of-custody metadata. Hierarchy: 28/34 hero, 18/24 section title, 14/20 body, 11/14 metadata.
- **Brand Essence:** A secure field desk for reporters who need to see the signal without losing the source trail. Personality: exacting, calm, alert.
- **Brand Voice:** Headlines are concise and operational. CTAs name the next investigative action. Example lines: “Trace the signal.” and “Review provenance before you publish.”
- **Wordmark & Logo:** A split V-shaped radar mark: two cyan beams converge on a small violet point, implying verification through triangulation.
- **Signature Brand Color:** Signal cyan `#35E0D0`.

## Project Structure

- `app/(tabs)/_layout.tsx`: Persistent mobile tab navigation.
- `app/(tabs)/index.tsx`: Case briefing dashboard, signal map, quick actions, and live feed.
- `app/(tabs)/vault.tsx`: Evidence vault with search/filter state, source checker badges, and chain-of-custody details.
- `app/(tabs)/analysis.tsx`: Pattern Finder, graph legend, insight cards, and confidence filters.
- `app/(tabs)/team.tsx`: Collaboration hub, task board, secure-room status, and audit events.
- `app/copilot.tsx`: Investigative Copilot conversation screen and assistive response states.
- `components/veritas-ui.tsx`: Shared cards, badges, section headers, stat tiles, and progress indicators.
- `shared/investigation-data.ts`: Typed domain models and deterministic fixture data used by every screen.
- `shared/investigation-services.ts`: Typed service interfaces and safe local implementations for future storage, AI, and analysis adapters.
- `server/routers.ts`: Existing tRPC root plus future investigation router seam.
- `server/research/registry.ts`: Capability-based connector catalog with credential and retention boundaries.
- `server/research/query-safety.ts`: Safe public-record templates and blocked private-access patterns.
- `server/research/historical-indexes.ts`: Wayback/Common Crawl metadata discovery as historical leads.
- `server/research/firecrawl.ts`: Optional server-only Firecrawl derivative adapter; disabled until production controls are configured.
- `drizzle/schema.ts`: Existing user schema plus documented extension point for cases, evidence, insights, audit events, and collaboration records.
- `docs/requirements.md`: Normalized requirements extracted from the uploaded PDF.
- `docs/ARCHITECTURE.md`: Production handoff notes, data ownership boundaries, and integration checklist for Grok.
- `docs/RELEASE_GATES.md`: Staged production gates, connector interpretation rules, and troubleshooting runbook.
- `tests/investigation-services.test.ts`: Deterministic tests for source checking, filtering, and copilot guardrails.

## Delivery Slices

1. Establish domain fixtures, shared UI primitives, route navigation, and the dashboard.
2. Add the evidence vault and source-checker interaction.
3. Add pattern analysis and collaboration routes plus copilot flow.
4. Add typed service seams, documentation, app branding, and deterministic tests.
5. Run diagnostics, typecheck, lint, tests, database sync, Metro/API startup, route/preview checks, and commit the checkpoint.
