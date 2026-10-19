"use client";

import { ChevronDown, CircleDot, RefreshCcw } from "lucide-react";
import type { HistoryPeriodFilter, HistoryResultFilter, HistoryTypeFilter } from "../history-types";

interface HistoryToolbarProps {
  total: number;
  activityType: HistoryTypeFilter;
  result: HistoryResultFilter;
  period: HistoryPeriodFilter;
  onActivityTypeChange: (value: HistoryTypeFilter) => void;
  onResultChange: (value: HistoryResultFilter) => void;
  onPeriodChange: (value: HistoryPeriodFilter) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function HistoryToolbar({ total, activityType, result, period,
  onActivityTypeChange, onResultChange, onPeriodChange, onRefresh, isRefreshing }: HistoryToolbarProps) {
  return <>
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-[#0f172a]">Lịch sử thi</h1>
        <p className="mt-2 text-[15.5px] text-[#1f2937]">Xem lại kết quả các bài thi thử và kỳ thi chính thức đã hoàn thành.</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#eef3ff] px-4 text-[14.5px] font-medium text-[#23324d]">
          <CircleDot className="size-4 text-[#0758d9]" /> Tổng cộng: <strong className="text-[#0758d9]">{total} lượt thi</strong>
        </span>
        <button type="button" onClick={onRefresh} disabled={isRefreshing}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#d7deec] bg-white px-3 text-[14.5px] font-semibold text-[#0758d9] hover:bg-[#f0f5ff] disabled:opacity-60">
          <RefreshCcw className="size-4" /> Cập nhật
        </button>
      </div>
    </div>
    <section className="mt-7 rounded-[16px] border border-[#dce2ee] bg-white px-5 py-5 shadow-[0_3px_12px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-end gap-y-5 gap-x-[1cm]">
        <HistoryFilterField label="Loại bài" value={activityType} onChange={v => onActivityTypeChange(v as HistoryTypeFilter)}
          options={[["ALL", "Tất cả loại bài"], ["PRESET_EXAM", "Bộ đề có sẵn"], ["RANDOM_EXAM", "Thi thử ngẫu nhiên"], ["OFFICIAL_EXAM", "Thi chính thức"]]} />
        <HistoryFilterField label="Kết quả" value={result} onChange={v => onResultChange(v as HistoryResultFilter)}
          options={[["ALL", "Tất cả kết quả"], ["PASSED", "Đạt"], ["FAILED", "Chưa đạt"]]} />
        <HistoryFilterField label="Thời gian" value={period} onChange={v => onPeriodChange(v as HistoryPeriodFilter)}
          options={[["LAST_7_DAYS", "7 ngày gần đây"], ["LAST_30_DAYS", "30 ngày gần đây"], ["LAST_90_DAYS", "90 ngày gần đây"], ["ALL", "Tất cả thời gian"]]} />
      </div>
    </section>
  </>;
}

function HistoryFilterField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (value: string) => void; options: [string, string][];
}) {
  return <label className="block min-w-[175px] flex-1 sm:flex-none">
    <span className="mb-[0.6cm] block text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#101827]">{label}</span>
    <div className="relative">
      <select value={value} onChange={event => onChange(event.target.value)}
        className="h-11 w-full min-w-[175px] appearance-none rounded-[10px] border border-[#dfe5f2] bg-[#f5f7ff] pl-3.5 pr-9 text-[14.5px] font-medium text-[#101827] outline-none transition hover:bg-[#eef2ff] focus:border-[#76a6f8] focus:bg-white">
        {options.map(([key, title]) => <option value={key} key={key}>{title}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#42556f]" />
    </div>
  </label>;
}
