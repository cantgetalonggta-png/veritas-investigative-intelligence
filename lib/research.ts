export type ResearchResult = {
  id: string;
  source: string;
  title: string;
  summary: string;
  url: string;
  entityType: string;
  confidence: number;
  provenance: string;
  publicOnly: boolean;
};

export type ResearchResponse = {
  query: string;
  searchedAt: string;
  sources: string[];
  results: ResearchResult[];
  warnings: string[];
  connectorStates: { id: string; status: string }[];
};

const TIMEOUT = 8000;

async function safeFetch(url: string, headers: Record<string, string> = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { headers: { accept: "application/json", ...headers }, signal: controller.signal });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function runPublicResearch(query: string): Promise<ResearchResponse> {
  const warnings: string[] = [];
  const connectorStates: { id: string; status: string }[] = [];
  const results: ResearchResult[] = [];

  // Wikidata
  try {
    const url = new URL("https://www.wikidata.org/w/api.php");
    url.searchParams.set("action", "wbsearchentities");
    url.searchParams.set("search", query);
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "6");
    const data = await safeFetch(url.toString(), { "user-agent": "Veritas/0.2" });
    (data.search || []).forEach((item: any, i: number) => {
      if (!item?.id || !item?.label) return;
      results.push({
        id: `wikidata-${item.id}`,
        source: "Wikidata",
        title: item.label,
        summary: item.description || "Public Wikidata entity",
        url: `https://www.wikidata.org/wiki/${item.id}`,
        entityType: "unknown",
        confidence: Math.max(58, 94 - i * 7),
        provenance: "Wikidata public entity search",
        publicOnly: true,
      });
    });
    connectorStates.push({ id: "wikidata", status: "ok" });
  } catch {
    connectorStates.push({ id: "wikidata", status: "unavailable" });
    warnings.push("Wikidata unavailable");
  }

  // SEC
  try {
    const data = await safeFetch("https://www.sec.gov/files/company_tickers.json", {
      "user-agent": "Veritas/0.2 public research",
    });
    const needle = query.toLowerCase();
    Object.values(data).forEach((item: any) => {
      const name = item.title;
      const ticker = item.ticker;
      const cik = String(item.cik_str).padStart(10, "0");
      if (!name || !(`${name} ${ticker || ""}`.toLowerCase().includes(needle))) return;
      results.push({
        id: `sec-${cik}`,
        source: "SEC EDGAR",
        title: name,
        summary: `SEC registrant${ticker ? ` · ticker ${ticker}` : ""}`,
        url: `https://www.sec.gov/edgar/browse/?CIK=${cik}`,
        entityType: "organization",
        confidence: ticker?.toLowerCase() === needle ? 97 : 82,
        provenance: "SEC EDGAR company ticker index",
        publicOnly: true,
      });
    });
    connectorStates.push({ id: "sec-edgar", status: "ok" });
  } catch {
    connectorStates.push({ id: "sec-edgar", status: "unavailable" });
    warnings.push("SEC EDGAR unavailable");
  }

  // GDELT
  try {
    const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
    url.searchParams.set("query", `"${query.replace(/"/g, "")}"`);
    url.searchParams.set("mode", "artlist");
    url.searchParams.set("format", "json");
    url.searchParams.set("maxrecords", "8");
    const data = await safeFetch(url.toString());
    (data.articles || []).forEach((item: any, i: number) => {
      if (!item.title || !item.url) return;
      results.push({
        id: `gdelt-${Buffer.from(item.url).toString("base64url").slice(0, 24)}`,
        source: "GDELT News",
        title: item.title,
        summary: item.seendate ? `Indexed ${item.seendate}` : "GDELT news coverage",
        url: item.url,
        entityType: "unknown",
        confidence: Math.max(55, 88 - i * 4),
        provenance: "GDELT DOC public news index",
        publicOnly: true,
      });
    });
    connectorStates.push({ id: "gdelt", status: "ok" });
  } catch {
    connectorStates.push({ id: "gdelt", status: "unavailable" });
    warnings.push("GDELT unavailable");
  }

  // Wikipedia
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&format=json`;
    const data = await safeFetch(url);
    const titles = data[1] || [];
    const descs = data[2] || [];
    const links = data[3] || [];
    titles.forEach((t: string, i: number) => {
      results.push({
        id: `wiki-${i}`,
        source: "Wikipedia",
        title: t,
        summary: descs[i] || "Wikipedia article",
        url: links[i],
        entityType: "unknown",
        confidence: Math.max(65, 92 - i * 5),
        provenance: "Wikipedia OpenSearch",
        publicOnly: true,
      });
    });
    connectorStates.push({ id: "wikipedia", status: "ok" });
  } catch {
    connectorStates.push({ id: "wikipedia", status: "unavailable" });
    warnings.push("Wikipedia unavailable");
  }

  // OpenAlex
  try {
    const data = await safeFetch(
      `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=5`,
      { "User-Agent": "Veritas/0.2 (mailto:research@veritas.local)" }
    );
    (data.results || []).forEach((w: any, i: number) => {
      results.push({
        id: `openalex-${i}`,
        source: "OpenAlex",
        title: w.display_name || "Untitled",
        summary: "Academic work from OpenAlex open graph",
        url: w.id || "https://openalex.org",
        entityType: "unknown",
        confidence: Math.max(60, 90 - i * 5),
        provenance: "OpenAlex scholarly graph",
        publicOnly: true,
      });
    });
    connectorStates.push({ id: "openalex", status: "ok" });
  } catch {
    connectorStates.push({ id: "openalex", status: "unavailable" });
    warnings.push("OpenAlex unavailable");
  }

  return {
    query,
    searchedAt: new Date().toISOString(),
    sources: ["Wikidata", "SEC EDGAR", "GDELT News", "Wikipedia", "OpenAlex"],
    results,
    warnings: results.length ? warnings : [...warnings, "No public records matched. Try a fuller name, ticker, or domain."],
    connectorStates,
  };
}
