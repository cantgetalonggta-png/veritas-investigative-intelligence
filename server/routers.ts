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
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
