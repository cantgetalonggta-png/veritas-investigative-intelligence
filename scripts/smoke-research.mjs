import { searchPublicResearch, getResearchConnectorCatalog } from "../server/research/public-research.ts";
const cat = getResearchConnectorCatalog();
console.log("connectors", cat.length, cat.map(c=>c.id).join(","));
const r = await searchPublicResearch("Microsoft");
console.log("results", r.results.length, "sources", r.sources.join("|"));
console.log("bySource", JSON.stringify(r.results.reduce((a,x)=>{a[x.source]=(a[x.source]||0)+1;return a;},{})));
console.log("warnings", r.warnings.slice(0,8));
console.log("sample", JSON.stringify(r.results.slice(0,8).map(x=>({s:x.source,t:x.title.slice(0,55),c:x.confidence}))));
try { await searchPublicResearch("reverse phone lookup 555"); console.log("NOT BLOCKED"); } catch(e){ console.log("BLOCKED_OK", String(e.message).slice(0,140)); }
const b = await searchPublicResearch("411 business directory Microsoft");
console.log("biz mode", b.mode, "results", b.results.length);
