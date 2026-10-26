import type { SafeQueryTemplate } from "../../shared/research";

/** Credential / private-access / non-public PII targeting — hard block. */
const BLOCKED_PATTERNS = [
  /(?:password|passcode|secret|api[_ -]?key|private[_ -]?key|bearer token)/i,
  /(?:credential|login|admin|wp-config|\.env|backup dump|database dump)/i,
  /(?:session cookie|access token|ssh key|wallet seed|social security|ssn\b|itin\b)/i,
  /(?:credit\s*card|cvv|bank\s*account|routing\s*number|iban\b)/i,
  /(?:doxx?|swat|stalk|harass)/i,
  // Private phone / reverse-directory / non-public 411 style targeting
  /(?:reverse\s*(?:phone|lookup|directory)|phone\s*owner|who\s*owns\s*(?:this\s*)?(?:number|phone))/i,
  /(?:caller\s*id\s*lookup|cell\s*phone\s*lookup|unlisted\s*number)/i,
  /(?:people\s*search\s*(?:for\s*)?(?:ssn|dob|address)|skip\s*trace)/i,
  /(?:home\s*address\s*(?:of|for)\s+\w+|private\s*residence\s*of)/i,
];

/** Soft guidance: business-directory intent is OK as public entity search, not private reverse-411. */
const BUSINESS_DIRECTORY_HINT =
  /(?:411|white\s*pages|yellow\s*pages|phone\s*book|directory|business\s*(?:listing|directory)|chamber\s*of\s*commerce)/i;

export class UnsafeResearchQueryError extends Error {
  code = "BLOCKED_RESEARCH_QUERY" as const;
}

export function normalizeResearchQuery(rawQuery: string): string {
  const query = rawQuery.trim().replace(/\s+/g, " ").slice(0, 160);
  if (query.length < 2) throw new Error("Search query must contain at least 2 characters.");
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(query))) {
    throw new UnsafeResearchQueryError(
      "Blocked: this pattern targets credentials, private contact reverse-lookup, or non-public PII. Veritas only searches public-record / public-business sources.",
    );
  }
  return query;
}

export function isBusinessDirectoryIntent(query: string): boolean {
  return BUSINESS_DIRECTORY_HINT.test(query);
}

export function normalizePublicDomain(rawDomain: string): string {
  const domain = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!domain || domain.includes(" ") || domain.includes("@") || domain.includes("/") || domain.length > 120) {
    throw new Error("Provide a valid public domain without a path or credentials.");
  }
  if (domain === "localhost" || domain.endsWith(".localhost") || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(domain)) {
    throw new UnsafeResearchQueryError("Local and direct-IP destinations are blocked from public research templates.");
  }
  return domain;
}

export function buildSafeSearchTemplates(subject: string, domains: string[] = []): SafeQueryTemplate[] {
  const normalizedSubject = normalizeResearchQuery(subject).replace(/["\\]/g, "");
  const scopedDomain = domains[0] ? normalizePublicDomain(domains[0]) : undefined;
  const scope = scopedDomain ? `site:${scopedDomain} ` : "";
  return [
    {
      label: "Public documents",
      providerSyntax: "web",
      query: `${scope}"${normalizedSubject}" filetype:pdf`,
      safetyNote: "Finds public documents; does not target accounts, credentials, or private systems.",
    },
    {
      label: "Contracts and filings",
      providerSyntax: "records",
      query: `${scope}"${normalizedSubject}" (contract OR filing OR report OR LEI OR "business registration")`,
      safetyNote: "Public filings and registry language only — verify original sources.",
    },
    {
      label: "Business registry language",
      providerSyntax: "records",
      query: `"${normalizedSubject}" ("articles of incorporation" OR "business license" OR "registered agent" OR "secretary of state")`,
      safetyNote: "Discovery terms for public business registries — not private phone books.",
    },
    {
      label: "Meetings and hearings",
      providerSyntax: "domain",
      query: `${scope}"${normalizedSubject}" (meeting minutes OR hearing OR agenda OR FOIA)`,
      safetyNote: "Public-record discovery terms; verify the original source before citing.",
    },
  ];
}
