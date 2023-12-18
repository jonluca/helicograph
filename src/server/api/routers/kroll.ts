import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { allCasesInputQuery, allClaimsInputQuery } from "~/server/api/schemas/kroll";

export const krollRouter = createTRPCRouter({
  getAllCases: publicProcedure.input(allCasesInputQuery).query(async (opts) => {
    const { ctx, input } = opts;
    const cursor = input.cursor ?? 0;
    const limit = input.limit ?? 1000;

    const cases = await ctx.prisma.restructuringCase.findMany({
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : undefined,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            claims: true,
          },
        },
      },
    });
    cases.sort((a, b) => {
      return b._count?.claims - a._count?.claims;
    });
    return cases;
  }),
  getAllClaims: publicProcedure.input(allClaimsInputQuery).query(async (opts) => {
    const { ctx, input } = opts;
    const cursor = input.cursor ?? 0;
    const limit = input.limit ?? 100;
    const search = input.search ?? "";
    if (!input.caseId) {
      return [];
    }
    return ctx.prisma.claim.findMany({
      where: {
        caseId: input.caseId,
        ...(search
          ? {
              OR: [
                {
                  CreditorName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  DebtorName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : undefined,
      take: limit,
      orderBy: {
        ParsedClaimAmount: "desc",
      },
    });
  }),
});
