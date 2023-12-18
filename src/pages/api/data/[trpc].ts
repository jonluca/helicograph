import { createNextApiHandler } from "@trpc/server/adapters/next";
import { env } from "~/env.mjs";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import type { NodeHTTPHandlerOptions } from "@trpc/server/src/adapters/node-http/types";
// export API handler
const onError: NodeHTTPHandlerOptions<any, any, any>["onError"] =
  env.NODE_ENV === "development"
    ? ({ path, error }) => {
        console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
      }
    : undefined;

export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError,
});
