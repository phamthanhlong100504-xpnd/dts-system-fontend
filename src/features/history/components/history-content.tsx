"use client";

import { useEffect, useMemo, useState } from "react";
import { getOfficialExamDetail } from "@/features/examination/official-exam-detail-service";
import { HistoryTable } from "./history-table";
import { HistoryToolbar } from "./history-toolbar";
import type {
  HistoryListItem, HistoryPeriodFilter, HistoryResultFilter, HistoryTypeFilter,
} from "../history-types";
import { useHistoryList } from "../use-history";

interface HistoryContentProps {
  licenseClass: string;
  onViewResult: (item: HistoryListItem) => void;
  resolvingId?: string | null;
}
const PAGE_SIZE = 7;

const SCREEN13_RUNTIME_FIXTURE = /^DTS\s+Screen13\s+runtime(?:\s+[a-z0-9_-]+)*$/i;

function isScreen13RuntimeFixture(item: HistoryListItem, titles: Record<string, string>): boolean {
  const title = (titles[item.targetId] ?? item.title ?? "").trim();
  return SCREEN13_RUNTIME_FIXTURE.test(title);
}

function periodRange(period: HistoryPeriodFilter): { from?: string; to?: string } {
  if (period === "ALL") return {};
  const days = period === "LAST_7_DAYS" ? 7 : period === "LAST_90_DAYS" ? 90 : 30;
  const now = Date.now();
  return {
    from: new Date(now - days * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date(now).toISOString(),
  };
}

export function HistoryContent({ licenseClass, onViewResult, resolvingId }: HistoryContentProps) {
  const [activityType, setActivityType] = useState<HistoryTypeFilter>("ALL");
  const [result, setResult] = useState<HistoryResultFilter>("ALL");
  const [period, setPeriod] = useState<HistoryPeriodFilter>("LAST_30_DAYS");
  const [range, setRange] = useState(() => periodRange("LAST_30_DAYS"));
  const [page, setPage] = useState(0);
  const [titleOverrides, setTitleOverrides] = useState<Record<string, string>>({});

  // Quay lại tab: cập nhật mốc thời gian, để thấy kết quả mới do Kafka đồng bộ.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && period !== "ALL") {
        setPage(0);
        setRange(periodRange(period));
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [period]);

  const { data, isLoading, isError, refetch } = useHistoryList({
    licenseClass, activityType, result, period,
    from: range.from, to: range.to, page, size: PAGE_SIZE,
  });

  const officialItemsMissingTitle = useMemo(() => {
    const items = data?.items ?? [];
    return Array.from(new Set(items
      .filter((item) => item.activityType === "OFFICIAL_EXAM"
        && (!item.title || item.title.trim().length === 0)
        && item.targetId
        && !titleOverrides[item.targetId])
      .map((item) => item.targetId)));
  }, [data?.items, titleOverrides]);

  useEffect(() => {
    if (officialItemsMissingTitle.length === 0) return;
    let cancelled = false;
    Promise.all(officialItemsMissingTitle.map(async (examId) => {
      try {
        const detail = await getOfficialExamDetail(examId, licenseClass);
        const title = detail.title?.trim();
        return title ? [examId, title] as const : null;
      } catch {
        return null;
      }
    })).then((entries) => {
      if (cancelled) return;
      setTitleOverrides((current) => {
        const updates = entries.filter((entry): entry is readonly [string, string] => Boolean(entry));
        if (updates.length === 0) return current;
        const next = { ...current };
        for (const [examId, title] of updates) next[examId] = title;
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [licenseClass, officialItemsMissingTitle]);

  const visibleItems = useMemo(
    () => (data?.items ?? []).filter((item) => !isScreen13RuntimeFixture(item, titleOverrides)),
    [data?.items, titleOverrides],
  );
  const displayTotal = data?.totalPages === 1 ? visibleItems.length : (data?.total ?? 0);

  function updatePeriod(next: HistoryPeriodFilter) {
    setPeriod(next);
    setRange(periodRange(next));
    setPage(0);
  }
  function refresh() {
    setPage(0);
    if (period === "ALL") {
      void refetch();
    } else {
      // Cặp from/to mới khiến query lấy cả kết quả được đồng bộ sau lần mở trang.
      setRange(periodRange(period));
    }
  }

  return (
    <div className="font-dts mx-auto w-full max-w-[1320px] px-6 pb-12 pt-8 text-[#0f172a]">
      <HistoryToolbar
        total={displayTotal}
        activityType={activityType}
        result={result}
        period={period}
        onActivityTypeChange={(value) => { setActivityType(value); setPage(0); }}
        onResultChange={(value) => { setResult(value); setPage(0); }}
        onPeriodChange={updatePeriod}
        onRefresh={refresh}
        isRefreshing={isLoading}
      />
      <HistoryTable
        items={visibleItems}
        page={data?.page ?? page}
        size={data?.size ?? PAGE_SIZE}
        total={displayTotal}
        totalPages={data?.totalPages ?? 0}
        isLoading={isLoading}
        isError={isError}
        resolvingId={resolvingId}
        titleOverrides={titleOverrides}
        onPageChange={(next) => {
          if (next < 0 || (data && next >= data.totalPages)) return;
          setPage(next);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onRetry={() => { void refetch(); }}
        onViewResult={onViewResult}
      />
    </div>
  );
}
