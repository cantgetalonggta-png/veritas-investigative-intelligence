# Veritas Frontend — LIVE

## Production live URL
**https://cantgetalonggta-png.github.io/veritas-investigative-intelligence/**

| Route | Status (re-verified 2026-10-27 03:50 UTC) |
|-------|--------|
| `/` index | 200 |
| `/search.html` | 200 |
| `/copilot.html` | 200 |
| `/analysis.html` | 200 |
| `/team.html` | 200 |
| `/vault.html` | 200 |
| JS `entry-373aba88…` | 200 |
| CSS `web-5ee4f55…` | 200 |

Hosting: GitHub Pages (`gh-pages` branch / Actions deploy of `public/` full Expo web SPA).

## Local static
`http://127.0.0.1:8080/` — serve `public/` with any static server.

## GitHub
https://github.com/cantgetalonggta-png/veritas-investigative-intelligence  
- `main`: source + `public/` SPA (root paths, Vercel-ready)  
- `gh-pages`: live site

## Vercel — IMPOSSIBILITY (permission only, not code)
- Connected integration team `team_kgQcPVmumwtmK3MdAGlxKJtg` (echo-ec69):
  - `create_git_project` → **HTTP 403** (no Project Create)
  - `create_deployment` production → **HTTP 403** (no Deploy permission)
- Config ready in repo: `vercel.json` → `outputDirectory: public`, SPA rewrites, security headers

**One-time human unlock (cannot be automated):**
1. Vercel Dashboard → team **echo-ec69** → grant connected integration scopes: **Project Create + Deploy**  
   OR: `npx vercel login && cd <repo> && npx vercel --prod --yes`
2. After scopes, auto-link via GitHub repo works.

## Quality gates
- Expo web export in `public/` (12 HTML routes + `_expo` assets)
- Pages workflow: `.github/workflows/pages.yml`
- Manus API: use header `x-manus-api-key` only

## Modules in live SPA
Home, Search, Copilot, Analysis, Team, Vault (+ tab mirrors), assets, MaterialIcons, Expo Router static rendering.

## Autonomy note
Frontend fully built and **live via GitHub Pages**. Vercel secondary path blocked solely by OAuth scope on connected token. No further autonomous code path can open Vercel without human grant.
