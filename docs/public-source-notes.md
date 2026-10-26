# Public-source integration notes

These notes ground the live research connector in official documentation reviewed during the implementation pass.

- **SEC EDGAR APIs** — `https://www.sec.gov/search-filings/edgar-application-programming-interfaces` states that `data.sec.gov` exposes unauthenticated JSON APIs for submissions and XBRL data, updates throughout the day, and requires automated access to follow SEC fair-access guidance. The connector therefore uses the public company ticker index, sends a descriptive User-Agent, and links users to the SEC filing index rather than presenting unsourced claims.
- **Wikidata REST/API access** — `https://www.wikidata.org/wiki/Wikidata:REST_API` documents the Wikibase REST base and links to the official OpenAPI documentation. The current connector uses the public MediaWiki entity-search surface for fast name matching and preserves the Wikidata item URL for review.
- **GDELT DOC 2.0** — `https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/` documents public full-text news search, JSON output, article-list mode, and a rolling news window. The app treats GDELT as an optional source and displays an explicit unavailable warning when the upstream call times out.
- **X API** — `https://docs.x.com/x-api/overview` documents the public-post search product and pay-per-use access model. Veritas only calls the managed `X/search_recent_posts` API when the project exposes the platform data API; otherwise it displays an unavailable warning and does not ask the user for a browser token.
- **Historical indexes** — Wayback CDX and Common Crawl index results are treated as URL-discovery metadata only. Veritas labels these records `historicalOnly` and keeps the archived/original URL visible for manual review; an index entry never becomes proof of document contents.
- **Firecrawl acquisition** — The optional adapter targets the server-side v2 scrape interface and requests Markdown as a derivative. It is intentionally unconfigured until `FIRECRAWL_API_KEY`, case authorization, DNS-aware egress restrictions, quarantine/scanning, and original/derivative custody records are in place.

## Product boundary

The live search surface is for public, source-cited leads. It does not expose private contact databases, credentials, non-public identity data, or a claim that a result is true. Researchers must confirm identity, context, recency, and source reliability before importing a result into a case. Saved leads are currently stored locally on the device as complete public-result records; production case capture should replace that storage with an authenticated, encrypted evidence mutation.
