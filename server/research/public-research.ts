import type { ResearchResponse, ResearchResult, ResearchSource } from "../../shared/research";
import { callDataApi } from "../_core/dataApi";
import { connectorState, connectorCatalog } from "./registry";
import { normalizeResearchQuery, isBusinessDirectoryIntent, isDirectoryIntent } from "./query-safety";
import { searchPublicDirectory } from "./public-directory";

const cache = new Map<string, { expiresAt: number; value: ResearchResponse }>();
const CACHE_MS = 60_000;
const REQUEST_TIMEOUT_MS = 10_000;
const SEC_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";
const WIKIDATA_URL = "https://www.wikidata.org/w/api.php";
const WIKIPEDIA_URL = "https://en.wikipedia.org/w/api.php";
const GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc";
const GLEIF_URL = "https://api.gleif.org/api/v1/lei-records";
const OPENSANCTIONS_URL = "https://api.opensanctions.org/search/default";
const USASPENDING_URL = "https://api.usaspending.gov/api/v2/autocomplete/recipient/";
const FR_ENTREPRISES_URL = "https://recherche-entreprises.api.gouv.fr/search";
const UA = process.env.SEC_USER_AGENT ?? "Veritas Investigative Intelligence public-research research@veritas.example";

type JsonRecord = Record<string, unknown>;

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function fetchJson(url: string, headers: Record<string, string> = {}, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...init,
      headers: { accept: "application/json", "user-agent": UA, ...headers, ...(init.headers as Record<string, string> | undefined) },
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
  const payload = (await fetchJson(url.toString())) as JsonRecord;
  const items = Array.isArray(payload.search) ? payload.search : [];
  return items.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const record = item as JsonRecord;
    const id = asString(record.id);
    const label = asString(record.label);
    if (!id || !label) return [];
    const description = asString(record.description) ?? "Public Wikidata entity record.";
    const d = description.toLowerCase();
    const entityType =
      /person|politician|writer|actor|journalist|athlete/.test(d) ? ("person" as const)
      : /compan|corporat|organization|enterprise|agency|bank|fund/.test(d) ? ("organization" as const)
      : ("unknown" as const);
    return [{
      id: `wikidata-${id}`,
      source: "Wikidata" as const,
      title: label,
      summary: description,
      url: `https://www.wikidata.org/wiki/${encodeURIComponent(id)}`,
      entityType,
      confidence: Math.max(58, 94 - index * 7),
      provenance: "Wikidata public entity search",
      publicOnly: true as const,
    } satisfies ResearchResult];
  });
}

async function searchWikipedia(query: string): Promise<ResearchResult[]> {
  const url = new URL(WIKIPEDIA_URL);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("srlimit", "5");
  url.searchParams.set("utf8", "1");
  const payload = (await fetchJson(url.toString())) as JsonRecord;
  const queryObj = (payload.query as JsonRecord | undefined) ?? {};
  const items = Array.isArray(queryObj.search) ? queryObj.search : [];
  return items.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const record = item as JsonRecord;
    const title = asString(record.title);
    if (!title) return [];
    const snippet = asString(record.snippet)?.replace(/<[^>]+>/g, "") ?? "Public Wikipedia article.";
    return [{
      id: `wikipedia-${Buffer.from(title).toString("base64url").slice(0, 24)}`,
      source: "Wikipedia" as const,
      title,
      summary: snippet,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      entityType: "unknown" as const,
      confidence: Math.max(55, 90 - index * 6),
      provenance: "Wikipedia open search (public encyclopedia)",
      publicOnly: true as const,
    } satisfies ResearchResult];
  });
}

async function searchSec(query: string): Promise<ResearchResult[]> {
  const payload = (await fetchJson(SEC_TICKERS_URL, { "user-agent": UA })) as JsonRecord;
  const needle = query.toLowerCase();
  return Object.values(payload)
    .flatMap((item) => {
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
        summary: `SEC registrant${ticker ? ` · ticker ${ticker}` : ""} · CIK ${cik}. Open submissions and company facts on EDGAR.`,
        url: `https://www.sec.gov/edgar/browse/?CIK=${cik}`,
        entityType: "organization" as const,
        confidence: ticker?.toLowerCase() === needle ? 97 : 82,
        provenance: "SEC EDGAR company ticker index (no key)",
        publicOnly: true as const,
        jurisdiction: "US",
      } satisfies ResearchResult];
    })
    .slice(0, 6);
}

