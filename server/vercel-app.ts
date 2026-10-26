import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { createCorsMiddleware } from "./_core/cors";
import { clearLegacySessionCookie } from "./_core/cookies";
import { getResearchConnectorCatalog, searchPublicResearch } from "./research/public-research";
import { searchHistoricalIndexes } from "./research/historical-indexes";

export default async function createApp() {
  const app = express();
  app.use(createCorsMiddleware());
  app.use(clearLegacySessionCookie());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now(), service: "veritas-investigative-intelligence" });
  });
  app.get("/api/research/capabilities", (_req, res) => {
    res.json({ ok: true, connectors: getResearchConnectorCatalog() });
  });
  app.get("/api/research/search", async (req, res) => {
    try {
      const q = String(req.query.q || req.query.query || "").trim();
      if (q.length < 2) return res.status(400).json({ ok: false, error: "query too short" });
      res.json({ ok: true, data: await searchPublicResearch(q) });
    } catch (e: any) {
      res.status(400).json({ ok: false, error: String(e?.message || e) });
    }
  });
  app.get("/api/research/historical", async (req, res) => {
    try {
      const domain = String(req.query.domain || "").trim();
      if (domain.length < 3) return res.status(400).json({ ok: false, error: "domain required" });
      res.json({ ok: true, data: await searchHistoricalIndexes(domain) });
    } catch (e: any) {
      res.status(400).json({ ok: false, error: String(e?.message || e) });
    }
  });
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  return app;
}
