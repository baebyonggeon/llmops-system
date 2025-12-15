import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==========================================
  // PROJECT MANAGEMENT
  // ==========================================
  projects: router({
    list: publicProcedure
      .input(z.object({ custCd: z.string() }).optional())
      .query(async ({ input }) => {
        const { listProjects } = await import("../server/db");
        if (input?.custCd) {
          return await listProjects(input.custCd);
        }
        return [];
      }),
    
    getById: publicProcedure
      .input(z.object({ pjtId: z.number() }))
      .query(async ({ input }) => {
        const { getProjectById } = await import("../server/db");
        return await getProjectById(input.pjtId);
      }),
  }),

  // ==========================================
  // LLM / MODEL MANAGEMENT
  // ==========================================
  llms: router({
    list: publicProcedure.query(async () => {
      const { listLlms } = await import("../server/db");
      return await listLlms();
    }),
    
    getById: publicProcedure
      .input(z.object({ llmId: z.number() }))
      .query(async ({ input }) => {
        const { getLlmById } = await import("../server/db");
        return await getLlmById(input.llmId);
      }),
  }),

  // ==========================================
  // API MANAGEMENT
  // ==========================================
  apis: router({
    list: publicProcedure
      .input(z.object({ pjtId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        const { listApis } = await import("../server/db");
        return await listApis(input?.pjtId);
      }),
    
    getById: publicProcedure
      .input(z.object({ apiId: z.number() }))
      .query(async ({ input }) => {
        const { getApiById } = await import("../server/db");
        return await getApiById(input.apiId);
      }),
  }),

  // ==========================================
  // API KEY MANAGEMENT
  // ==========================================
  apiKeys: router({
    list: publicProcedure
      .input(z.object({
        apiId: z.number().optional(),
        pjtId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { listApiKeys } = await import("../server/db");
        return await listApiKeys(input?.apiId, input?.pjtId);
      }),
    
    getById: publicProcedure
      .input(z.object({ keyId: z.number() }))
      .query(async ({ input }) => {
        const { getApiKeyById } = await import("../server/db");
        return await getApiKeyById(input.keyId);
      }),
  }),

  // ==========================================
  // API USAGE & STATISTICS
  // ==========================================
  apiUsage: router({
    listByProject: publicProcedure
      .input(z.object({ pjtId: z.number() }))
      .query(async ({ input }) => {
        const { listApiUsageByProject } = await import("../server/db");
        return await listApiUsageByProject(input.pjtId);
      }),
    
    getByProjectAndApi: publicProcedure
      .input(z.object({
        pjtId: z.number(),
        apiId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getApiUsageByProjectAndApi } = await import("../server/db");
        return await getApiUsageByProjectAndApi(input.pjtId, input.apiId);
      }),
  }),

  // ==========================================
  // DASHBOARD
  // ==========================================
  dashboard: router({
    getStats: publicProcedure.query(async () => {
      // Mock dashboard statistics
      return {
        totalProjects: 5,
        totalApis: 12,
        totalApiKeys: 25,
        todayRequests: 1234,
        todaySuccessRate: 98.5,
        gpuUsage: 65,
        cpuUsage: 45,
        memoryUsage: 72,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