async function searchGleif(query: string): Promise<ResearchResult[]> {
  const url = new URL(GLEIF_URL);
  url.searchParams.set("filter[entity.legalName]", query);
  url.searchParams.set("page[size]", "6");
  url.searchParams.set("page[number]", "1");
  const payload = (await fetchJson(url.toString())) as JsonRecord;
  const data = Array.isArray(payload.data) ? payload.data : [];
  return data.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const record = item as JsonRecord;
    const attrs = (record.attributes as JsonRecord | undefined) ?? {};
    const entity = (attrs.entity as JsonRecord | undefined) ?? {};
    const legalNameObj = (entity.legalName as JsonRecord | undefined) ?? {};
    const name = asString(legalNameObj.name) ?? asString(attrs.lei);
    const lei = asString(attrs.lei) ?? asString(record.id);
    if (!name || !lei) return [];
    const status = asString((entity.status as string) ?? "") || "unknown";
    const country =
      asString(((entity.legalAddress as JsonRecord | undefined)?.country as string) ?? "") ||
      asString(((entity.jurisdiction as string) ?? ""));
    const legalForm = asString(((entity.legalForm as JsonRecord | undefined)?.id as string) ?? "");
    return [{
      id: `gleif-${lei}`,
      source: "GLEIF LEI" as const,
      title: name,
      summary: `LEI ${lei}${country ? ` · ${country}` : ""}${legalForm ? ` · form ${legalForm}` : ""} · status ${status}. Global legal-entity identifier (CC0).`,
      url: `https://search.gleif.org/#/record/${encodeURIComponent(lei)}`,
      entityType: "organization" as const,
      confidence: Math.max(70, 95 - index * 4),
      provenance: "GLEIF Golden Copy LEI API (keyless, CORS-enabled)",
      publicOnly: true as const,
      jurisdiction: country || undefined,
    } satisfies ResearchResult];
  });
}

async function searchOpenSanctions(query: string): Promise<ResearchResult[]> {
  const url = new URL(OPENSANCTIONS_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "6");
  const headers: Record<string, string> = {};
  if (process.env.OPENSANCTIONS_API_KEY) {
    headers.Authorization = `ApiKey ${process.env.OPENSANCTIONS_API_KEY}`;
  }
  try {
    const payload = (await fetchJson(url.toString(), headers)) as JsonRecord;
    if ((payload as any).detail) throw new Error(String((payload as any).detail));
    const results = Array.isArray(payload.results) ? payload.results : [];
    const mapped = results.flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const record = item as JsonRecord;
      const id = asString(record.id) ?? asString(record.caption);
      const caption = asString(record.caption) ?? asString(record.name);
      if (!id || !caption) return [];
      const schema = asString(record.schema) ?? "Entity";
      const datasets = Array.isArray(record.datasets) ? record.datasets.map(String).slice(0, 3).join(", ") : "";
      const entityType = /Person/i.test(schema) ? ("person" as const) : /Company|Organization|LegalEntity/i.test(schema) ? ("organization" as const) : ("unknown" as const);
      return [{
        id: `opensanctions-${Buffer.from(id).toString("base64url").slice(0, 28)}`,
        source: "OpenSanctions" as const,
        title: caption,
        summary: `Public sanctions / PEP / debarment screen · schema ${schema}${datasets ? ` · ${datasets}` : ""}. Lead only — verify primary lists.`,
        url: `https://www.opensanctions.org/entities/${encodeURIComponent(id)}/`,
        entityType,
        confidence: Math.max(60, 92 - index * 5),
        provenance: "OpenSanctions search API",
        publicOnly: true as const,
      } satisfies ResearchResult];
    });
    if (mapped.length) return mapped;
  } catch {
    // fall through to public web handoff
  }
  return [{
    id: "opensanctions-handoff",
    source: "OpenSanctions" as const,
    title: `OpenSanctions screen: ${query}`,
    summary: "Public sanctions / PEP / watchlist handoff. API key optional (OPENSANCTIONS_API_KEY). Always verify primary list sources before citing.",
    url: `https://www.opensanctions.org/search/?q=${encodeURIComponent(query)}`,
    entityType: "unknown" as const,
    confidence: 58,
    provenance: "OpenSanctions public web search handoff",
    publicOnly: true as const,
  }];
}

