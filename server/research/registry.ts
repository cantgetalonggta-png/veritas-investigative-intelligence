import type { ConnectorDescriptor, ConnectorState } from "../../shared/research";

export const RESEARCH_CONNECTORS: ConnectorDescriptor[] = [
  { id: "wikidata", label: "Wikidata", source: "Wikidata", capabilities: ["entity-search"], requiresCredential: false, retention: "source-linked" },
  { id: "sec-edgar", label: "SEC EDGAR", source: "SEC EDGAR", capabilities: ["entity-search", "records"], requiresCredential: false, retention: "source-linked" },
  { id: "gdelt", label: "GDELT News", source: "GDELT News", capabilities: ["news-search"], requiresCredential: false, retention: "source-linked" },
  { id: "x-public-posts", label: "X Public Posts", source: "X Public Posts", capabilities: ["public-posts"], requiresCredential: true, retention: "metadata-only" },
  { id: "wayback-commoncrawl", label: "Historical Indexes", source: "Historical Index", capabilities: ["historical-index"], requiresCredential: false, retention: "source-linked" },
  { id: "firecrawl", label: "Firecrawl acquisition", source: "Historical Index", capabilities: ["document-acquisition"], requiresCredential: true, retention: "user-authorized-acquisition" },
];

export function connectorState(id: string, status: ConnectorState["status"], extras: Partial<ConnectorState> = {}): ConnectorState {
  const descriptor = RESEARCH_CONNECTORS.find((connector) => connector.id === id);
  if (!descriptor) throw new Error(`Unknown research connector: ${id}`);
  return { ...descriptor, status, ...extras };
}

export function connectorCatalog(): ConnectorState[] {
  return RESEARCH_CONNECTORS.map((connector) => ({ ...connector, status: connector.requiresCredential ? "unconfigured" : "ok" }));
}
