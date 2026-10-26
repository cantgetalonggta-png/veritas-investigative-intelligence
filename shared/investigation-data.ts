export type SourceStatus = "verified" | "uncertain" | "restricted";
export type EvidenceType = "Document" | "Image" | "Audio" | "Video" | "Note";
export type InvestigationRole = "Editor" | "Analyst" | "Contributor";

export type EvidenceItem = {
  id: string;
  title: string;
  type: EvidenceType;
  status: SourceStatus;
  score: number;
  date: string;
  size: string;
  source: string;
  license: string;
  tags: string[];
  custody: string[];
  summary: string;
};

export type Insight = {
  id: string;
  title: string;
  detail: string;
  confidence: number;
  tone: "cyan" | "violet" | "amber" | "red";
  signal: string;
  evidenceIds: string[];
};

export type EntityNode = {
  id: string;
  label: string;
  kind: "person" | "organization" | "location" | "event";
  x: number;
  y: number;
  color: string;
};

export type TeamTask = {
  id: string;
  title: string;
  owner: string;
  progress: number;
  status: "In review" | "Active" | "Queued";
};

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  tone: "cyan" | "violet" | "amber";
};

export const currentCase = {
  id: "case-001",
  name: "Northstar Ledger",
  status: "Active / 14 days",
  description: "Follow the money trail across three shell entities and two public procurement records.",
  progress: 68,
  sources: 42,
  entities: 18,
  signals: 7,
};

export const evidenceItems: EvidenceItem[] = [
  {
    id: "ev-001",
    title: "Port Authority tender ledger — Q3",
    type: "Document",
    status: "verified",
    score: 96,
    date: "18 Oct 2026",
    size: "4.8 MB",
    source: "Public procurement portal",
    license: "Open government data",
    tags: ["procurement", "Northstar", "Q3"],
    custody: ["Imported by Maya Chen · 18 Oct", "Hash verified · 18 Oct", "Source checked · 19 Oct"],
    summary: "A structured export with 19 award records. Two vendor names overlap with the Northstar network.",
  },
  {
    id: "ev-002",
    title: "Invoice_4481_redacted.pdf",
    type: "Document",
    status: "uncertain",
    score: 72,
    date: "17 Oct 2026",
    size: "1.2 MB",
    source: "Anonymous submission",
    license: "Consent pending",
    tags: ["invoice", "redaction", "review"],
    custody: ["Received via secure drop · 17 Oct", "Metadata mismatch flagged · 17 Oct"],
    summary: "Invoice references a contractor name found in the tender ledger. Original provenance needs human review.",
  },
  {
    id: "ev-003",
    title: "Harbor route audio memo",
    type: "Audio",
    status: "verified",
    score: 88,
    date: "14 Oct 2026",
    size: "18.4 MB",
    source: "Reporter interview",
    license: "Reporter-owned recording",
    tags: ["harbor", "interview", "route"],
    custody: ["Recorded by Maya Chen · 14 Oct", "Transcript generated · 15 Oct"],
    summary: "Interview places a Northstar intermediary at the same harbor office as a flagged vendor.",
  },
  {
    id: "ev-004",
    title: "Private contact export",
    type: "Note",
    status: "restricted",
    score: 41,
    date: "11 Oct 2026",
    size: "82 KB",
    source: "Unverified third party",
    license: "Restricted / consent missing",
    tags: ["contacts", "privacy", "hold"],
    custody: ["Imported by Arun Patel · 11 Oct", "Consent review required · 11 Oct"],
    summary: "Contains personal contact details unrelated to the public-interest question. Keep quarantined.",
  },
  {
    id: "ev-005",
    title: "Harbor office exterior — 2026-10-08",
    type: "Image",
    status: "verified",
    score: 91,
    date: "08 Oct 2026",
    size: "7.1 MB",
    source: "Reporter field photo",
    license: "Reporter-owned image",
    tags: ["harbor", "location", "field"],
    custody: ["Captured by Sam Okafor · 08 Oct", "EXIF preserved · 08 Oct"],
    summary: "Geotag places the office within 150m of the registered address for a Northstar supplier.",
  },
];

export const insights: Insight[] = [
  {
    id: "in-001",
    title: "Two vendors share a director",
    detail: "Northstar Marine and Harbor Civic appear to share a director across 6 award records.",
    confidence: 94,
    tone: "cyan",
    signal: "ENTITY CLUSTER",
    evidenceIds: ["ev-001", "ev-005"],
  },
  {
    id: "in-002",
    title: "Payment cadence breaks pattern",
    detail: "Three transfers land 48–72 hours before procurement milestones in the ledger.",
    confidence: 81,
    tone: "violet",
    signal: "TEMPORAL ANOMALY",
    evidenceIds: ["ev-001", "ev-002"],
  },
  {
    id: "in-003",
    title: "Source consent needs review",
    detail: "The private contact export contains personal data that is not necessary for this case.",
    confidence: 99,
    tone: "red",
    signal: "ETHICAL HOLD",
    evidenceIds: ["ev-004"],
  },
];

export const nodes: EntityNode[] = [
  { id: "n1", label: "Northstar", kind: "organization", x: 50, y: 43, color: "#35E0D0" },
  { id: "n2", label: "Harbor Civic", kind: "organization", x: 23, y: 25, color: "#A78BFA" },
  { id: "n3", label: "A. Mercer", kind: "person", x: 76, y: 25, color: "#FBBF24" },
  { id: "n4", label: "Port Authority", kind: "organization", x: 22, y: 72, color: "#35E0D0" },
  { id: "n5", label: "Harbor Office", kind: "location", x: 78, y: 71, color: "#F472B6" },
];

export const teamTasks: TeamTask[] = [
  { id: "t1", title: "Verify director overlap", owner: "Maya", progress: 0.82, status: "In review" },
  { id: "t2", title: "Request tender metadata", owner: "Arun", progress: 0.45, status: "Active" },
  { id: "t3", title: "Draft source note", owner: "Sam", progress: 0.18, status: "Queued" },
];

export const auditEvents: AuditEvent[] = [
  { id: "a1", actor: "Maya Chen", action: "reviewed tender ledger", timestamp: "2m ago", tone: "cyan" },
  { id: "a2", actor: "Arun Patel", action: "added a provenance note", timestamp: "28m ago", tone: "violet" },
  { id: "a3", actor: "Sam Okafor", action: "flagged a consent issue", timestamp: "1h ago", tone: "amber" },
];

export const copilotPrompts = [
  "Summarize the strongest verified signal",
  "What needs human review before publication?",
  "Find connections to Harbor Civic",
];
