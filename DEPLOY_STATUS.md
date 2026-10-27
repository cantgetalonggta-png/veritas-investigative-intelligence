# Veritas Frontend Deploy Status — live cycle

## Live frontend (working)
- **Local static:** `http://127.0.0.1:8080/` (expo web export, all routes)
- **GitHub Pages:** workflow deploys `public/` (full SPA export) on push to main
- **Repo:** https://github.com/cantgetalonggta-png/veritas-investigative-intelligence

## Routes verified in export
`/`, `/search`, `/copilot`, `/analysis`, `/team`, `/vault` + tab mirrors + assets/JS

## Quality gates
- pnpm check PASS, expo export PASS, 34 files ~3.7MB in public/

## Vercel (permission wall — not technical)
- Team `echo-ec69` / `team_kgQcPVmumwtmK3MdAGlxKJtg` listable
- **Create project / deployment = HTTP 403** for connected token
- CLI `npx vercel` = **Logged out** (no VERCEL_TOKEN in environment)
- **Fix (one-time human):** Vercel dashboard → team echo-ec69 → grant connected integration Deploy + Project Create scopes, OR:
  ```
  npx vercel login
  cd /opt/veritas-work && npx vercel --prod --yes
  ```
- vercel.json ready for static `public/` output with SPA rewrites

## Manus
- API key works with header `x-manus-api-key` only

## Autonomy note
Frontend is fully built and live via GitHub Pages path + local. Vercel blocked solely by OAuth scope.
