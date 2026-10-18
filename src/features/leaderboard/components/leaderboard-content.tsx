"use client";
import { useState } from "react";
import { LeaderboardSummary } from "./leaderboard-summary";
import { LeaderboardTable } from "./leaderboard-table";
import type { LeaderboardPeriod } from "../leaderboard-types";
import { useLeaderboardList } from "../use-leaderboard";
const PAGE_SIZE = 10;
export function LeaderboardContent({ licenseClass }: { licenseClass: string }) {
  const [period, setPeriod] = useState<LeaderboardPeriod>("MONTH");
  const [pageState, setPageState] = useState({ scope: licenseClass, page: 0 });
  const page = pageState.scope === licenseClass ? pageState.page : 0;
  const setPage = (nextPage: number) => setPageState({ scope: licenseClass, page: nextPage });
  const { data, isLoading, isError, isFetching, refetch } = useLeaderboardList({ licenseClass, period, page, size: PAGE_SIZE });
  const changePeriod = (value: LeaderboardPeriod) => { setPeriod(value); setPage(0); };
  return (
    <div className="font-dts mx-auto w-full max-w-[1320px] px-6 pb-10 pt-7 text-[#0b1427]">
      <LeaderboardSummary
        licenseClass={licenseClass}
        period={period}
        currentUser={data?.currentUser}
        totalParticipants={data?.totalParticipants}
        onPeriodChange={changePeriod}
      />
      <div className="mt-[1cm]">
        <div className="mb-[1cm] flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold text-[#0b1427]">Xếp hạng người học</h2>
            <p className="mt-1 text-[15px] font-normal text-[#3a4658]">Top người học theo điểm tích lũy</p>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="rounded-lg border border-[#d8e0f1] bg-white px-4 py-2 text-[14px] font-semibold text-[#0758d9] disabled:opacity-50"
          >
            Cập nhật
          </button>
        </div>
        <LeaderboardTable
          items={data?.items ?? []}
          page={data?.page ?? page}
          size={data?.size ?? PAGE_SIZE}
          totalParticipants={data?.totalParticipants}
          totalPages={data?.totalPages}
          isLoading={isLoading || (!data && isFetching)}
          isError={isError}
          onPageChange={(next) => {
            if (next < 0 || (data && next >= data.totalPages)) return;
            setPage(next);
          }}
          onRetry={() => void refetch()}
        />
      </div>
    </div>
  );
}
