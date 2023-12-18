import React, { useMemo } from "react";
import { CaseList, ClaimList } from "~/components/CaseList";
import { useCaseList, useClaimsList } from "~/data/hooks/dataHooks";
import Typography from "@mui/material/Typography";
import { useApp } from "../../context";

export default function IndexPage() {
  const { data: _cases, fetchNextPage, isFetching } = useCaseList();
  const { data: _claims, ...rest } = useClaimsList();
  const caseId = useApp((c) => c.caseId);

  const cases = useMemo(() => {
    return _cases?.pages?.flat();
  }, [_cases]);

  const clamsData = useMemo(() => {
    return _claims?.pages?.flat();
  }, [_claims]);
  const selectedCase = React.useMemo(() => cases?.find((c) => c.id === caseId), [caseId, cases]);

  return (
    <div className={"flex flex-col w-full h-full gap-4"}>
      <div className="flex flex-col gap-4">
        <div className="mt-2 ml-2 -mb-2 ">
          <Typography className={"text-3xl"} variant={"h1"}>
            Helicograph{selectedCase ? `: ${selectedCase.name}` : ""}
          </Typography>
        </div>
      </div>
      <div className="col-span-6 max-h-screen md:px-2 no-scrollbar w-full h-full flex gap-4">
        <CaseList fetchNextPage={fetchNextPage} cases={cases} isFetching={isFetching} />
        {caseId && <ClaimList fetchNextPage={rest.fetchNextPage} claims={clamsData} isFetching={rest.isFetching} />}
      </div>
    </div>
  );
}
