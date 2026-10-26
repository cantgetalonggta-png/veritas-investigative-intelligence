# Veritas Deploy Status
Updated: 2026-10-26T09:00:00Z

## LIVE (real world — not sandbox-only)

| Surface | URL | Mode |
|---------|-----|------|
| **Frontend SPA** | https://cantgetalonggta-png.github.io/veritas-investigative-intelligence/ | Dual-mode: live public CORS APIs (Wikidata, Wikipedia, GLEIF, FR registry, USAspending) + business registry handoffs |
| **GitHub repo** | https://github.com/cantgetalonggta-png/veritas-investigative-intelligence | main + gh-pages |
| **Local API** (operator) | http://127.0.0.1:3000 | Full multi-connector Express + tRPC |

## Backend research connectors (factual live smoke)

| Connector | Auth | Status on Microsoft smoke |
|-----------|------|---------------------------|
| Wikidata | none | ok |
| Wikipedia | none | ok |
| SEC EDGAR | UA only | ok |
| GLEIF LEI | none (CORS) | ok |
| OpenSanctions | optional API key; web handoff always | handoff ok |
| USAspending | none | ok |
| Business Registry FR | none | ok |
| Business handoffs (OpenCorporates, SAM.gov, SoS) | web | always attached |
| GDELT | none | rate-limited occasionally |
| X Public Posts | MANUS_* | unconfigured until secret |
| Historical / Firecrawl | optional | historical OK; Firecrawl needs key |

**31 live public leads** returned for `Microsoft` including LEI, SEC registrant, USAspending recipients, FR SIREN-class registry, encyclopedic entities.

## Safety ceiling (enforced)

- Blocks: reverse-phone / private 411 reverse, skip-trace, SSN, credentials, doxx patterns
- Allows: legal business names, tickers, LEI, public entities, **public** business directory intent → registry handoffs only
- Results labeled **leads not findings**; restricted vault items stay quarantined

## Edge worker ready

`edge/worker.js` + `edge/wrangler.toml` — Cloudflare Workers-compatible public research API. Deploy when a CF token exists: `cd edge && npx wrangler deploy`.

## Vercel impossibility (unchanged)

Team `echo-ec69` returns **403 create project**. One-time human fix:
https://vercel.com/new → import `cantgetalonggta-png/veritas-investigative-intelligence` → Framework None · Output `public` · Build `pnpm build` → Deploy.

That wires `/api/*` serverless (`api/index.js` + `dist/vercel-app.js`) for full server-side SEC + multi-connector from one origin.

## What to do next (optional secrets)

- `OPENSANCTIONS_API_KEY` — full sanctions JSON API
- `MANUS_*` — X public posts
- `FIRECRAWL_API_KEY` — gated document acquisition
- `DATABASE_URL` — vault persistence
- Cloudflare account — `wrangler deploy` for permanent edge API without Vercel
