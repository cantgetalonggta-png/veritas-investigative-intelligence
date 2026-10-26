import type { ResearchResponse, ResearchResult } from "../../shared/research";
import { callDataApi } from "../_core/dataApi";
import { connectorCatalog, connectorState } from "./registry";
import { normalizeResearchQuery } from "./query-safety";

const cache = new Map<string, { expiresAt: number; value: ResearchResponse }>();
const CACHE_MS = 60_000;
const REQUEST_TIMEOUT_MS = 8_000;
const SEC_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";
const WIKIDATA_URL = "https://www.wikidata.org/w/api.php";
const GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc";

type JsonRecord = Record<string, unknown>;

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function fetchJson(url: string, headers: Record<string, string> = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json", ...headers },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

async function searchWikidata(query: string): Promise<ResearchResult[]> {
  const url = new URL(WIKIDATA_URL);
  url.searchParams.set("action", "wbsearchentities");
  url.searchParams.set("search", query);
  url.searchParams.set("language", "en");
  url.searchParams.set("uselang", "en");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "6");
  const payload = (await fetchJson(url.toString(), { "user-agent": "Veritas Investigative Intelligence/0.1" })) as JsonRecord;
  const items = Array.isArray(payload.search) ? payload.search : [];
  return items.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const record = item as JsonRecord;
    const id = asString(record.id);
    const label = asString(record.label);
    if (!id || !label) return [];
    const description = asString(record.description) ?? "Public Wikidata entity record.";
    return [{
      id: `wikidata-${id}`,
      source: "Wikidata" as const,
      title: label,
      summary: description,
      url: `https://www.wikidata.org/wiki/${encodeURIComponent(id)}`,
      entityType: description.toLowerCase().includes("person") || description.toLowerCase().includes("politician") || description.toLowerCase().includes("writer") || description.toLowerCase().includes("actor") ? "person" as const : description.toLowerCase().includes("company") || description.toLowerCase().includes("corporation") || description.toLowerCase().includes("organization") || description.toLowerCase().includes("enterprise") ? "organization" as const : "unknown" as const,
      confidence: Math.max(58, 94 - index * 7),
      provenance: "Wikidata public entity search",
      publicOnly: true as const,
    } satisfies ResearchResult];
  });
}

async function searchSec(query: string): Promise<ResearchResult[]> {
  const payload = (await fetchJson(SEC_TICKERS_URL, {
    "user-agent": process.env.SEC_USER_AGENT ?? "Veritas Investigative Intelligence/0.1 public research",
  })) as JsonRecord;
  const needle = query.toLowerCase();
  return Object.values(payload).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as JsonRecord;
    const name = asString(record.title);
    const ticker = asString(record.ticker);
    const cik = typeof record.cik_str === "number" ? String(record.cik_str).padStart(10, "0") : undefined;
    if (!name || !cik || !(`${name} ${ticker ?? ""}`.toLowerCase().includes(needle))) return [];
    return [{
      id: `sec-${cik}`,
      source: "SEC EDGAR" as const,
      title: name,
      summary: `SEC registrant${ticker ? ` · ticker ${ticker}` : ""}. Open the filing index for submissions and company facts.`,
      url: `https://www.sec.gov/edgar/browse/?CIK=${cik}`,
      entityType: "organization" as const,
      confidence: ticker?.toLowerCase() === needle ? 97 : 82,
      provenance: "SEC EDGAR company ticker index",
      publicOnly: true as const,
    } satisfies ResearchResult];
  }).slice(0, 6);
}

async function searchGdelt(query: string): Promise<ResearchResult[]> {
  const url = new URL(GDELT_URL);
  url.searchParams.set("query", `"${query.replace(/"/g, "")}"`);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("maxrecords", "8");
  url.searchParams.set("sort", "HybridRel");
  const payload = (await fetchJson(url.toString())) as JsonRecord;
  const articles = Array.isArray(payload.articles) ? payload.articles : [];
  return articles.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const record = item as JsonRecord;
    const title = asString(record.title);
    const urlValue = asString(record.url);
    if (!title || !urlValue) return [];
    return [{
      id: `gdelt-${Buffer.from(urlValue).toString("base64url").slice(0, 32)}`,
      source: "GDELT News" as const,
      title,
      summary: asString(record.seendate) ? `Public news coverage indexed by GDELT on ${asString(record.seendate)}.` : "Public news coverage indexed by GDELT.",
      url: urlValue,
      publishedAt: asString(record.seendate),
      entityType: "unknown" as const,
      confidence: Math.max(55, 88 - index * 4),
      provenance: "GDELT DOC public news index",
      publicOnly: true as const,
    } satisfies ResearchResult];
  });
}

async function searchManagedX(query: string): Promise<ResearchResult[]> {
  const payload = (await callDataApi("X/search_recent_posts", {
      query: { query, max_results: 10, "tweet.fields": "id,text,created_at,author_id,lang" },
  })) as JsonRecord;
  const posts = Array.isArray(payload.data) ? payload.data : [];
  return posts.flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const record = item as JsonRecord;
      const id = asString(record.id);
      const text = asString(record.text);
      if (!id || !text) return [];
      return [{
        id: `x-${id}`,
        source: "X Public Posts" as const,
        title: "Public X post",
        summary: text,
        url: `https://x.com/i/web/status/${id}`,
        publishedAt: asString(record.created_at),
        entityType: "unknown" as const,
        confidence: Math.max(45, 76 - index * 3),
        provenance: "Managed X recent public-post search",
        publicOnly: true as const,
      } satisfies ResearchResult];
  });
}

export async function searchPublicResearch(rawQuery: string): Promise<ResearchResponse> {
  const query = normalizeResearchQuery(rawQuery);
  const cached = cache.get(query.toLowerCase());
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const settled = await Promise.allSettled([
    searchWikidata(query),
    searchSec(query),
    searchGdelt(query),
    searchManagedX(query),
  ]);
  const [wikidata, sec, gdelt, x] = settled;
  const results = [wikidata, sec, gdelt, x].flatMap((item) => item.status === "fulfilled" ? item.value : []);
  const connectorStates = [
    connectorState("wikidata", wikidata.status === "fulfilled" ? "ok" : "unavailable"),
    connectorState("sec-edgar", sec.status === "fulfilled" ? "ok" : "unavailable"),
    connectorState("gdelt", gdelt.status === "fulfilled" ? "ok" : "unavailable"),
    connectorState("x-public-posts", x.status === "fulfilled" ? "ok" : process.env.MANUS_API_BASE_URL ? "unavailable" : "unconfigured"),
  ];
  const warnings = settled.flatMap((item, index) => item.status === "rejected" ? [`${["Wikidata", "SEC EDGAR", "GDELT News", "X Public Posts"][index]} unavailable for this run.`] : []);
  const response: ResearchResponse = {
    query,
    exactQuery: query,
    searchedAt: new Date().toISOString(),
    mode: "entity",
    sources: ["Wikidata", "SEC EDGAR", "GDELT News", "X Public Posts"],
    connectorStates,
    results,
    warnings: results.length ? warnings : [...warnings, "No public records matched. Try a fuller name, legal company name, ticker, or domain."] ,
  };
  cache.set(query.toLowerCase(), { expiresAt: Date.now() + CACHE_MS, value: response });
  return response;
}

export function getResearchConnectorCatalog() {
  return connectorCatalog();
}
