import type { EvidenceItem, SourceStatus } from "./investigation-data";

export type SourceCheck = {
  status: SourceStatus;
  score: number;
  headline: string;
  checks: Array<{ label: string; result: "pass" | "review" | "hold"; detail: string }>;
  nextAction: string;
};

export type CopilotReply = {
  answer: string;
  confidence: number;
  evidenceIds: string[];
  guardrail: string;
};

export type InvestigationServices = {
  filterEvidence(items: EvidenceItem[], query: string, status: SourceStatus | "all"): EvidenceItem[];
  checkSource(item: EvidenceItem): SourceCheck;
  askCopilot(prompt: string, context: EvidenceItem[]): CopilotReply;
};

export const localInvestigationServices: InvestigationServices = {
  filterEvidence(items, query, status) {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = status === "all" || item.status === status;
      const haystack = [item.title, item.type, item.source, item.license, ...item.tags].join(" ").toLowerCase();
      return matchesStatus && (!normalized || haystack.includes(normalized));
    });
  },

  checkSource(item) {
    const restricted = item.status === "restricted";
    const uncertain = item.status === "uncertain";
    return {
      status: item.status,
      score: item.score,
      headline: restricted
        ? "Restricted — do not publish"
        : uncertain
          ? "Uncertain — human review required"
          : "Verified for continued review",
      checks: [
        {
          label: "Source authenticity",
          result: restricted ? "hold" : uncertain ? "review" : "pass",
          detail: item.source,
        },
        {
          label: "License / consent",
          result: item.license.includes("pending") || item.license.includes("missing") ? "review" : "pass",
          detail: item.license,
        },
        {
          label: "Tampering indicators",
          result: item.id === "ev-002" ? "review" : "pass",
          detail: item.id === "ev-002" ? "Metadata mismatch detected" : "No anomaly in fixture check",
        },
      ],
      nextAction: restricted
        ? "Quarantine the item and remove unrelated personal data before any further sharing."
        : uncertain
          ? "Keep this item in review and verify consent and original provenance with the source."
          : "Retain the custody record and corroborate with at least one independent source.",
    };
  },

  askCopilot(prompt, context) {
    const lower = prompt.toLowerCase();
    if (lower.includes("human review") || lower.includes("publish")) {
      return {
        answer:
          "The private contact export is the clearest hold: it includes personal data without documented consent. The anonymous invoice is still uncertain because its metadata conflicts with the submitted provenance. Treat both as review items, not publishable proof.",
        confidence: 96,
        evidenceIds: ["ev-004", "ev-002"],
        guardrail: "Assistive draft · verify with the source record and an editor before publication.",
      };
    }
    if (lower.includes("harbor civic") || lower.includes("connection")) {
      return {
        answer:
          "The strongest supported connection is the shared-director signal between Harbor Civic and Northstar Marine. It is supported by the verified tender ledger and should be checked against a second registry or filing before you state it as fact.",
        confidence: 89,
        evidenceIds: ["ev-001", "ev-005"],
        guardrail: "Assistive lead · not a finding of wrongdoing.",
      };
    }
    return {
      answer:
        "The strongest verified signal is a cross-record link between two vendors and a public procurement trail. I can help compare the ledger, field photo, and interview memo, but the relationship still needs human corroboration and a documented source note.",
      confidence: 84,
      evidenceIds: context.slice(0, 2).map((item) => item.id),
      guardrail: "Assistive summary · confidence reflects fixture evidence only.",
    };
  },
};
