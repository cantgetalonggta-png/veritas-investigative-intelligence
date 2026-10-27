# Search Engines Investigation Catalog

**259 engines · 861 investigation search-term templates**

## Files
- `shared/search-engines-catalog.ts` — TypeScript module + `developAllSearchTerms()`
- `docs/search_engines_investigation_catalog.json` — full machine-readable catalog
- `docs/search_engines_investigation_catalog.csv` — flat export
- `docs/Veritas_Search_Engines_Investigation_Catalog.xlsx` — spreadsheet (engines + expanded terms + policy)

## Usage
```ts
import { developAllSearchTerms, expandInvestigationTerms, SEARCH_ENGINES } from "@/shared/search-engines-catalog";

const plan = developAllSearchTerms({
  subject: "Jane Example",
  org: "Example Holdings LLC",
  domain: "example.com",
  jurisdiction: "Delaware",
  year: "2024",
  keyword: "procurement",
});
// plan[i].terms → filled queries for engine i
// plan[i].queryUrls → best-effort deep links
```

## Policy (non-negotiable)
- Public records / public web only
- No searching to expose minors or victims
- AI answer engines = leads only until primary-source verified
- People-search vendors: verify with government primary sources; critical vs non-critical logging applies
- Torrent/onion entries are cataloged for awareness; prefer FOIA, court records, Internet Archive

## Placeholders
`{subject}` `{org}` `{alias}` `{domain}` `{jurisdiction}` `{ticker}` `{year}` `{keyword}` `{image_url}` `{query}`
