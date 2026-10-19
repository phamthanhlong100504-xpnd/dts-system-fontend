"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, RefreshCcw } from "lucide-react";
import { ResultAnalyticsSummary } from "./result-analytics-summary";
import type { ResultAnalyticsPeriod, ResultAnalyticsRecentItem, ResultAnalyticsTrendPoint } from "../result-analytics-types";
import { useResultAnalytics } from "../use-result-analytics";
import { useRecentOfficialTitles } from "../use-recent-official-titles";

const nf = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
const fmt = (n: number) => nf.format(n);
const uuid = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const practiceRoute = new RegExp(`^/practice/result/(${uuid})$`);
const examRoute = new RegExp(`^/examination/result/(${uuid})$`);

function safeResultPath(item: ResultAnalyticsRecentItem): string | null {
  if (!item.resultAvailable || !item.sourceResult) return null;
  const { sourceType, sourceId, resultPath } = item.sourceResult;
  if (sourceType === "PRACTICE_SESSION" && practiceRoute.test(resultPath) && resultPath === `/practice/result/${sourceId}`) return resultPath;
  if (sourceType === "EXAM_SESSION" && examRoute.test(resultPath) && resultPath === `/examination/result/${sourceId}`) return resultPath;
  return null;
}

function formatDateKey(date: string) {
  const parts = date.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
}

function dateTime(value: string) {
  const time = new Date(value);
  return Number.isNaN(time.getTime())
    ? "—"
    : new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(time);
}

