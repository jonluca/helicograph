import { z } from "zod";

export const createCollectionSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  isPublic: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});
export const addModelToCollectionSchema = z.object({
  collectionId: z.string(),
  rvcModelId: z.string(),
});
export const getUserCollectionsSchema = z.object({
  userId: z.string().optional(),
});
export const getCollectionSchema = z.object({
  collectionId: z.string().nullish().optional(),
});
export const allCasesInputQuery = z.object({
  limit: z.number().min(1).max(1000).default(1000).nullish(),
  cursor: z.string().nullish(),
  search: z.string().nullish(),
});
export const allClaimsInputQuery = z.object({
  limit: z.number().min(1).max(100).nullish(),
  cursor: z.string().nullish(),
  search: z.string().nullish(),
  caseId: z.string().nullish(),
});
