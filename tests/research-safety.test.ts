import { describe, expect, it } from "vitest";
import { connectorCatalog } from "../server/research/registry";
import { buildSafeSearchTemplates, normalizePublicDomain, normalizeResearchQuery, UnsafeResearchQueryError } from "../server/research/query-safety";

describe("governed research safety", () => {
  it("blocks credential and private-access targeting", () => {
    expect(() => normalizeResearchQuery("password dump for Example Corp")).toThrow(UnsafeResearchQueryError);
    expect(() => normalizeResearchQuery("site:example.gov annual report")).not.toThrow();
  });

  it("builds bounded public-record templates", () => {
    const templates = buildSafeSearchTemplates("Example Organization", ["agency.gov"]);
    expect(templates).toHaveLength(3);
    expect(templates[0].query).toContain("site:agency.gov");
    expect(templates.every((template) => !/password|token|private[_ -]?key/i.test(template.query))).toBe(true);
  });

  it("rejects local and direct-IP template destinations", () => {
    expect(() => normalizePublicDomain("localhost")).toThrow(UnsafeResearchQueryError);
    expect(() => normalizePublicDomain("127.0.0.1")).toThrow(UnsafeResearchQueryError);
  });

  it("declares credential and retention boundaries for every connector", () => {
    const catalog = connectorCatalog();
    expect(catalog.map((connector) => connector.id)).toEqual(expect.arrayContaining(["wikidata", "sec-edgar", "wayback-commoncrawl", "firecrawl"]));
    expect(catalog.find((connector) => connector.id === "firecrawl")?.status).toBe("unconfigured");
    expect(catalog.find((connector) => connector.id === "firecrawl")?.retention).toBe("user-authorized-acquisition");
  });
});
