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
  return api.krollRouter.getAllCases.useInfiniteQuery({}, modelListQueryOpts);
};

export const useClaimsList = () => {
  const params = useModelParams();
  const caseId = useApp((c) => c.caseId);
  const search = useApp((c) => c.search);

  return api.krollRouter.getAllClaims.useInfiniteQuery({ ...params, caseId: caseId!, search }, modelListQueryOpts);
};
