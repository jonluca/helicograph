import { PrismaClient } from "@prisma/client";
import { env } from "~/env.mjs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

// const toExclude = ["BEGIN", "COMMIT", "ROLLBACK", "SET", "SHOW", "DEALLOCATE ALL"];

// (prisma.$on as any)("query", (e: Prisma.QueryEvent) => {
//   if (toExclude.includes(e.query)) {
//     return;
//   }
//   let query = e.query;
//   const params = JSON.parse(e.params);
//   // Replace $X variables with params in query so it's possible to copy/paste and optimize
//   for (let i = 0; i < params.length; i++) {
//     // Negative lookahead for no more numbers, ie. replace $1 in '$1' but not '$11'
//     const re = new RegExp("\\$" + ((i as number) + 1) + "(?!\\d)", "g");
//     // If string, will quote - if bool or numeric, will not - does the job here
//     if (typeof params[i] === "string") {
//       params[i] = "'" + params[i].replace("'", "\\'") + "'";
//     }
//     //params[i] = JSON.stringify(params[i])
//     query = query.replace(re, params[i]);
//   }
//   query = query.trim();
//   console.log(`\nprisma:\n${chalk.blueBright(query)}\n`);
// });
// prisma.$use(async (params, next) => {
//   const before = performance.now();
//   const result = await next(params);
//   const duration = performance.now() - before;
//   // log more info about where the query possibly originated from
//   console.log(`Query ${params.model}.${params.action} took ${duration}ms`);
//   return result;
// });

export type PrismaClientType = typeof prisma;

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
