import { api } from "~/utils/api";
import { useApp } from "../../../context";

interface BaseEntity {
  id: string;
}
const modelListQueryOpts = {
  getNextPageParam: (lastPage: BaseEntity[]) => {
    return lastPage[lastPage.length - 1]?.id;
  },
};

const useModelParams = () => {
  const search = useApp((state) => state.search);
  return {
    search,
  } as const;
};
export const useCaseList = () => {
  const params = useModelParams();
  return api.krollRouter.getAllCases.useInfiniteQuery(params, modelListQueryOpts);
};

export const useClaimsList = () => {
  const params = useModelParams();
  const caseId = useApp((c) => c.caseId);

  return api.krollRouter.getAllClaims.useInfiniteQuery({ ...params, caseId: caseId! }, modelListQueryOpts);
};