export function ResultAnalyticsContent({
  licenseClass,
  onOpenHistory,
}: {
  licenseClass: string;
  onOpenHistory: () => void;
}) {
  const router = useRouter();
  const [period, setPeriod] = useState<ResultAnalyticsPeriod>("30D");
  const { data, isLoading, isError, isFetching, refetch } = useResultAnalytics(licenseClass, period);

  const recentTitles = useRecentOfficialTitles(data?.recentResults ?? [], licenseClass);

  if (isLoading) {
    return (
      <div aria-label="Đang tải thống kê" className="font-dts mx-auto w-full max-w-[1320px] px-6 pt-8">
        <div className="h-24 animate-pulse rounded-2xl bg-white" />
        <div className="mt-[1cm] h-64 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="font-dts mx-auto w-full max-w-[1320px] px-6 pt-8">
        <div className="rounded-2xl border border-red-200 bg-white p-12 text-center text-[15.5px] text-[#0b1427]">
          <AlertCircle className="mx-auto mb-4 text-red-500" />
          <b>Không tải được thống kê</b>
          <div>
            <button type="button" onClick={() => void refetch()} className="mt-4 rounded-lg bg-[#eef2ff] px-4 py-2 font-semibold text-[#0758d9]">
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pending = data.dataStatus === "SOURCE_POLICY_PENDING";

  return (
    <div className="font-dts mx-auto w-full max-w-[1320px] px-6 pb-10 pt-7 text-[#0b1427]">
      <ResultAnalyticsSummary data={data} period={period} onPeriodChange={setPeriod} />

      <section className="mt-[1cm] rounded-2xl border border-[#dce2ee] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold text-[#0b1427]">Xu hướng kết quả</h2>
            <p className="mt-1 text-[15.5px] font-medium text-[#344054]">Điểm trung bình theo ngày trong khoảng thời gian đã chọn.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[14.5px] font-medium text-[#344054]">● Điểm trung bình ngày</span>
            <button
              type="button"
              disabled={isFetching}
              onClick={() => void refetch()}
              className="rounded-lg border border-[#d8e0f1] px-3 py-2 text-[14.5px] font-semibold text-[#0758d9] disabled:opacity-50"
            >
              <RefreshCcw className="mr-1 inline size-4" />
              Cập nhật
            </button>
          </div>
        </div>
        {pending ? (
          <div role="status" className="flex h-56 items-center justify-center text-[14.5px] font-medium text-[#344054]">
            Chưa có thang điểm chuẩn hóa để vẽ xu hướng.
          </div>
        ) : (
          <TrendChart points={data.scoreTrend} maxScore={data.summary.maxScore} />
        )}
        {data.scoreTrendTruncated && (
          <p className="mt-3 text-[14.5px] font-medium text-[#344054]">
            Biểu đồ giới hạn {data.scoreTrendLimit} ngày có dữ liệu gần nhất trên tổng {data.scoreTrendTotalDays} ngày.
          </p>
        )}
      </section>

      <section className="mt-[1cm] overflow-hidden rounded-2xl border border-[#dce2ee] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5">
          <div>
            <h2 className="text-[18px] font-bold text-[#0b1427]">Bài làm gần đây</h2>
            <p className="mt-1 text-[15.5px] font-medium text-[#344054]">Các kết quả mới nhất trong khoảng thời gian đã chọn.</p>
          </div>
          <button type="button" onClick={onOpenHistory} className="inline-flex items-center gap-2 text-[14.5px] font-semibold text-[#0758d9]">
            Xem toàn bộ lịch sử <ArrowRight className="size-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[730px]">
            <div className="grid min-h-[50px] grid-cols-[minmax(0,1.8fr)_0.8fr_0.8fr_1fr_1fr] items-center bg-[#edf1ff] px-4 text-center text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#273449]">
              <span>BÀI THI</span>
              <span>KẾT QUẢ</span>
              <span>ĐIỂM</span>
              <span>NGÀY LÀM</span>
              <span>THAO TÁC</span>
            </div>
            {data.recentResults.length === 0 ? (
              <div className="flex min-h-32 items-center justify-center text-[15.5px] font-medium text-[#344054]">Chưa có bài thi trong khoảng thời gian này.</div>
            ) : (
              data.recentResults.slice(0, 5).map((item) => {
                const path = safeResultPath(item);
                return (
                  <div key={item.resultId} className="grid min-h-[68px] grid-cols-[minmax(0,1.8fr)_0.8fr_0.8fr_1fr_1fr] items-center border-t border-[#e8ecf3] px-4 text-[15.5px] font-medium text-[#172335]">
                    <div className="min-w-0 break-words pr-3 font-semibold text-[#172335]">{item.title?.trim() || recentTitles[item.resultId] || "Chưa có tên bài thi"}</div>
                    <div className="text-center">
                      <span className={item.result === "PASSED" ? "rounded-full bg-[#e8fbf1] px-3 py-1.5 text-[14.5px] font-semibold text-[#087b4b]" : "rounded-full bg-[#fff0ee] px-3 py-1.5 text-[14.5px] font-semibold text-[#b42318]"}>
                        {item.result === "PASSED" ? "Đạt" : "Chưa đạt"}
                      </span>
                    </div>
                    <div className="text-center font-semibold text-[#172335]">
                      {item.score == null || item.maxScore == null ? <span title="Chưa có thang chuẩn hóa">—</span> : `${fmt(item.score)} / ${fmt(item.maxScore)}`}
                    </div>
                    <div className="text-center text-[15.5px] text-[#2b3749]">{dateTime(item.completedAt)}</div>
                    <div className="text-center">
                      <button
                        type="button"
                        disabled={!path}
                        onClick={() => {
                          if (path) router.push(path);
                        }}
                        title={!path ? "Kết quả chưa sẵn sàng" : undefined}
                        className="inline-flex items-center gap-1 text-[14.5px] font-semibold text-[#0758d9] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Xem kết quả <ArrowRight className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function TrendChart({ points, maxScore }: { points: ResultAnalyticsTrendPoint[]; maxScore: number | null }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const valid = points.filter((point): point is ResultAnalyticsTrendPoint & { score: number } => point.score != null && Number.isFinite(point.score));

  if (!valid.length || maxScore == null || maxScore <= 0) {
    return <div className="flex h-60 items-center justify-center text-[14.5px] font-medium text-[#2b3749]">Chưa có dữ liệu điểm trung bình ngày.</div>;
  }

  const width = Math.max(980, valid.length * 72 + 80);
  const height = 300;
  const left = 48;
  const right = 32;
  const top = 42;
  const bottom = 49;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  const baseline = height - bottom;
  const samples = valid.map((point, index) => ({
    ...point,
    x: left + (valid.length === 1 ? innerW / 2 : (index * innerW) / (valid.length - 1)),
    y: top + (1 - Math.max(0, Math.min(1, point.score / maxScore))) * innerH,
  }));
  const line = samples.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div className="mt-5 overflow-x-auto pb-2">
      <svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: `${width}px` }} role="img" aria-label="Xu hướng điểm trung bình ngày" className="block h-auto w-full">
        {Array.from({ length: 6 }, (_, i) => i).map((i) => {
          const v = (maxScore * i) / 5;
          const y = baseline - (innerH * i) / 5;
          return (
            <g key={i}>
              <line x1={left} x2={width - right} y1={y} y2={y} stroke="#e5eaf2" strokeDasharray="3 6" />
              <text x={left - 11} y={y + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#364054">
                {fmt(v)}
              </text>
            </g>
          );
        })}

        {samples.map((p, i) => (
          <g key={`guide-${p.date}-${i}`}>
            <line x1={p.x} x2={p.x} y1={p.y} y2={baseline} stroke="#bac9e2" strokeWidth="1" strokeDasharray="4 5" />
            <text x={p.x} y={baseline + 25} textAnchor="middle" fontSize="11" fontWeight="600" fill="#263348">
              {formatDateKey(p.date)}
            </text>
          </g>
        ))}

        <path d={line} stroke="#246bfd" strokeWidth="2.8" fill="none" strokeLinejoin="round" strokeLinecap="round" />

        {samples.map((p, i) => {
          const tooltipX = Math.max(10, Math.min(width - 214, p.x - 96));
          const tooltipY = Math.max(4, p.y - 44);
          return (
            <g
              key={`dot-${p.date}-${i}`}
              tabIndex={0}
              role="button"
              aria-label={`${p.date}: trung bình ${fmt(p.score)} điểm, ${p.attempts} lượt thi`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
            >
              <circle cx={p.x} cy={p.y} r="11" fill="transparent" />
              <circle cx={p.x} cy={p.y} r="5.5" fill="white" stroke="#246bfd" strokeWidth="2.6" />
              <title>{`Điểm trung bình ngày ${p.date}: ${fmt(p.score)} / ${fmt(maxScore)} điểm · ${p.attempts} lượt thi`}</title>
              {hovered === i && (
                <g>
                  <rect x={tooltipX} y={tooltipY} width="194" height="32" rx="8" fill="#ffffff" stroke="#d7dfef" />
                  <text x={tooltipX + 97} y={tooltipY + 20} textAnchor="middle" fill="#172133" fontSize="11" fontWeight="600">
                    {`${fmt(p.score)} điểm · ${p.attempts} lượt thi`}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
