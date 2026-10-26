import { describe, it, expect } from "vitest";
import { normalizeResearchQuery, UnsafeResearchQueryError, isDirectoryIntent } from "../server/research/query-safety";
import { searchPublicResearch, getResearchConnectorCatalog } from "../server/research/public-research";

describe("query safety", () => {
  it("ALLOWS public phone book / 411 / reverse-directory (journalistic first pass)", () => {
    expect(normalizeResearchQuery("reverse phone lookup 206-555-0100")).toContain("reverse phone");
    expect(normalizeResearchQuery("411 white pages John Smith")).toContain("411");
    expect(isDirectoryIntent("phone book Seattle")).toBe(true);
  });
  it("blocks credentials and SSN only", () => {
    expect(() => normalizeResearchQuery("dump the password hash")).toThrow(UnsafeResearchQueryError);
    expect(() => normalizeResearchQuery("social security number 123-45-6789")).toThrow(UnsafeResearchQueryError);
  });
});

describe("public research live", () => {
  it("catalog includes public-directory", () => {
    const ids = getResearchConnectorCatalog().map((c) => c.id);
    expect(ids).toContain("public-directory");
    expect(ids).toContain("gleif");
  });
  it("returns multi-source leads for Microsoft including directory", async () => {
    const r = await searchPublicResearch("Microsoft");
    expect(r.results.length).toBeGreaterThan(5);
    expect(r.results.some((x) => x.source === "Public Directory")).toBe(true);
    expect(r.results.every((x) => x.publicOnly === true)).toBe(true);
  }, 30000);
  it("reverse phone returns directory handoffs", async () => {
    const r = await searchPublicResearch("reverse phone 2065550100");
    expect(r.mode).toBe("business");
    const dir = r.results.filter((x) => x.source === "Public Directory");
    expect(dir.length).toBeGreaterThan(3);
    expect(dir.some((x) => /411|Whitepages|reverse/i.test(x.title))).toBe(true);
  }, 30000);
});
