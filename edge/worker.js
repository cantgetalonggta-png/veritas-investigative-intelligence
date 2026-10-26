/**
 * Veritas public research edge worker (Cloudflare Workers / any Fetch API runtime).
 * Keyless public sources only. Deploy: wrangler deploy (requires CF account).
 */
const UA = "Veritas Investigative Intelligence edge research@veritas.example";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const BLOCKED = [
  /password|api[_ -]?key|ssn\b|social security/i,
  /reverse\s*(?:phone|lookup)|phone\s*owner|skip\s*trace|unlisted\s*number/i,
];

async function fetchJson(url, init = {}) {
  const r = await fetch(url, { ...init, headers: { accept: "application/json", "user-agent": UA, ...(init.headers || {}) } });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

async function search(q) {
  if (q.length < 2) throw new Error("query too short");
  if (BLOCKED.some((p) => p.test(q))) throw new Error("Blocked: private reverse-phone / credential targeting");
  const results = [];
  const warnings = [];
  const settled = await Promise.allSettled([
    (async () => {
      const u = new URL("https://www.wikidata.org/w/api.php");
      u.searchParams.set("action", "wbsearchentities"); u.searchParams.set("search", q);
      u.searchParams.set("language", "en"); u.searchParams.set("format", "json"); u.searchParams.set("limit", "6");
      const j = await fetchJson(u.toString());
      return (j.search || []).map((item, i) => ({
        id: "wikidata-" + item.id, source: "Wikidata", title: item.label, summary: item.description || "",
        url: "https://www.wikidata.org/wiki/" + item.id, entityType: "unknown", confidence: Math.max(58, 94 - i * 7),
        provenance: "Wikidata edge", publicOnly: true,
      }));
    })(),
    (async () => {
      const u = new URL("https://api.gleif.org/api/v1/lei-records");
      u.searchParams.set("filter[entity.legalName]", q); u.searchParams.set("page[size]", "6");
      const j = await fetchJson(u.toString());
      return (j.data || []).map((item, i) => {
        const a = item.attributes || {}; const e = a.entity || {};
        const name = (e.legalName && e.legalName.name) || a.lei; const lei = a.lei || item.id;
        return { id: "gleif-" + lei, source: "GLEIF LEI", title: name, summary: "LEI " + lei,
          url: "https://search.gleif.org/#/record/" + encodeURIComponent(lei), entityType: "organization",
          confidence: Math.max(70, 95 - i * 4), provenance: "GLEIF edge", publicOnly: true };
      });
    })(),
    (async () => {
      const u = new URL("https://recherche-entreprises.api.gouv.fr/search");
      u.searchParams.set("q", q); u.searchParams.set("per_page", "5");
      const j = await fetchJson(u.toString());
      return (j.results || []).map((item, i) => ({
        id: "fr-" + (item.siren || i), source: "Business Registry", title: item.nom_complet || item.nom_raison_sociale,
        summary: "SIREN " + (item.siren || ""), url: item.siren ? "https://annuaire-entreprises.data.gouv.fr/entreprise/" + item.siren : u.toString(),
        entityType: "organization", confidence: Math.max(62, 90 - i * 5), provenance: "FR entreprises edge", publicOnly: true, jurisdiction: "FR",
      }));
    })(),
    (async () => {
      const j = await fetchJson("https://api.usaspending.gov/api/v2/autocomplete/recipient/", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ search_text: q, limit: 5 }),
      });
      return (j.results || []).map((item, i) => ({
        id: "usa-" + (item.recipient_name || i), source: "USAspending", title: item.recipient_name,
        summary: "Federal recipient", url: "https://www.usaspending.gov/search/?query=" + encodeURIComponent(item.recipient_name || q),
        entityType: "organization", confidence: Math.max(58, 88 - i * 5), provenance: "USAspending edge", publicOnly: true, jurisdiction: "US",
      }));
    })(),
  ]);
  settled.forEach((s, i) => {
    if (s.status === "fulfilled") results.push(...s.value);
    else warnings.push(["Wikidata", "GLEIF", "FR Registry", "USAspending"][i] + " unavailable");
  });
  const qq = encodeURIComponent(q);
  results.push(
    { id: "oc", source: "Business Registry", title: "OpenCorporates: " + q, summary: "Public registry handoff", url: "https://opencorporates.com/companies?q=" + qq, entityType: "organization", confidence: 65, provenance: "handoff", publicOnly: true },
    { id: "sam", source: "Business Registry", title: "SAM.gov: " + q, summary: "Federal entity handoff", url: "https://sam.gov/search/?index=ent&page=1&sfm%5BsimpleSearch%5D%5BkeywordEditorTextarea%5D=" + qq, entityType: "organization", confidence: 68, provenance: "handoff", publicOnly: true },
  );
  return { ok: true, data: { query: q, exactQuery: q, searchedAt: new Date().toISOString(), mode: "entity", sources: [...new Set(results.map((r) => r.source))], connectorStates: [], results, warnings } };
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/health" || url.pathname === "/health") {
        return new Response(JSON.stringify({ ok: true, service: "veritas-edge", timestamp: Date.now() }), { headers: CORS });
      }
      if (url.pathname === "/api/research/search" || url.pathname === "/search") {
        const q = (url.searchParams.get("q") || url.searchParams.get("query") || "").trim();
        const body = await search(q);
        return new Response(JSON.stringify(body), { headers: CORS });
      }
      if (url.pathname === "/api/research/capabilities") {
        return new Response(JSON.stringify({ ok: true, connectors: [
          { id: "wikidata", label: "Wikidata", status: "ok" },
          { id: "gleif", label: "GLEIF LEI", status: "ok" },
          { id: "business-registry", label: "Business Registry", status: "ok" },
          { id: "usaspending", label: "USAspending", status: "ok" },
        ] }), { headers: CORS });
      }
      return new Response(JSON.stringify({ ok: false, error: "not found" }), { status: 404, headers: CORS });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e.message || e) }), { status: 400, headers: CORS });
    }
  },
};
