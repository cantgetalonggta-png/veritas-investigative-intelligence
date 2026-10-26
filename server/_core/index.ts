import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { createCorsMiddleware } from "./cors";
import { clearLegacySessionCookie } from "./cookies";
import { getResearchConnectorCatalog, searchPublicResearch } from "../research/public-research";
import { searchHistoricalIndexes } from "../research/historical-indexes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

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
      const data = await searchPublicResearch(q);
      res.json({ ok: true, data });
    } catch (e: any) {
      res.status(400).json({ ok: false, error: String(e?.message || e) });
    }
  });

  app.get("/api/research/historical", async (req, res) => {
    try {
      const domain = String(req.query.domain || "").trim();
      if (domain.length < 3) return res.status(400).json({ ok: false, error: "domain required" });
      const data = await searchHistoricalIndexes(domain);
      res.json({ ok: true, data });
    } catch (e: any) {
      res.status(400).json({ ok: false, error: String(e?.message || e) });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  // Production SPA (public/)
  const publicDir = path.resolve(process.cwd(), "public");
  app.use(express.static(publicDir));
  app.get(/^(?!\/api).*/, (req, res, next) => {
    res.sendFile(path.join(publicDir, "index.html"), (err) => {
      if (err) next();
    });
  });

  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, () => {
    console.log(`[api] Veritas listening on :${port}`);
  });
}

startServer().catch((err) => {
  console.error("[api] server failed to start", err);
  process.exit(1);
});
