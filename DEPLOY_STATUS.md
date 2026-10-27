# Veritas Frontend — LIVE

## Production live URL
**https://cantgetalonggta-png.github.io/veritas-investigative-intelligence/**

| Route | Status |
|-------|--------|
| `/` index | 200 |
| `/search.html` | 200 |
| `/copilot.html` | 200 |
| `/analysis.html` | 200 |
| `/team.html` | 200 |
| `/vault.html` | 200 |
| JS bundle + CSS | 200 |

Hosting: GitHub Pages (`gh-pages` branch, full Expo web export with base-path rewrites).

## Local
`http://127.0.0.1:8080/` — root-path static SPA (`python3 -m http.server` on `dist/`)

## GitHub
https://github.com/cantgetalonggta-png/veritas-investigative-intelligence  
- `main`: source + `public/` SPA (root paths, Vercel-ready)  
- `gh-pages`: live site (base-prefixed paths)

## Vercel — IMPOSSIBILITY (permission only)
- Connected Vercel token on team `echo-ec69` (`team_kgQcPVmumwtmK3MdAGlxKJtg`): **list teams OK**, **create project/deploy = HTTP 403**
- CLI: **Logged out** (no `VERCEL_TOKEN`)
- Config ready: `vercel.json` → `outputDirectory: public`, SPA rewrites

**One-time human unlock (cannot be automated):**
1. Vercel Dashboard → team **echo-ec69** → grant integration scopes: Project Create + Deploy  
   OR run: `npx vercel login && cd /opt/veritas-work && npx vercel --prod --yes`
2. After scopes: `create_git_project` / `npx vercel --prod` will publish to `*.vercel.app`

## Quality gates
- `pnpm check` PASS  
- `expo export --platform web` PASS (12 routes, ~3.7MB)  
- Manus API: `x-manus-api-key` → 200

## Modules in live SPA
Home, Search, Copilot, Analysis, Team, Vault (+ tab mirrors), assets, MaterialIcons, Expo Router static rendering.
