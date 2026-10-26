import type { ResearchResult } from "../../shared/research";
import { normalizePublicDomain } from "./query-safety";

const TIMEOUT_MS = 8_000;

type JsonRecord = Record<string, unknown>;

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers: { accept: "application/json,text/plain" }, signal: controller.signal });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function searchWayback(domain: string): Promise<ResearchResult[]> {
  const url = new URL("https://web.archive.org/cdx/search/cdx");
  url.searchParams.set("url", `${domain}/*`);
  url.searchParams.set("output", "json");
  url.searchParams.set("filter", "statuscode:200");
  url.searchParams.set("fl", "timestamp,original,statuscode,mimetype");
  url.searchParams.set("collapse", "urlkey");
  url.searchParams.set("limit", "12");
  const raw = await fetchText(url.toString());
  const rows = JSON.parse(raw) as unknown;
  if (!Array.isArray(rows) || rows.length < 2) return [];
  const headers = rows[0] as string[];
  return rows.slice(1).flatMap((row, index) => {
    if (!Array.isArray(row)) return [];
    const record = Object.fromEntries(headers.map((header, position) => [header, row[position]])) as JsonRecord;
    const timestamp = typeof record.timestamp === "string" ? record.timestamp : undefined;
    const original = typeof record.original === "string" ? record.original : undefined;
    if (!timestamp || !original) return [];
    return [{
      id: `wayback-${timestamp}-${index}`,
      source: "Historical Index" as const,
      title: `Archived public URL · ${new URL(original).hostname}`,
      summary: "Historical index lead. Review the archived capture and original context; index presence is not proof of document contents.",
      url: `https://web.archive.org/web/${timestamp}/${original}`,
      publishedAt: timestamp,
      entityType: "unknown" as const,
      confidence: 70,
      provenance: "Internet Archive CDX index",
      publicOnly: true as const,
      historicalOnly: true,
      contentType: typeof record.mimetype === "string" ? record.mimetype : undefined,
    } satisfies ResearchResult];
  });
}

async function searchCommonCrawl(domain: string): Promise<ResearchResult[]> {
  const collections = JSON.parse(await fetchText("https://index.commoncrawl.org/collinfo.json")) as unknown;
  if (!Array.isArray(collections) || !collections[0] || typeof collections[0] !== "object") return [];
  const firstCollection = collections[0] as JsonRecord;
  const indexUrl = (firstCollection["cdx-api"] ?? firstCollection.cdx_api) as string | undefined;
  if (!indexUrl) return [];
  const url = new URL(indexUrl);
  url.searchParams.set("url", `${domain}/*`);
  url.searchParams.set("output", "json");
  url.searchParams.set("filter", "status:200");
  url.searchParams.set("limit", "12");
  const lines = (await fetchText(url.toString())).split("\n").filter(Boolean);
  return lines.flatMap((line, index) => {
    try {
      const record = JSON.parse(line) as JsonRecord;
      const original = typeof record.url === "string" ? record.url : undefined;
      const digest = typeof record.digest === "string" ? record.digest : String(index);
      if (!original) return [];
      return [{
        id: `commoncrawl-${digest}`,
        source: "Historical Index" as const,
        title: `Common Crawl URL · ${new URL(original).hostname}`,
        summary: "Historical crawl index lead. Retrieve and review the permitted original before treating it as evidence.",
        url: original,
        entityType: "unknown" as const,
        confidence: 62,
        provenance: "Common Crawl index",
        publicOnly: true as const,
        historicalOnly: true,
        contentType: typeof record.mime === "string" ? record.mime : undefined,
      } satisfies ResearchResult];
    } catch {
      return [];
    }
  });
}

export async function searchHistoricalIndexes(rawDomain: string): Promise<{ results: ResearchResult[]; warnings: string[] }> {
  const domain = normalizePublicDomain(rawDomain);
  const settled = await Promise.allSettled([searchWayback(domain), searchCommonCrawl(domain)]);
  const results = settled.flatMap((item) => item.status === "fulfilled" ? item.value : []);
  const warnings = settled.flatMap((item, index) => item.status === "rejected" ? [`${index === 0 ? "Internet Archive" : "Common Crawl"} unavailable for this run.`] : []);
  return { results, warnings };
}
