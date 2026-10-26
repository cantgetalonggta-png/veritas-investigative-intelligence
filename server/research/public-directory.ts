/**
 * Public phone book / 411 / reverse-directory research for investigative journalism.
 * Sources: published directories, business listings, OSM public POIs, web handoffs
 * to public reverse-directory and white/yellow pages surfaces.
 * Results are leads with source URLs — not findings.
 */
import type { ResearchResult } from "../../shared/research";
import { extractPhoneCandidates, isDirectoryIntent } from "./query-safety";

const UA = process.env.SEC_USER_AGENT ?? "Veritas Investigative Intelligence public-directory research@veritas.example";
const REQUEST_TIMEOUT_MS = 10_000;

type JsonRecord = Record<string, unknown>;

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

async function fetchJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json", "user-agent": UA, ...headers },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/** OpenStreetMap Nominatim — public business/place listings with display names & addresses (ODbL). */
async function searchNominatimDirectory(query: string): Promise<ResearchResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("limit", "8");
  const payload = (await fetchJson(url.toString(), { "accept-language": "en" })) as unknown[];
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const record = item as JsonRecord;
    const name = asString(record.display_name);
    const lat = asString(String(record.lat ?? ""));
    const lon = asString(String(record.lon ?? ""));
    const osmType = asString(record.osm_type);
    const osmId = record.osm_id;
    if (!name) return [];
    const extratags = (record.extratags as JsonRecord | undefined) ?? {};
    const phone = asString(extratags.phone) ?? asString(extratags["contact:phone"]);
    const website = asString(extratags.website) ?? asString(extratags["contact:website"]);
    const bits = [
      phone ? `listed phone ${phone}` : null,
      website ? `website ${website}` : null,
      lat && lon ? `coords ${lat},${lon}` : null,
      osmType ? `OSM ${osmType}/${osmId}` : null,
    ].filter(Boolean);
    return [{
      id: `osm-dir-${osmType || "x"}-${osmId || index}`,
      source: "Public Directory" as const,
      title: name.split(",")[0] || name,
      summary: `Public map/directory listing · ${bits.join(" · ") || name}`,
      url: website || `https://www.openstreetmap.org/${osmType || "search"}?query=${encodeURIComponent(query)}`,
      entityType: "organization" as const,
      confidence: phone ? Math.max(72, 90 - index * 3) : Math.max(60, 82 - index * 4),
      provenance: "OpenStreetMap Nominatim public POI/directory (ODbL) — published place data journalists use for location & listed contacts",
      publicOnly: true as const,
    } satisfies ResearchResult];
  });
}

/**
 * Directory handoffs: published white pages, yellow pages, 411, reverse-phone
 * surfaces that index publicly listed numbers (standard desk starting points).
 */
