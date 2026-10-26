# Veritas Frontend Deployment Status
Updated: 2026-10-26T08:40:00Z

## LIVE — Production Frontend

| Surface | URL | Mode |
|--------|-----|------|
| **GitHub Pages (SPA)** | https://cantgetalonggta-png.github.io/veritas-investigative-intelligence/ | Dual-mode static |
| **GitHub repo** | https://github.com/cantgetalonggta-png/veritas-investigative-intelligence | source of truth |
| **gh-pages branch** | https://github.com/cantgetalonggta-png/veritas-investigative-intelligence/tree/gh-pages | deployed artifact |
| **Local API (sandbox)** | http://127.0.0.1:3000/ | full connectors + SPA |

## Frontend shipped (complete)

Views:
- **Field Desk** — Northstar Ledger case card, signal map, live feed, stats, copilot brief, research jump
- **Public Research** — dual-mode (API preferred → client Wikidata + Wikipedia + SEC handoff)
- **Briefing** — insight handoff + desk stats
- **Evidence Vault** — fixture chain-of-custody (verified/uncertain/restricted filters) + local notes
- **Pattern Finder** — entity cluster / temporal / ethical-hold insights + last research analysis
- **Collaboration** — team tasks + audit trail
- **Copilot** — assistive grounded replies with guardrails
- **System Status** — connector table + health

Safety ceiling preserved:
- Public-record only language
- Restricted evidence quarantined
- No credential targeting
- Results labeled as leads, not findings

## API (when host available)

- `GET /api/health`
- `GET /api/research/search?q=`
- `GET /api/research/capabilities`
- `GET /api/research/historical?domain=`
- `POST /api/trpc/*`

Smoke (sandbox): Microsoft query returns Wikidata + SEC; GDELT/X disclosed as unavailable/unconfigured.

## Packaging

- `public/index.html` + `public/404.html` production SPA
- `vercel.json` rewrites `/api/*` → serverless; SPA fallback
- `api/index.js` + `dist/vercel-app.js` serverless entry
- `.github/workflows/pages.yml` Actions deploy on main push
- `gh-pages` branch force-updated for immediate Pages

## Vercel — blocked (single impossibility)

MCP + CLI cannot create projects on team `echo-ec69` (`team_kgQcPVmumwtmK3MdAGlxKJtg`): **403 forbidden**.

**One-time user action (only remaining human step):**
1. Open https://vercel.com/new
2. Import `cantgetalonggta-png/veritas-investigative-intelligence`
3. Team: **echo-ec69**
4. Framework: Other / None · Output: `public` · Build: `pnpm build` · Install: `pnpm install`
5. Deploy

Until then: GitHub Pages SPA is fully operational in dual-mode (client public sources). Full multi-connector API lights up automatically once Vercel project exists.

## Expo / native

Expo Router source under `app/` remains intact for Dashboard native builds (APK/TestFlight). Web production path is the SPA + Express/Vercel API.

## Secrets (never committed)

`DATABASE_URL`, `MANUS_*`, `FIRECRAWL_API_KEY` — optional; public research works without them.
