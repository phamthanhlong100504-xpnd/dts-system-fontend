"use client";
import { BadgeCheck, ChartNoAxesColumnIncreasing, ClipboardList, Target } from "lucide-react";
import type { ReactNode } from "react";
import type { ResultAnalyticsData, ResultAnalyticsPeriod } from "../result-analytics-types";
import { cn } from "@/lib/utils";

const periods: { value: ResultAnalyticsPeriod; label: string }[] = [
  { value: "7D", label: "7 ngày" },
  { value: "30D", label: "30 ngày" },
  { value: "ALL", label: "Tất cả thời gian" },
];
const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(n);

export function ResultAnalyticsSummary({
  data,
  period,
  onPeriodChange,
}: {
  data: ResultAnalyticsData;
  period: ResultAnalyticsPeriod;
  onPeriodChange: (p: ResultAnalyticsPeriod) => void;
}) {
  const pending = data.dataStatus === "SOURCE_POLICY_PENDING";
  const score = data.summary.averageScore;
  const max = data.summary.maxScore;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.025em] text-[#0b1427]">Kết quả & Thống kê</h1>
          <p className="mt-1 text-[15px] font-normal text-[#3a4658]">
            Phân tích kết quả làm bài của bạn trong hạng <b>{data.licenseClass}</b>.
          </p>
        </div>
        <div role="group" aria-label="Khoảng thời gian thống kê" className="flex gap-1 rounded-xl bg-[#eef1fb] p-1">
          {periods.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={period === item.value}
              onClick={() => onPeriodChange(item.value)}
              className={cn(
                "rounded-lg px-3 py-2 text-[14px] font-semibold",
                item.value === period ? "bg-white text-[#0758d9] shadow-sm" : "text-[#344055] hover:bg-white/60",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {pending && (
        <div role="status" className="mt-4 rounded-xl border border-[#f6dfaa] bg-[#fffaef] px-4 py-3 text-[14px] font-medium text-[#533d14]">
          Đang đồng bộ thang điểm của hạng GPLX. Điểm chuẩn hóa chưa sẵn sàng; số lượt thi và tỷ lệ vẫn lấy từ backend.
        </div>
      )}

      <div className="mt-[1cm] grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard label="Điểm trung bình" icon={<ChartNoAxesColumnIncreasing className="size-5" />}>
          <strong className="text-[25px] font-extrabold">{score == null ? "—" : fmt(score)}</strong>
          <span className="text-[14px] font-normal text-[#3a4658]"> / {max == null ? "—" : fmt(max)} điểm</span>
        </AnalyticsCard>
        <AnalyticsCard label="Tỷ lệ đạt" icon={<BadgeCheck className="size-5" />}>
          <strong className="text-[25px] font-extrabold">{fmt(data.summary.passRate)}%</strong>
        </AnalyticsCard>
        <AnalyticsCard label="Độ chính xác" icon={<Target className="size-5" />}>
          <strong className="text-[25px] font-extrabold">{fmt(data.summary.accuracyRate)}%</strong>
          <span className="text-[14px] font-normal text-[#3a4658]"> câu đúng</span>
        </AnalyticsCard>
        <AnalyticsCard label="Bài đã làm" icon={<ClipboardList className="size-5" />}>
          <strong className="text-[25px] font-extrabold">{data.summary.attempts}</strong>
          <span className="text-[14px] font-normal text-[#3a4658]"> lượt thi</span>
        </AnalyticsCard>
      </div>
    </>
  );
}

function AnalyticsCard({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-h-[147px] flex-col rounded-2xl border border-[#dce2ee] bg-white px-5 pt-5 pb-[0.5cm] text-[#172335] shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[14px] font-normal text-[#3a4658]">{label}</h2>
        <div className="rounded-lg bg-[#eef2ff] p-2 text-[#0758d9]">{icon}</div>
      </div>
      <div className="mt-2 flex flex-1 items-end justify-center gap-x-1 text-center leading-none">{children}</div>
    </section>
  );
}