async function searchUsaSpending(query: string): Promise<ResearchResult[]> {
  const url = new URL(USASPENDING_URL);
  // autocomplete endpoint often uses POST; try GET-style search via spending_by_award is heavy — use recipient autocomplete POST
  const payload = (await fetchJson(url.toString(), { "content-type": "application/json" }, {
    method: "POST",
    body: JSON.stringify({ search_text: query, limit: 6 }),
  })) as JsonRecord;
  const results = Array.isArray(payload.results) ? payload.results : Array.isArray(payload) ? payload : [];
  return results.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const record = item as JsonRecord;
    const name = asString(record.recipient_name) ?? asString(record.name) ?? asString(record.legal_business_name);
    if (!name) return [];
    const uei = asString(record.uei) ?? asString(record.recipient_uei);
    const duns = asString(record.duns);
    const id = uei || duns || Buffer.from(name).toString("base64url").slice(0, 16);
    return [{
      id: `usaspending-${id}`,
      source: "USAspending" as const,
      title: name,
      summary: `Federal award recipient match${uei ? ` · UEI ${uei}` : ""}${duns ? ` · DUNS ${duns}` : ""}. Public USAspending.gov data.`,
      url: `https://www.usaspending.gov/search/?hash=&query=${encodeURIComponent(name)}`,
      entityType: "organization" as const,
      confidence: Math.max(58, 88 - index * 5),
      provenance: "USAspending recipient autocomplete (public, no key)",
      publicOnly: true as const,
      jurisdiction: "US",
    } satisfies ResearchResult];
  }).slice(0, 6);
}

async function searchFrEntreprises(query: string): Promise<ResearchResult[]> {
  const url = new URL(FR_ENTREPRISES_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("page", "1");
  url.searchParams.set("per_page", "5");
  const payload = (await fetchJson(url.toString())) as JsonRecord;
  const results = Array.isArray(payload.results) ? payload.results : [];
  return results.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const record = item as JsonRecord;
    const name = asString(record.nom_complet) ?? asString(record.nom_raison_sociale);
    const siren = asString(record.siren);
    if (!name) return [];
    const status = asString(record.etat_administratif) ?? "";
    const addr = asString((record.siege as JsonRecord | undefined)?.adresse) ?? "";
    return [{
      id: `fr-ent-${siren || Buffer.from(name).toString("base64url").slice(0, 12)}`,
      source: "Business Registry" as const,
      title: name,
      summary: `France INSEE/SIREN public company search${siren ? ` · SIREN ${siren}` : ""}${status ? ` · ${status}` : ""}${addr ? ` · ${addr}` : ""}.`,
      url: siren ? `https://annuaire-entreprises.data.gouv.fr/entreprise/${siren}` : `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}`,
      entityType: "organization" as const,
      confidence: Math.max(62, 90 - index * 5),
      provenance: "recherche-entreprises.api.gouv.fr (keyless French business registry)",
      publicOnly: true as const,
      jurisdiction: "FR",
    } satisfies ResearchResult];
  });
}

