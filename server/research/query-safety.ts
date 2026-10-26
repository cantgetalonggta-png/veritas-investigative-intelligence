import type { SafeQueryTemplate } from "../../shared/research";

const BLOCKED_PATTERNS = [
  /(?:password|passcode|secret|api[_ -]?key|private[_ -]?key|bearer token)/i,
  /(?:credential|login|admin|wp-config|\.env|backup dump|database dump)/i,
  /(?:session cookie|access token|ssh key|wallet seed|social security number)/i,
];

export class UnsafeResearchQueryError extends Error {
  code = "BLOCKED_RESEARCH_QUERY" as const;
}

export function normalizeResearchQuery(rawQuery: string): string {
  const query = rawQuery.trim().replace(/\s+/g, " ").slice(0, 160);
  if (query.length < 2) throw new Error("Search query must contain at least 2 characters.");
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(query))) {
    throw new UnsafeResearchQueryError("This search pattern targets credentials, private access, or sensitive secrets and is blocked.");
  }
  return query;
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
    { label: "Public documents", providerSyntax: "web", query: `${scope}"${normalizedSubject}" filetype:pdf`, safetyNote: "Finds public documents; does not target accounts, credentials, or private systems." },
    { label: "Contracts and filings", providerSyntax: "records", query: `${scope}"${normalizedSubject}" (contract OR filing OR report)`, safetyNote: "Use only with a provider that supports these operators; snippets are discovery leads." },
    { label: "Meetings and hearings", providerSyntax: "domain", query: `${scope}"${normalizedSubject}" (meeting minutes OR hearing OR agenda)`, safetyNote: "Returns public-record discovery terms; verify the original source before citing." },
  ];
}
