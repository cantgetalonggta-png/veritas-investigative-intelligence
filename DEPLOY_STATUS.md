# Veritas Frontend — LIVE (production)

## Primary production URL (custom GitHub Pages project URL)
**https://cantgetalonggta-png.github.io/veritas-investigative-intelligence/**

### Critical routes
| Route | Status |
|-------|--------|
| `/` | 200 |
| `/engines.html` | **200 LIVE** — 259 engines + auto term developer |
| `/data/search-engines.json` | 200 |
| `/search.html` | 200 |
| `/copilot.html` | 200 |
| `/analysis.html` | 200 |
| `/team.html` | 200 |
| `/vault.html` | 200 |

## Temporary Vercel URL (claim within ~60m to keep permanent)
- Live: https://quick-mesa-fd9pspk.tmp.now
- **Claim (private):** https://vercel.com/claim-deployment?code=1bd602e7-07a0-4b2e-89cf-2219aabb1821
- Engines: https://quick-mesa-fd9pspk.tmp.now/engines.html

## Source
- Repo: https://github.com/cantgetalonggta-png/veritas-investigative-intelligence
- Commit: engines mesh UI + developTerms API + public engines page
- Branch: `main` + forced `gh-pages` deploy

## Custom URL options (human)
1. **GitHub Pages custom domain:** repo Settings → Pages → Custom domain (e.g. `veritas.yourdomain.com`) + DNS CNAME
2. **Claim Vercel temp** → then add custom domain in Vercel project
3. Grant Vercel MCP Project Create + Deploy scopes for permanent `*.vercel.app`

## App additions
- `public/engines.html` full interactive mesh
- `app/engines.tsx` Expo route
- tRPC `research.engines` + `research.developTerms`
- Home + Search CTAs to engines mesh
