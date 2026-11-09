"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  Trophy,
} from "lucide-react";
import type {
  CombinedAnalytics,
  PerformancePeriod,
} from "../performance-contract";
import { resultReferencePath } from "../performance-contract";
import {
  performanceSource,
  type PerformanceScope,
} from "../performance-source";
import { usePerformanceRead } from "../use-performance";
import {
  dateTime,
  MetricCard,
  number,
  Outcome,
  ReadState,
  Retry,
  styles,
  SyncNotice,
} from "./performance-ui";
export function CombinedAnalyticsContent({
  scope,
}: {
  scope: PerformanceScope;
}) {
  const [period, setPeriod] = useState<PerformancePeriod>("30D");
  const q = usePerformanceRead(scope, "analytics", [period], (signal) =>
    performanceSource.analytics(scope, period, {}, signal),
  );
  const data = q.data;
  return (
    <div className={styles.container}>
      <div className={styles.headingRow}>
        <div>
          <h1 className={styles.heading}>Kết quả &amp; Thống kê</h1>
          <p className={styles.description}>
            Phân tích kết quả lý thuyết và mô phỏng trong hạng{" "}
            <strong>{scope.licenseClass}</strong>.
          </p>
        </div>
        <div
          className={styles.periods}
          role="group"
          aria-label="Khoảng thời gian thống kê"
        >
          {(
            [
              ["7D", "7 ngày"],
              ["30D", "30 ngày"],
              ["ALL", "Tất cả thời gian"],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={period === value}
              onClick={() => setPeriod(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ReadState
        loading={q.isPending}
        error={q.isError}
        onRetry={() => void q.refetch()}
      />
      {data && (
        <>
          <SyncNotice data={data} />
          <div className={styles.cards}>
            <MetricCard
              label="Điểm trung bình"
              value={data.summary.averageScore}
              suffix="/ 100 điểm"
              icon={<ChartNoAxesColumnIncreasing aria-hidden="true" />}
            />
            <MetricCard
              label="Tỷ lệ đạt"
              value={data.summary.passRate}
              suffix="%"
              icon={<BadgeCheck aria-hidden="true" />}
            />
            <MetricCard
              label="EXP tích lũy trong kỳ"
              value={data.summary.totalExp}
              suffix="EXP"
              icon={<Trophy aria-hidden="true" />}
            />
            <MetricCard
              label="Bài đã làm"
              value={data.summary.attempts}
              suffix="lượt thi"
              icon={<ClipboardList aria-hidden="true" />}
            />
          </div>
          <section className={`${styles.panel} ${styles.pad}`}>
            <div className={styles.between}>
              <h2 className={styles.sectionTitle}>Xu hướng kết quả</h2>
              <Retry onClick={() => void q.refetch()} busy={q.isFetching} />
            </div>
            <p className={styles.sectionDescription}>
              Điểm trung bình chuẩn hóa trên thang 100 theo ngày trong khoảng
              thời gian đã chọn.
            </p>
            <CombinedTrend data={data} />
            {data.scoreTrendTruncated && (
              <p className={styles.chapterMeta}>
                Biểu đồ giới hạn {number(data.scoreTrendLimit)} ngày có dữ liệu
                gần nhất trên tổng {number(data.scoreTrendTotalDays)} ngày.
              </p>
            )}
          </section>
          <section className={styles.panel}>
            <div className={`${styles.pad} ${styles.between}`}>
              <div>
                <h2 className={styles.sectionTitle}>Bài làm gần đây</h2>
                <p className={styles.sectionDescription}>
                  Các kết quả mới nhất của hai nội dung, hiển thị theo điểm gốc.
                </p>
              </div>
              <Link
                className={styles.textLink}
                href="/practice/history"
                prefetch={false}
              >
                Xem toàn bộ lịch sử →
              </Link>
            </div>
            <div className={styles.scroll}>
              <table className={`${styles.table} ${styles.recentResultsTable}`}>
                <thead>
                  <tr>
                    <th>Bài thi</th>
                    <th>Kết quả</th>
                    <th>Điểm</th>
                    <th>Ngày làm</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentResults.slice(0, 5).map((item) => {
                    const path = resultReferencePath(
                      item.sourceResult,
                      item.resultAvailable,
                      scope.licenseClass,
                    );
                    return (
                      <tr key={`${item.sourceType}:${item.sourceId}`}>
                        <td>
                          <span className={styles.recentResultTitle}>{item.displayTitle}</span>
                          <span className={styles.moduleTag}>
                            {item.module === "SIMULATION"
                              ? "Mô phỏng tình huống"
                              : "Lý thuyết sát hạch"}
                          </span>
                        </td>
                        <td>
                          <Outcome value={item.result} />
                        </td>
                        <td>
                          {number(item.sourceScore)} /{" "}
                          {number(item.sourceMaxScore)}
                        </td>
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
            {!data.recentResults.length && (
              <div className={styles.empty}>
                {data.partial
                  ? "Đang đồng bộ các bài thi đã hoàn thành…"
                  : "Chưa có bài thi trong khoảng thời gian này."}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
function CombinedTrend({ data }: { data: CombinedAnalytics }) {
  const points = data.scoreTrend.filter(
    (p): p is typeof p & { score: number } => p.score !== null,
  );
  if (!points.length)
    return (
      <div className={styles.empty}>
        {data.partial
          ? "Điểm trung bình đang được đồng bộ."
          : "Chưa có dữ liệu điểm trung bình ngày."}
      </div>
    );
  const width = Math.max(980, points.length * 72 + 80),
    height = 300,
    left = 48,
    bottom = 250,
    innerW = width - 80;
  const plotted = points.map((p, i) => ({
    ...p,
    x:
      left +
      (points.length === 1 ? innerW / 2 : (innerW * i) / (points.length - 1)),
    y: 42 + (1 - p.score / 100) * 208,
  }));
  return (
    <div className={styles.chart}>
      <svg
        role="img"
        aria-label="Xu hướng điểm trung bình chuẩn hóa trên thang 100"
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: width }}
      >
        {[0, 20, 40, 60, 80, 100].map((v) => {
          const y = 42 + (1 - v / 100) * 208;
          return (
            <g key={v}>
              <line
                x1={left}
                x2={width - 32}
                y1={y}
                y2={y}
                stroke="#e5eaf2"
                strokeDasharray="3 6"
              />
              <text
                x={left - 12}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#364054"
              >
                {v}
              </text>
            </g>
          );
        })}
        <path
          d={plotted.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ")}
          stroke="#246bfd"
          strokeWidth="2.8"
          fill="none"
          strokeLinejoin="round"
        />
        {plotted.map((p) => (
          <g key={p.date}>
            <line
              x1={p.x}
              x2={p.x}
              y1={p.y}
              y2={bottom}
              stroke="#bac9e2"
              strokeDasharray="4 5"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r="5.5"
              fill="white"
              stroke="#246bfd"
              strokeWidth="2.6"
              tabIndex={0}
              aria-label={`${p.date}: ${number(p.score)} / 100, ${p.attempts} lượt thi`}
            >
              <title>{`${p.date}: ${number(p.score)} / 100 điểm · ${p.attempts} lượt thi`}</title>
            </circle>
            <text
              x={p.x}
              y={bottom + 25}
              textAnchor="middle"
              fontSize="11"
              fill="#263348"
            >
              {p.date.split("-").slice(1).reverse().join("/")}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
