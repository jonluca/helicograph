/**
 * This is the client-side entrypoint for your tRPC API. It is used to create the `api` object which
 * contains the Next.js App-wrapper, as well as your type-safe React Query hooks.
 *
 * We also create a few inference helpers for input and output types.
 */
import { httpLink, loggerLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "~/server/api/root";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { transformer } from "~/utils/transformer";
import { env } from "~/env.mjs";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  } // browser should use relative url
  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  } // SSR should use vercel url
  return `http://localhost:${env.PORT ?? 3000}`; // dev SSR should use localhost
};
const link = httpLink({
  url: `${getBaseUrl()}/api/data`,
});
/** A set of type-safe react-query hooks for your tRPC API. */
export const api = createTRPCNext<AppRouter>({
  config(opts) {
    const { ctx } = opts;
    const queryCache = new QueryCache({
      onError: (err, query) => {
        if (err) {
          if (typeof err === "object" && "message" in err) {
            toast.error(`[${query["queryKey"][0]}]: ${err.message as string}`);
          } else if (typeof err === "string") {
            toast.error(`[${query["queryKey"][0]}]: ${err}`);
          }
        }
      },
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: true,
          refetchOnMount: true,
          refetchOnReconnect: true,
          staleTime: 1000 * 60 * 15, // 15 minutes
          refetchIntervalInBackground: true,
          cacheTime: 1000 * 60 * 60 * 24, // 24 hours
          networkMode: "always",
        },
        mutations: {
          networkMode: "always",
        },
      },
      queryCache,
    });

    return {
      /**
       * Transformer used for data de-serialization from the server.
       *
       * @see https://trpc.io/docs/data-transformers
       */
      transformer,

      /**
       * Links used to determine request flow from client to server.
       *
       * @see https://trpc.io/docs/links
       */
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" || (opts.direction === "down" && opts.result instanceof Error),
        }),
        link,
      ],
      queryClient,
      headers: () => {
        if (ctx?.req) {
          // on ssr, forward client's headers to the server
          return {
            ...ctx.req.headers,
            "x-ssr": "1",
          };
        }
        return {};
      },
    };
  },
  /**
   * Whether tRPC should await queries when server rendering pages.
   *
   * @see https://trpc.io/docs/nextjs#ssr-boolean-default-false
   */
  ssr: false,
});

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
