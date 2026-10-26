import { isIP } from "node:net";

const MAX_MARKDOWN_BYTES = 2_000_000;
const TIMEOUT_MS = 20_000;

export type AcquisitionResult = {
  url: string;
  markdown: string;
  source: "firecrawl";
  retrievedAt: string;
  derivativeOnly: true;
};

function assertPublicUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new Error("Only credential-free public HTTP(S) URLs are allowed.");
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || isIP(hostname)) {
    throw new Error("Local, direct-IP, and private-network destinations are blocked.");
  }
  return url;
}

export async function acquirePublicPageWithFirecrawl(rawUrl: string): Promise<AcquisitionResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("Firecrawl is unconfigured; set FIRECRAWL_API_KEY server-side before enabling acquisition.");
  const url = assertPublicUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ url: url.toString(), formats: ["markdown"], onlyMainContent: true, waitFor: 0 }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Firecrawl returned ${response.status}.`);
    const payload = await response.json() as { data?: { markdown?: unknown } };
    const markdown = typeof payload.data?.markdown === "string" ? payload.data.markdown : "";
    if (!markdown) throw new Error("Firecrawl returned no Markdown derivative.");
    if (Buffer.byteLength(markdown, "utf8") > MAX_MARKDOWN_BYTES) throw new Error("Acquired derivative exceeds the configured size limit.");
    return { url: url.toString(), markdown, source: "firecrawl", retrievedAt: new Date().toISOString(), derivativeOnly: true };
  } finally {
    clearTimeout(timeout);
  }
}
