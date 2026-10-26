import type { SafeQueryTemplate } from "../../shared/research";

/**
 * Veritas is an investigative journalism workspace.
 * Published phone books, 411 listings, white/yellow pages, and reverse lookups
 * against PUBLICLY LISTED numbers are standard first-pass OSINT — not doxxing.
 *
 * Hard block only: credentials/secrets, financial account numbers, SSN, and
 * explicit violent/harassment targeting. Do NOT block directory/411/reverse-phone
 * language or public address discovery for news reporting.
 */
const BLOCKED_PATTERNS = [
  /(?:password|passcode|secret|api[_ -]?key|private[_ -]?key|bearer token)/i,
  /(?:credential|login|wp-config|\.env|backup dump|database dump)/i,
  /(?:session cookie|access token|ssh key|wallet seed)/i,
  /(?:social security number|\bssn\b|\bitin\b)/i,
  /(?:credit\s*card|cvv|bank\s*account|routing\s*number|\biban\b)/i,
  // Explicit harm targeting — not directory research
  /(?:\bswat\b|\bswatting\b|bomb\s*threat)/i,
  /(?:how\s+to\s+(?:stalk|harass|doxx?)\b)/i,
];

/** Directory / 411 / phone book / reverse-lookup intent (ALLOWED — journalistic). */
const DIRECTORY_INTENT =
  /(?:411|white\s*pages|yellow\s*pages|phone\s*book|telephone\s*directory|reverse\s*(?:phone|lookup|directory)|caller\s*id|directory\s*assistance|business\s*(?:listing|directory)|chamber\s*of\s*commerce|phone\s*(?:number|listing)|who\s*(?:owns|has|is)\s*(?:this\s*)?(?:number|phone)|skip\s*trace)/i;

/** Rough NANP / intl phone fragment in the query */
const PHONE_FRAGMENT =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b|\b\d{10,15}\b/;

export class UnsafeResearchQueryError extends Error {
  code = "BLOCKED_RESEARCH_QUERY" as const;
}

export function normalizeResearchQuery(rawQuery: string): string {
  const query = rawQuery.trim().replace(/\s+/g, " ").slice(0, 160);
  if (query.length < 2) throw new Error("Search query must contain at least 2 characters.");
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(query))) {
    throw new UnsafeResearchQueryError(
      "Blocked: credential/secret theft, SSN/financial account targeting, or explicit harm instructions are outside Veritas public-record research.",
    );
  }
  return query;
}

export function isBusinessDirectoryIntent(query: string): boolean {
  return DIRECTORY_INTENT.test(query) || PHONE_FRAGMENT.test(query);
}

export function isDirectoryIntent(query: string): boolean {
  return isBusinessDirectoryIntent(query);
}

export function extractPhoneCandidates(query: string): string[] {
  const matches = query.match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b|\b\d{10,15}\b/g) || [];
  return [...new Set(matches.map((m) => m.replace(/[^\d+]/g, "")).filter((m) => m.replace(/\D/g, "").length >= 10))];
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
      label: "Public phone / directory listings",
      providerSyntax: "web",
      query: `${scope}"${normalizedSubject}" ("phone" OR "telephone" OR "411" OR "white pages" OR "yellow pages" OR directory)`,
      safetyNote: "Published directory & business listing discovery — standard journalistic first pass.",
    },
    {
      label: "Public documents",
      providerSyntax: "web",
      query: `${scope}"${normalizedSubject}" filetype:pdf`,
      safetyNote: "Public documents; verify original source before citing.",
    },
    {
      label: "Contracts and filings",
      providerSyntax: "records",
      query: `${scope}"${normalizedSubject}" (contract OR filing OR report OR LEI OR "business registration")`,
      safetyNote: "Public filings and registry language.",
    },
    {
      label: "Business registry language",
      providerSyntax: "records",
      query: `"${normalizedSubject}" ("articles of incorporation" OR "business license" OR "registered agent" OR "secretary of state")`,
      safetyNote: "Public business registries and SoS portals.",
    },
    {
      label: "Meetings and hearings",
      providerSyntax: "domain",
      query: `${scope}"${normalizedSubject}" (meeting minutes OR hearing OR agenda OR FOIA)`,
      safetyNote: "Public-record discovery terms.",
    },
  ];
}
