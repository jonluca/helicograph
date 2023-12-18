import { createNextApiHandler } from "@trpc/server/adapters/next";
import { env } from "~/env.mjs";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
// export API handler
const onError =
  env.NODE_ENV === "development"
    ? ({ path, error }: { path?: string; error: Error }) => {
        console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
      }
    : undefined;

export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError,
});
