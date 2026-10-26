import { afterEach, describe, expect, it, vi } from "vitest";
import { searchPublicResearch } from "../server/research/public-research";

afterEach(() => vi.unstubAllGlobals());

describe("public research search", () => {
  it("normalizes Wikidata, SEC, and GDELT records into cited results", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("wikidata.org")) return new Response(JSON.stringify({ search: [{ id: "Q42", label: "Douglas Adams", description: "English writer and humorist" }] }), { status: 200 });
      if (url.includes("sec.gov")) return new Response(JSON.stringify({ one: { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." } }), { status: 200 });
      if (url.includes("gdeltproject.org")) return new Response(JSON.stringify({ articles: [{ title: "Douglas Adams archive coverage", url: "https://example.test/story", seendate: "20261025T120000Z" }] }), { status: 200 });
      return new Response(JSON.stringify({}), { status: 200 });
    }));

    const response = await searchPublicResearch("Douglas Adams");
    expect(response.results.map((result) => result.source)).toEqual(["Wikidata", "GDELT News"]);
    expect(response.results.every((result) => result.publicOnly && result.url.startsWith("http"))).toBe(true);
    expect(response.warnings).toEqual([]);
  });

  it("returns source warnings instead of failing the whole lookup", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("wikidata.org")) return new Response("upstream unavailable", { status: 503 });
      if (url.includes("sec.gov")) return new Response(JSON.stringify({}), { status: 200 });
      if (url.includes("gdeltproject.org")) return new Response(JSON.stringify({ articles: [] }), { status: 200 });
      return new Response(JSON.stringify({}), { status: 200 });
    }));

    const response = await searchPublicResearch("Unavailable Person");
    expect(response.results).toEqual([]);
    expect(response.warnings).toContain("Wikidata unavailable for this run.");
  });
});
