import { searchPublicResearch, getResearchConnectorCatalog } from "../server/research/public-research.ts";
const cat = getResearchConnectorCatalog();
console.log("connectors", cat.length, cat.map(c=>c.id).join(","));
const r = await searchPublicResearch("Microsoft");
console.log("results", r.results.length, "sources", r.sources.join("|"));
console.log("bySource", JSON.stringify(r.results.reduce((a,x)=>{a[x.source]=(a[x.source]||0)+1;return a;},{})));
const rev = await searchPublicResearch("reverse phone 2065550100");
console.log("reverse n", rev.results.length, "mode", rev.mode, "dir", rev.results.filter(x=>x.source==="Public Directory").length);
