import {
  getSessionCookieName,
  getSessionCookieOptions,
} from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { searchPublicResearch } from "./research/public-research";
import { getResearchConnectorCatalog } from "./research/public-research";
import { searchHistoricalIndexes } from "./research/historical-indexes";
import { buildSafeSearchTemplates } from "./research/query-safety";
import {
  SEARCH_ENGINES,
  SEARCH_ENGINES_COUNT,
  SEARCH_ENGINE_POLICY,
  developAllSearchTerms,
  enginesByType,
  activeEngines,
} from "../shared/search-engines-catalog";
import { z } from "zod";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(getSessionCookieName(ctx.req), {
        ...cookieOptions,
        maxAge: -1,
      });
      return {
        success: true,
      } as const;
    }),
  }),

  research: router({
    capabilities: publicProcedure.query(() => getResearchConnectorCatalog()),
    templates: publicProcedure
      .input(z.object({ subject: z.string().trim().min(2).max(120), domains: z.array(z.string().trim().min(1).max(120)).max(3).default([]) }))
      .query(({ input }) => buildSafeSearchTemplates(input.subject, input.domains)),
    historical: publicProcedure
      .input(z.object({ domain: z.string().trim().min(3).max(120) }))
      .query(({ input }) => searchHistoricalIndexes(input.domain)),
    search: publicProcedure
      .input(z.object({ query: z.string().trim().min(2).max(160) }))
      .query(({ input }) => searchPublicResearch(input.query)),
    engines: publicProcedure
      .input(
        z
          .object({
            type: z.string().trim().min(1).max(64).optional(),
            activeOnly: z.boolean().optional(),
          })
          .optional()
      )
      .query(({ input }) => {
        let list = SEARCH_ENGINES;
        if (input?.activeOnly) list = activeEngines();
        if (input?.type) list = enginesByType(input.type as never);
        return {
          count: list.length,
          totalCatalog: SEARCH_ENGINES_COUNT,
          policy: SEARCH_ENGINE_POLICY,
          engines: list,
        };
      }),
    developTerms: publicProcedure
      .input(
        z.object({
          subject: z.string().trim().min(2).max(120),
          org: z.string().trim().max(120).optional(),
          alias: z.string().trim().max(120).optional(),
          domain: z.string().trim().max(120).optional(),
          jurisdiction: z.string().trim().max(120).optional(),
          ticker: z.string().trim().max(16).optional(),
          year: z.string().trim().max(8).optional(),
          keyword: z.string().trim().max(80).optional(),
          type: z.string().trim().max(64).optional(),
          limit: z.number().int().min(1).max(300).optional(),
        })
      )
      .query(({ input }) => {
        const plan = developAllSearchTerms({
          subject: input.subject,
          org: input.org,
          alias: input.alias,
          domain: input.domain,
          jurisdiction: input.jurisdiction,
          ticker: input.ticker,
          year: input.year,
          keyword: input.keyword,
        });
        let filtered = plan;
        if (input.type) filtered = plan.filter((p) => p.type === input.type);
        const limit = input.limit ?? filtered.length;
        return {
          subject: input.subject,
          totalEngines: filtered.length,
          totalTerms: filtered.reduce((n, p) => n + p.terms.length, 0),
          policy: SEARCH_ENGINE_POLICY,
          plans: filtered.slice(0, limit),
        };
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
