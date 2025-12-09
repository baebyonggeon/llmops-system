import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // LLMOps Feature Routers
  models: router({
    list: publicProcedure.query(async () => {
      const { getModels } = await import("../server/db");
      return getModels();
    }),
    getById: publicProcedure.input((val: any) => ({ id: val.id as number })).query(async ({ input }) => {
      const { getModelById } = await import("../server/db");
      return getModelById(input.id);
    }),
  }),

  images: router({
    list: publicProcedure.query(async () => {
      const { getImages } = await import("../server/db");
      return getImages();
    }),
    getById: publicProcedure.input((val: any) => ({ id: val.id as number })).query(async ({ input }) => {
      const { getImageById } = await import("../server/db");
      return getImageById(input.id);
    }),
  }),

  projects: router({
    list: publicProcedure.query(async () => {
      const { getProjects } = await import("../server/db");
      return getProjects();
    }),
    getById: publicProcedure.input((val: any) => ({ id: val.id as number })).query(async ({ input }) => {
      const { getProjectById } = await import("../server/db");
      return getProjectById(input.id);
    }),
  }),

  deployments: router({
    list: publicProcedure.query(async () => {
      const { getDeployments } = await import("../server/db");
      return getDeployments();
    }),
    getById: publicProcedure.input((val: any) => ({ id: val.id as number })).query(async ({ input }) => {
      const { getDeploymentById } = await import("../server/db");
      return getDeploymentById(input.id);
    }),
  }),

  trainings: router({
    list: publicProcedure.query(async () => {
      const { getTrainings } = await import("../server/db");
      return getTrainings();
    }),
    getById: publicProcedure.input((val: any) => ({ id: val.id as number })).query(async ({ input }) => {
      const { getTrainingById } = await import("../server/db");
      return getTrainingById(input.id);
    }),
  }),

  apis: router({
    list: publicProcedure.query(async () => {
      const { getApisList } = await import("../server/db");
      return getApisList();
    }),
    getById: publicProcedure.input((val: any) => ({ id: val.id as number })).query(async ({ input }) => {
      const { getApiById } = await import("../server/db");
      return getApiById(input.id);
    }),
  }),

  apiKeys: router({
    list: publicProcedure.query(async () => {
      const { getApiKeysList } = await import("../server/db");
      return getApiKeysList();
    }),
    getById: publicProcedure.input((val: any) => ({ id: val.id as number })).query(async ({ input }) => {
      const { getApiKeyById } = await import("../server/db");
      return getApiKeyById(input.id);
    }),
  }),

  evaluations: router({
    list: publicProcedure.query(async () => {
      const { getEvaluationsList } = await import("../server/db");
      return getEvaluationsList();
    }),
    getById: publicProcedure.input((val: any) => ({ id: val.id as number })).query(async ({ input }) => {
      const { getEvaluationById } = await import("../server/db");
      return getEvaluationById(input.id);
    }),
  }),

  anomalyDetections: router({
    list: publicProcedure.query(async () => {
      const { getAnomalyDetectionsList } = await import("../server/db");
      return getAnomalyDetectionsList();
    }),
    getById: publicProcedure.input((val: any) => ({ id: val.id as number })).query(async ({ input }) => {
      const { getAnomalyDetectionById } = await import("../server/db");
      return getAnomalyDetectionById(input.id);
    }),
  }),

  resourceGroups: router({
    list: publicProcedure.query(async () => {
      const { getResourceGroupsList } = await import("../server/db");
      return getResourceGroupsList();
    }),
    getById: publicProcedure.input((val: any) => ({ id: val.id as number })).query(async ({ input }) => {
      const { getResourceGroupById } = await import("../server/db");
      return getResourceGroupById(input.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