function businessRegistryHandoffs(query: string): ResearchResult[] {
  const q = encodeURIComponent(query);
  return [
    {
      id: "biz-opencorporates-handoff",
      source: "Business Registry" as const,
      title: `OpenCorporates search: ${query}`,
      summary: "Public company registry aggregator handoff (web). API token optional for bulk; browser search is public. Officers/registered addresses when published by source registers.",
      url: `https://opencorporates.com/companies?q=${q}`,
      entityType: "organization",
      confidence: 65,
      provenance: "OpenCorporates public web search handoff",
      publicOnly: true,
    },
    {
      id: "biz-sam-handoff",
      source: "Business Registry" as const,
      title: `SAM.gov entity search: ${query}`,
      summary: "US federal System for Award Management — public entity registrations and exclusions (not a private phone directory).",
      url: `https://sam.gov/search/?index=ent&page=1&pageSize=25&sort=-relevance&sfm%5BsimpleSearch%5D%5BkeywordRadio%5D=ALL&sfm%5BsimpleSearch%5D%5BkeywordEditorTextarea%5D=${q}`,
      entityType: "organization",
      confidence: 68,
      provenance: "SAM.gov public entity search handoff",
      publicOnly: true,
      jurisdiction: "US",
    },
    {
      id: "biz-sos-handoff",
      source: "Business Registry" as const,
      title: `US state business registries (SoS): ${query}`,
      summary: "Secretary of State / corporations division public search portals (jurisdiction-specific). Use legal name; not reverse-phone 411.",
      url: `https://www.google.com/search?q=${encodeURIComponent(`"${query}" "secretary of state" business entity search`)}`,
      entityType: "organization",
      confidence: 55,
      provenance: "State business registry discovery handoff",
      publicOnly: true,
      jurisdiction: "US",
    },
  ];
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
      summary: asString(record.seendate)
        ? `Public news coverage indexed by GDELT on ${asString(record.seendate)}.`
        : "Public news coverage indexed by GDELT.",
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
  if (!process.env.MANUS_API_BASE_URL) return [];
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

type SettledName =
  | "Public Directory"
  | "Wikidata"
  | "Wikipedia"
  | "SEC EDGAR"
  | "GLEIF LEI"
  | "OpenSanctions"
  | "USAspending"
  | "Business Registry FR"
  | "GDELT News"
  | "X Public Posts";

export async function searchPublicResearch(rawQuery: string): Promise<ResearchResponse> {
  const query = normalizeResearchQuery(rawQuery);
  const cached = cache.get(query.toLowerCase());
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const jobs: { name: SettledName; connectorId: string; run: () => Promise<ResearchResult[]> }[] = [
    { name: "Public Directory", connectorId: "public-directory", run: () => searchPublicDirectory(query) },
    { name: "Wikidata", connectorId: "wikidata", run: () => searchWikidata(query) },
    { name: "Wikipedia", connectorId: "wikipedia", run: () => searchWikipedia(query) },
    { name: "SEC EDGAR", connectorId: "sec-edgar", run: () => searchSec(query) },
    { name: "GLEIF LEI", connectorId: "gleif", run: () => searchGleif(query) },
    { name: "OpenSanctions", connectorId: "opensanctions", run: () => searchOpenSanctions(query) },
    { name: "USAspending", connectorId: "usaspending", run: () => searchUsaSpending(query) },
    { name: "Business Registry FR", connectorId: "business-registry", run: () => searchFrEntreprises(query) },
    { name: "GDELT News", connectorId: "gdelt", run: () => searchGdelt(query) },
    { name: "X Public Posts", connectorId: "x-public-posts", run: () => searchManagedX(query) },
  ];

  const settled = await Promise.allSettled(jobs.map((j) => j.run()));
  const results: ResearchResult[] = [];
  const connectorStates = [];
  const warnings: string[] = [];

  settled.forEach((item, index) => {
    const job = jobs[index];
    if (item.status === "fulfilled") {
      results.push(...item.value);
      const status =
        job.connectorId === "x-public-posts" && item.value.length === 0 && !process.env.MANUS_API_BASE_URL
          ? "unconfigured"
          : item.value.length || job.connectorId !== "x-public-posts"
            ? "ok"
            : "unavailable";
      connectorStates.push(connectorState(job.connectorId, status as any));
    } else {
      warnings.push(`${job.name} unavailable for this run.`);
      const status =
        job.connectorId === "x-public-posts" && !process.env.MANUS_API_BASE_URL ? "unconfigured" : "unavailable";
      connectorStates.push(connectorState(job.connectorId, status as any, { warning: String((item as PromiseRejectedResult).reason?.message || item.reason) }));
    }
  });

  // Always attach public business-registry handoffs (directory / 411 business intent → public registries only)
  const handoffs = businessRegistryHandoffs(query);
  results.push(...handoffs);
  if (!connectorStates.find((c) => c.id === "business-registry" && c.status === "ok")) {
    // FR may have failed; ensure business-registry shows ok for handoffs
    const existing = connectorStates.findIndex((c) => c.id === "business-registry");
    if (existing >= 0) connectorStates[existing] = connectorState("business-registry", "ok");
    else connectorStates.push(connectorState("business-registry", "ok"));
  }

  if (isDirectoryIntent(query) || isBusinessDirectoryIntent(query)) {
    warnings.push(
      "Directory / 411 / reverse-listing intent: results include public phone-book, yellow pages, reverse-directory handoffs and OSM-listed contacts. Treat as leads; verify primary listings.",
    );
  }

  const sources = Array.from(new Set(results.map((r) => r.source))) as ResearchSource[];
  const response: ResearchResponse = {
    query,
    exactQuery: query,
    searchedAt: new Date().toISOString(),
    mode: isDirectoryIntent(query) || isBusinessDirectoryIntent(query) ? "business" : "entity",
    sources,
    connectorStates,
    results,
    warnings: results.length
      ? warnings
      : [...warnings, "No public records matched. Try a fuller legal name, ticker, LEI, domain, or jurisdiction."],
  };
  cache.set(query.toLowerCase(), { expiresAt: Date.now() + CACHE_MS, value: response });
  return response;
}

export function getResearchConnectorCatalog() {
  return connectorCatalog();
}
