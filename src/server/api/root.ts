import { createTRPCRouter } from "~/server/api/trpc";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { krollRouter } from "./routers/kroll";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  krollRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
