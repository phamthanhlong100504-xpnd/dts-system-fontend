"use client";
import { useState } from "react";
import { Medal } from "lucide-react";
import type { PerformancePeriod } from "../performance-contract";
import {
  performanceSource,
  type PerformanceScope,
  type ReadPin,
} from "../performance-source";
import { usePerformanceRead } from "../use-performance";
import {
  number,
  Pagination,
  ReadState,
  Retry,
  styles,
  SyncNotice,
} from "./performance-ui";
export function CombinedLeaderboardContent({
  scope,
}: {
  scope: PerformanceScope;
}) {
  const [period, setPeriod] = useState<PerformancePeriod>("THIS_MONTH"),
    [page, setPage] = useState(0),
    [pin, setPin] = useState<ReadPin>({});
  const q = usePerformanceRead(
    scope,
    "ranking",
    [period, page, pin],
    (signal) => performanceSource.ranking(scope, period, page, 10, pin, signal),
  );
  const data = q.data;
  function refresh() {
    setPin({});
    setPage(0);
    void q.refetch();
  }
  return (
    <div className={styles.container}>
      <div className={styles.headingRow}>
        <div>
          <h1 className={styles.heading}>Bảng xếp hạng</h1>
          <p className={styles.description}>
            So sánh EXP học tập từ lý thuyết và mô phỏng trong hạng{" "}
            <strong>{scope.licenseClass}</strong>.
          </p>
        </div>
        <div
          className={styles.periods}
          role="group"
          aria-label="Chu kỳ bảng xếp hạng"
        >
          {(
            [
              ["THIS_WEEK", "Tuần này"],
              ["THIS_MONTH", "Tháng này"],
              ["ALL_TIME", "Tất cả thời gian"],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={period === value}
              onClick={() => {
                setPeriod(value);
                setPage(0);
                setPin({});
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ReadState loading={q.isPending} error={q.isError} onRetry={refresh} />
      {data && (
        <>
          <SyncNotice data={data} />
          <section className={`${styles.panel} ${styles.rankSummary}`}>
            <div className={styles.profile}>
              <span className={styles.avatar}>
                {(data.currentUser.displayName?.trim() || "Người học")
                  .split(/\s+/)
                  .map((x) => x[0])
                  .slice(-2)
                  .join("")
                  .toUpperCase()}
              </span>
              <div>
                <p className={styles.profileName}>
                  {data.currentUser.displayName?.trim() ||
                    (data.currentUser.profileStatus === "PENDING"
                      ? "Đang đồng bộ tên người học"
                      : "Người học")}
                </p>
                <p style={{ marginTop: 4 }}>Thứ hạng của bạn</p>
              </div>
            </div>
            <div>
              <p>THỨ HẠNG HIỆN TẠI</p>
              <strong style={{ color: "#0758d9" }}>
                {data.currentUser.rank === null
                  ? data.currentUser.rankingScore === null
                    ? "Đang đồng bộ"
                    : "Chưa có hạng"
                  : `#${data.currentUser.rank}`}{" "}
                {data.totalParticipants !== null && (
                  <small>/ {number(data.totalParticipants)} người học</small>
                )}
              </strong>
            </div>
            <div>
              <p>ĐIỂM XẾP HẠNG</p>
              <strong>{number(data.currentUser.rankingScore)} EXP</strong>
            </div>
          </section>
          <div className={styles.between} style={{ marginTop: "1cm" }}>
            <div>
              <h2 className={styles.sectionTitle}>Xếp hạng người học</h2>
              <p className={styles.sectionDescription}>
                Top người học theo điểm tích lũy.
              </p>
            </div>
            <Retry onClick={refresh} busy={q.isFetching} />
          </div>
          <section className={styles.panel}>
            <div className={styles.scroll}>
              <table
                className={`${styles.table} ${styles.rankTable}`}
                style={{ minWidth: 640 }}
              >
                <thead>
                  <tr>
                    <th>Hạng</th>
                    <th>Người học</th>
                    <th>Điểm xếp hạng</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr
                      key={item.userId}
                      aria-current={
                        item.userId === scope.userId ? "true" : undefined
                      }
                    >
                      <td>
                        {item.rank !== null && item.rank <= 3 ? (
                          <span className={styles.medal}>
                            <Medal aria-hidden="true" />
                          </span>
                        ) : (
                          number(item.rank)
                        )}
                      </td>
                      <td>
                        {item.userId === scope.userId
                          ? "Bạn"
                          : item.displayName?.trim() ||
                            (item.profileStatus === "PENDING"
                              ? "Đang đồng bộ tên"
                              : "Người học")}
                      </td>
                      <td>{number(item.rankingScore)} EXP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.items.length && (
              <div className={styles.empty}>
                {data.totalParticipants === null
                  ? "Đang đồng bộ bảng xếp hạng…"
                  : data.totalParticipants === 0
                    ? "Chưa có người học đạt điểm trong chu kỳ này."
                    : "Trang này không có dữ liệu; hãy quay về trang trước."}
              </div>
            )}
            <Pagination
              page={data.page}
              size={data.size}
              total={data.totalParticipants}
              pages={data.totalPages}
              count={data.items.length}
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