function directoryHandoffs(query: string): ResearchResult[] {
  const q = encodeURIComponent(query);
  const phones = extractPhoneCandidates(query);
  const primaryPhone = phones[0];
  const phoneQ = primaryPhone ? encodeURIComponent(primaryPhone) : q;

  const rows: ResearchResult[] = [
    {
      id: "dir-whitepages",
      source: "Public Directory",
      title: primaryPhone ? `Whitepages reverse listing: ${primaryPhone}` : `Whitepages / public listings: ${query}`,
      summary: "Published white-pages style people & business listings. Start here for publicly listed numbers and names — classic 411 desk workflow.",
      url: primaryPhone
        ? `https://www.whitepages.com/phone/${phoneQ}`
        : `https://www.whitepages.com/name/${q}`,
      entityType: primaryPhone ? "unknown" : "unknown",
      confidence: 70,
      provenance: "Whitepages public directory search handoff",
      publicOnly: true,
    },
    {
      id: "dir-yellowpages",
      source: "Public Directory",
      title: `Yellow Pages business directory: ${query}`,
      summary: "Public yellow-pages business listings — phones, addresses, categories as published by businesses.",
      url: `https://www.yellowpages.com/search?search_terms=${q}`,
      entityType: "organization",
      confidence: 72,
      provenance: "Yellow Pages public business directory handoff",
      publicOnly: true,
    },
    {
      id: "dir-411",
      source: "Public Directory",
      title: primaryPhone ? `411-style reverse lookup: ${primaryPhone}` : `411 / directory assistance search: ${query}`,
      summary: "Directory-assistance style search for publicly listed numbers and business entries. Verify each hit against the original listing.",
      url: primaryPhone
        ? `https://www.411.com/reverse-phone/${phoneQ}`
        : `https://www.411.com/name/${q}`,
      entityType: "unknown",
      confidence: 68,
      provenance: "411.com public directory handoff",
      publicOnly: true,
    },
    {
      id: "dir-anywho",
      source: "Public Directory",
      title: primaryPhone ? `AnyWho reverse phone: ${primaryPhone}` : `AnyWho directory: ${query}`,
      summary: "Public reverse-phone / name directory (legacy white-pages family). Use as a lead list, not a finding.",
      url: primaryPhone
        ? `https://www.anywho.com/reverse-phone-lookup/${phoneQ}`
        : `https://www.anywho.com/people/${q}`,
      entityType: "unknown",
      confidence: 65,
      provenance: "AnyWho public directory handoff",
      publicOnly: true,
    },
    {
      id: "dir-truepeoplesearch",
      source: "Public Directory",
      title: primaryPhone ? `Public records people search (phone): ${primaryPhone}` : `Public records people search: ${query}`,
      summary: "Aggregated public-record people search commonly used at news desks for published listings, voter rolls where public, and directory data. Cross-check every field.",
      url: primaryPhone
        ? `https://www.truepeoplesearch.com/results?phoneno=${phoneQ}`
        : `https://www.truepeoplesearch.com/results?name=${q}`,
      entityType: "person",
      confidence: 63,
      provenance: "TruePeopleSearch public-records aggregator handoff",
      publicOnly: true,
    },
    {
      id: "dir-fastpeoplesearch",
      source: "Public Directory",
      title: primaryPhone ? `FastPeopleSearch reverse: ${primaryPhone}` : `FastPeopleSearch: ${query}`,
      summary: "Public people/phone search handoff used for directory-style leads. Treat as unverified leads.",
      url: primaryPhone
        ? `https://www.fastpeoplesearch.com/phone/${phoneQ}`
        : `https://www.fastpeoplesearch.com/name/${q}`,
      entityType: "person",
      confidence: 62,
      provenance: "FastPeopleSearch public directory handoff",
      publicOnly: true,
    },
    {
      id: "dir-spokeo",
      source: "Public Directory",
      title: primaryPhone ? `Spokeo reverse phone: ${primaryPhone}` : `Spokeo people/directory: ${query}`,
      summary: "Commercial people-search that indexes public records & directory data. Paywalls possible; still a standard journalistic reverse-lookup starting point.",
      url: primaryPhone
        ? `https://www.spokeo.com/${phoneQ}`
        : `https://www.spokeo.com/${q.replace(/%20/g, "-")}`,
      entityType: "unknown",
      confidence: 60,
      provenance: "Spokeo directory handoff",
      publicOnly: true,
    },
    {
      id: "dir-fcc-tcpa",
      source: "Public Directory",
      title: `FCC / public telecom context: ${query}`,
      summary: "Federal Communications Commission public resources for carrier and consumer phone issues — not a white pages dump, but public-sector companion to directory work.",
      url: `https://www.fcc.gov/consumers`,
      entityType: "organization",
      confidence: 50,
      provenance: "FCC public consumer portal handoff",
      publicOnly: true,
      jurisdiction: "US",
    },
  ];

  return rows;
}

export async function searchPublicDirectory(rawQuery: string): Promise<ResearchResult[]> {
  const query = rawQuery.trim();
  const results: ResearchResult[] = [];

  // Always attach journalistic directory handoffs for directory/phone intent OR any entity query
  // (reporters reverse-look numbers that turn up in documents; also search names in 411)
  const wantHeavy = isDirectoryIntent(query) || extractPhoneCandidates(query).length > 0;

  try {
    const osm = await searchNominatimDirectory(query);
    results.push(...osm);
  } catch {
    // nominatim rate limits or network — handoffs still work
  }

  results.push(...directoryHandoffs(query));

  if (wantHeavy) {
    // Boost: explicit phone-book style meta lead
    results.unshift({
      id: "dir-desk-note",
      source: "Public Directory",
      title: "Desk note: public directory first pass",
      summary:
        "Investigative workflow: (1) published white/yellow pages & 411 reverse of listed numbers, (2) OSM/business POI phones, (3) corporate filings & registries for official contacts, (4) verify every hit in primary source. Public listings ≠ private unlisted harvest; still label as leads.",
      url: "https://www.411.com/",
      entityType: "unknown",
      confidence: 80,
      provenance: "Veritas public-directory methodology note",
      publicOnly: true,
    });
  }

  return results;
}
