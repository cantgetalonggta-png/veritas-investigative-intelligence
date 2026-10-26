import { describe, it, expect } from "vitest";
import { normalizeResearchQuery, UnsafeResearchQueryError } from "../server/research/query-safety";
import { searchPublicResearch, getResearchConnectorCatalog } from "../server/research/public-research";

describe("query safety", () => {
  it("blocks reverse phone / private 411 patterns", () => {
    expect(() => normalizeResearchQuery("reverse phone lookup 555-1212")).toThrow(UnsafeResearchQueryError);
    expect(() => normalizeResearchQuery("skip trace john doe")).toThrow(UnsafeResearchQueryError);
  });
  it("allows business entity queries", () => {
    expect(normalizeResearchQuery("Microsoft Corporation")).toBe("Microsoft Corporation");
  });
});

describe("public research live", () => {
  it("catalog includes expanded connectors", () => {
    const cat = getResearchConnectorCatalog();
    const ids = cat.map((c) => c.id);
    expect(ids).toContain("gleif");
    expect(ids).toContain("business-registry");
    expect(ids).toContain("usaspending");
  });
  it("returns multi-source leads for Microsoft", async () => {
    const r = await searchPublicResearch("Microsoft");
    expect(r.results.length).toBeGreaterThan(5);
    const sources = new Set(r.results.map((x) => x.source));
    expect(sources.has("Wikidata") || sources.has("GLEIF LEI") || sources.has("SEC EDGAR")).toBe(true);
    expect(r.results.every((x) => x.publicOnly === true)).toBe(true);
  }, 30000);
});
