"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { resultReferencePath } from "../performance-contract";
import {
  performanceSource,
  type HistoryFilters,
  type PerformanceScope,
  type ReadPin,
} from "../performance-source";
import { usePerformanceRead } from "../use-performance";
import {
  dateTime,
  number,
  Outcome,
  Pagination,
  ReadState,
  Retry,
  styles,
  SyncNotice,
} from "./performance-ui";
type Period = "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS" | "ALL";
function range(period: Period) {
  if (period === "ALL") return {};
  const to = new Date(),
    days = period === "LAST_7_DAYS" ? 7 : period === "LAST_90_DAYS" ? 90 : 30;
  return {
    from: new Date(to.getTime() - days * 86400000).toISOString(),
    to: to.toISOString(),
  };
}
export function SimulationHistoryContent({
  scope,
}: {
  scope: PerformanceScope;
}) {
  const [activity, setActivity] = useState<
      "ALL" | NonNullable<HistoryFilters["activityType"]>
    >("ALL"),
    [result, setResult] = useState<
      "ALL" | NonNullable<HistoryFilters["result"]>
    >("ALL"),
    [period, setPeriod] = useState<Period>("LAST_30_DAYS"),
    [dates, setDates] = useState(() => range("LAST_30_DAYS")),
    [page, setPage] = useState(0),
    [pin, setPin] = useState<ReadPin>({});
  const filters: HistoryFilters = {
    activityType: activity === "ALL" ? undefined : activity,
    result: result === "ALL" ? undefined : result,
    ...dates,
    page,
    size: 7,
    ...pin,
  };
  const q = usePerformanceRead(scope, "history", [filters], (signal) =>
    performanceSource.history(scope, filters, signal),
  );
  const data = q.data;
  function reset() {
    setPage(0);
    setPin({});
  }
  function refresh() {
    reset();
    if (period === "ALL") void q.refetch();
    else setDates(range(period));
  }
  const duration =
    data?.content.some((i) => i.durationSeconds !== null) ?? false;
  return (
    <div className={styles.container}>
      <div className={styles.headingRow}>
        <div>
          <h1 className={styles.heading}>Lịch sử thi</h1>
          <p className={styles.description}>
            Xem lại kết quả các bài thi thử mô phỏng đã hoàn thành.
          </p>
        </div>
        <div className={styles.actions}>
          <span className={styles.pill}>
            Tổng cộng: <strong>{number(data?.totalElements)} lượt thi</strong>
          </span>
          <Retry onClick={refresh} busy={q.isFetching} />
        </div>
      </div>
      <section className={styles.panel}>
        <div className={styles.filters}>
          <label className={styles.field}>
            Loại bài
            <select
              aria-label="Loại bài"
              value={activity}
              onChange={(e) => {
                setActivity(e.target.value as typeof activity);
                reset();
              }}
            >
              <option value="ALL">Tất cả loại bài</option>
              <option value="SIM_PRESET_EXAM">Bộ đề có sẵn</option>
              <option value="SIM_RANDOM_EXAM">Thi thử ngẫu nhiên</option>
            </select>
          </label>
          <label className={styles.field}>
            Kết quả
            <select
              aria-label="Kết quả"
              value={result}
              onChange={(e) => {
                setResult(e.target.value as typeof result);
                reset();
              }}
            >
              <option value="ALL">Tất cả kết quả</option>
              <option value="PASSED">Đạt</option>
              <option value="FAILED">Chưa đạt</option>
            </select>
          </label>
          <label className={styles.field}>
            Thời gian
            <select
              aria-label="Thời gian"
              value={period}
              onChange={(e) => {
                const p = e.target.value as Period;
                setPeriod(p);
                setDates(range(p));
                reset();
              }}
            >
              <option value="LAST_7_DAYS">7 ngày gần đây</option>
              <option value="LAST_30_DAYS">30 ngày gần đây</option>
              <option value="LAST_90_DAYS">90 ngày gần đây</option>
              <option value="ALL">Tất cả thời gian</option>
            </select>
          </label>
        </div>
      </section>
      <ReadState loading={q.isPending} error={q.isError} onRetry={refresh} />
      {data && (
        <>
          <SyncNotice data={data} />
          <section className={styles.panel}>
            <div className={styles.scroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Bài thi</th>
                    <th>Loại</th>
                    <th>Kết quả</th>
                    <th>Điểm</th>
                    {duration && <th>Thời gian làm</th>}
                    <th>Ngày làm</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((item) => {
                    const path = resultReferencePath(
                      item.sourceResult,
                      item.resultAvailable,
                      scope.licenseClass,
                    );
                    return (
                      <tr key={item.sourceId}>
                        <td>{item.displayTitle}</td>
                        <td>
                          <span className={styles.pill}>
                            {item.activityType === "SIM_PRESET_EXAM"
                              ? "Bộ đề có sẵn"
                              : "Thi thử ngẫu nhiên"}
                          </span>
                        </td>
                        <td>
                          <Outcome value={item.result} />
                        </td>
                        <td>
                          {number(item.sourceScore)} /{" "}
                          {number(item.sourceMaxScore)}
                        </td>
                        {duration && (
                          <td>
                            {item.durationSeconds === null
                              ? "—"
                              : `${Math.floor(item.durationSeconds / 60)}:${String(item.durationSeconds % 60).padStart(2, "0")}`}
                          </td>
                        )}
                        <td className={styles.nowrap}>
                          {dateTime(item.completedAt)}
                        </td>
                        <td>
                          {path ? (
                            <Link href={path} prefetch={false}>
                              Xem kết quả
                              <ArrowRight aria-hidden="true" />
                            </Link>
                          ) : (
                            "Chưa khả dụng"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!data.content.length && (
              <div className={styles.empty}>
                <FileText aria-hidden="true" />
                {data.totalElements === null
                  ? "Đang đồng bộ lịch sử thi mô phỏng…"
                  : "Chưa có lượt thi nào phù hợp với bộ lọc đang chọn."}
              </div>
            )}
            <Pagination
              page={data.page}
              size={data.size}
              total={data.totalElements}
              pages={data.totalPages}
              count={data.content.length}
              onPage={(next) => {
                setPin(
                  data.sourceWatermark > 0 && data.syncStatus.complete
                    ? { watermark: data.sourceWatermark, asOf: data.asOf }
                    : {},
                );
                setPage(next);
              }}
            />
          </section>
        </>
      )}
    </div>
  );
}
