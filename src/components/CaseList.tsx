import { Virtuoso } from "react-virtuoso";
import type { VirtuosoHandle } from "react-virtuoso";
import React, { Fragment, useMemo, useRef, useState } from "react";
import { isSafari, isIOS, isMobileSafari, isMobile } from "react-device-detect";
import type { Claim, RestructuringCase } from "@prisma/client";
import { useApp } from "../../context";
import type { RouterOutputs } from "~/utils/api";
import LinearProgress from "@mui/material/LinearProgress";
import Fuse from "fuse.js";

type CaseObject = RouterOutputs["krollRouter"]["getAllCases"][number];
const CaseItem = ({ caseEntity }: { caseEntity: CaseObject | null | undefined }) => {
  const setItem = useApp((c) => c.setCaseId);

  if (!caseEntity) {
    return null;
  }

  return (
    <div onClick={() => setItem(caseEntity?.id)} title={`${caseEntity.name} - (${caseEntity._count.claims})`}>
      {caseEntity.name} - ({caseEntity._count.claims.toLocaleString()})
    </div>
  );
};
export const renderCaseItem = (index: number, caseEntity: CaseObject | null | undefined) => {
  const key = caseEntity?.id || `shimmer-${index}`;
  return (
    <div
      className={
        "rounded-lg border p-2 border-gray-600 mb-2 cursor-pointer z-50 max-w-[400px] line-clamp-3 overflow-ellipsis bg-blue-100"
      }
      key={key}
    >
      <CaseItem caseEntity={caseEntity} />
    </div>
  );
};

export const renderClaimItem = (index: number, caseEntity: Claim | null | undefined) => {
  const key = caseEntity?.id || `shimmer-${index}`;

  return (
    <div className={"mb-2 cursor-pointer z-50 max-w-[700px] line-clamp-1 overflow-ellipsis"} key={key}>
      {caseEntity?.CreditorName} - ($
      {caseEntity?.ParsedClaimAmount?.toLocaleString(undefined, {
        currency: "USD",
      })}
      )
    </div>
  );
};

const THRESHHOLD_PIXELS_FETCH_MORE = 1000;
interface BaseTableProps<T> {
  loadMore: () => Promise<unknown>;
  data: undefined | null | T[];
  isFetching: boolean;
  renderItem: (index: number, item: T | null | undefined) => JSX.Element;
}
export const BaseTable = <T = RestructuringCase,>({ data, loadMore, isFetching, renderItem }: BaseTableProps<T>) => {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  //called on scroll and possibly on mount to fetch more data as the user scrolls and reaches bottom of table

  const fetchMoreOnBottomReached = React.useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        //once the user has scrolled within 300px of the bottom of the table, fetch more data if there is any
        if (scrollHeight - scrollTop - clientHeight < THRESHHOLD_PIXELS_FETCH_MORE && !isFetching) {
          loadMore();
        }
      }
    },
    [loadMore, isFetching],
  );

  //a check on mount and after a fetch to see if the table is already scrolled to the bottom and immediately needs to fetch more data
  React.useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

  const toRender = data || [];

  const fallback = isIOS || isSafari || isMobileSafari;

  const virtuosoRef = useRef<VirtuosoHandle>(null);

  return (
    <Fragment>
      <Virtuoso
        ref={virtuosoRef}
        overscan={isMobile ? 250 : 1000}
        suppressHydrationWarning
        className={["hide-scrollbar", fallback && "safari-render"].filter(Boolean).join(" ")}
        style={{
          height: "100%",
          width: "100%",
          overflowX: "visible",
        }}
        data={toRender}
        itemContent={renderItem}
        endReached={() => {
          loadMore();
        }}
        atBottomThreshold={THRESHHOLD_PIXELS_FETCH_MORE}
        atBottomStateChange={(atBottom) => {
          if (atBottom) {
            loadMore();
          }
        }}
      />
    </Fragment>
  );
};
export const CaseList = ({
  cases,
  fetchNextPage,
  isFetching,
}: {
  fetchNextPage: undefined | (() => Promise<unknown>);
  cases: undefined | null | CaseObject[];
  isFetching: boolean;
}) => {
  const loadMore = React.useCallback(async () => {
    if (fetchNextPage && !isFetching) {
      await fetchNextPage();
    }
  }, [fetchNextPage, isFetching]);
  const [search, setSearch] = useState("");

  const casesToRender = useMemo(() => {
    if (!search || !cases) {
      return cases;
    }
    const fuse = new Fuse(cases, { keys: ["name"] });
    return fuse.search(search).map((l) => l.item);
  }, [cases, search]);
  return (
    <div className={"w-full flex flex-col max-w-[400px] gap-2"}>
      <span className={"text-xl font-bold"}>Cases</span>
      <input
        className={"rounded-full border border-gray-600 p-2"}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        placeholder={"Search for cases"}
      />
      {isFetching && <LinearProgress />}
      <BaseTable<CaseObject>
        data={casesToRender}
        isFetching={isFetching}
        loadMore={loadMore}
        renderItem={renderCaseItem}
      />
    </div>
  );
};

export const ClaimList = ({
  claims,
  fetchNextPage,
  isFetching,
}: {
  fetchNextPage: undefined | (() => Promise<unknown>);
  claims: undefined | null | Claim[];
  isFetching: boolean;
}) => {
  const loadMore = React.useCallback(async () => {
    if (fetchNextPage && !isFetching) {
      await fetchNextPage();
    }
  }, [fetchNextPage, isFetching]);
  const setSearch = useApp((c) => c.setSearch);

  return (
    <div className={"w-full flex flex-col max-w-[700px] gap-2"}>
      <span className={"text-xl font-bold"}>Claims</span>
      <input
        className={"rounded-full border border-gray-600 p-2 mb-2"}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        placeholder={"Search for cases"}
      />
      {isFetching && <LinearProgress />}
      <BaseTable<Claim> data={claims} isFetching={isFetching} loadMore={loadMore} renderItem={renderClaimItem} />
    </div>
  );
};
