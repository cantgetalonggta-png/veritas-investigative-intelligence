import { describe, expect, it } from "vitest";
import { evidenceItems } from "../shared/investigation-data";
import { localInvestigationServices } from "../shared/investigation-services";

describe("investigation services", () => {
  it("filters evidence by query and provenance status", () => {
    const result = localInvestigationServices.filterEvidence(evidenceItems, "contact", "restricted");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("ev-004");
  });

  it("keeps restricted evidence visibly restricted with a quarantine action", () => {
    const result = localInvestigationServices.checkSource(evidenceItems.find((item) => item.id === "ev-004")!);
    expect(result.status).toBe("restricted");
    expect(result.headline).toContain("Restricted");
    expect(result.nextAction).toContain("Quarantine");
    expect(result.checks.some((check) => check.result === "hold")).toBe(true);
  });

  it("marks metadata anomalies for manual review", () => {
    const result = localInvestigationServices.checkSource(evidenceItems.find((item) => item.id === "ev-002")!);
    expect(result.status).toBe("uncertain");
    expect(result.checks.find((check) => check.label === "Tampering indicators")?.result).toBe("review");
  });

  it("returns assistive copilot language with evidence context", () => {
    const result = localInvestigationServices.askCopilot("What needs human review before publication?", evidenceItems);
    expect(result.answer).toContain("private contact export");
    expect(result.guardrail).toContain("verify");
    expect(result.evidenceIds).toEqual(["ev-004", "ev-002"]);
  });
});
