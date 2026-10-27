export type ResearchSource =
  | "Wikidata"
  | "SEC EDGAR"
  | "GDELT News"
  | "X Public Posts"
  | "Historical Index"
  | "GLEIF LEI"
  | "OpenSanctions"
  | "USAspending"
  | "Business Registry"
  | "Wikipedia"
  | "Public Directory";

export type ResearchEntityType = "person" | "organization" | "unknown";
export type ConnectorStatus =
  | "ok"
  | "partial"
  | "unconfigured"
  | "rate_limited"
  | "unavailable"
  | "blocked_by_policy";
export type ResearchMode = "entity" | "historical" | "safe-web" | "business";

export type ConnectorDescriptor = {
  id: string;
  label: string;
  source: ResearchSource;
  capabilities: (
    | "entity-search"
    | "records"
    | "news-search"
    | "historical-index"
    | "public-posts"
    | "document-acquisition"
    | "sanctions-screen"
    | "lei-lookup"
    | "federal-spend"
    | "business-registry"
    | "directory-search"
  )[];
  requiresCredential: boolean;
  retention: "metadata-only" | "source-linked" | "user-authorized-acquisition";
};

export type ConnectorState = ConnectorDescriptor & {
  status: ConnectorStatus;
  latencyMs?: number;
  warning?: string;
};

export type ResearchResult = {
  id: string;
  source: ResearchSource;
  title: string;
  summary: string;
  url: string;
  publishedAt?: string;
  entityType: ResearchEntityType;
  confidence: number;
  provenance: string;
  publicOnly: true;
  historicalOnly?: boolean;
  contentType?: string;
  jurisdiction?: string;
};

export type ResearchResponse = {
  query: string;
  searchedAt: string;
  mode: ResearchMode;
  exactQuery: string;
  sources: ResearchSource[];
  connectorStates: ConnectorState[];
  results: ResearchResult[];
  warnings: string[];
};

export type SafeQueryTemplate = {
  label: string;
  providerSyntax: "web" | "domain" | "records";
  query: string;
  safetyNote: string;
};

/** Full multi-engine investigation catalog (259 engines + auto term expansion). */
export {
  SEARCH_ENGINES,
  SEARCH_ENGINES_COUNT,
  SEARCH_ENGINE_POLICY,
  SEARCH_ENGINE_PLACEHOLDERS,
  expandInvestigationTerms,
  buildEngineQueryUrl,
  enginesByType,
  activeEngines,
  developAllSearchTerms,
} from "./search-engines-catalog";
export type { SearchEngineEntry, SearchEngineType, SearchEngineStatus } from "./search-engines-catalog";
