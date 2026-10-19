"use client";

import {
  AlertCircle, ArrowRight, BadgeCheck, ChevronLeft, ChevronRight,
  Dices, FileText, RefreshCcw,
} from "lucide-react";
import type { HistoryListItem } from "../history-types";
import { cn } from "@/lib/utils";
import { resolveHistoryResultPath } from "../history-navigation";

interface HistoryTableProps {
  items: HistoryListItem[];
  page: number; size: number; total: number; totalPages: number;
  isLoading?: boolean; isError?: boolean;
  resolvingId?: string | null;
  titleOverrides?: Record<string, string>;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
  onViewResult: (item: HistoryListItem) => void;
}

export function HistoryTable({ items, page, size, total, totalPages, isLoading, isError,
  resolvingId, titleOverrides, onPageChange, onRetry, onViewResult }: HistoryTableProps) {
  if (isLoading) return <HistoryNotice mode="loading" />;
  if (isError) return <HistoryNotice mode="error" onRetry={onRetry} />;
  if (items.length === 0) return <HistoryNotice mode="empty" />;

  const start = page * size + 1;
  const end = Math.min(page * size + items.length, total);
  const headClass = "px-3 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#101827]";
  return <section className="mt-[1cm] overflow-hidden rounded-[16px] border border-[#dae2ee] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.045)]">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[990px] border-collapse text-[14.5px] text-[#0b1020]">
        <thead className="bg-[#eef2ff]">
          <tr>
            <th className={cn(headClass, "w-[27%]")}>Bài thi</th>
            <th className={cn(headClass, "w-[15%]")}>Loại</th>
            <th className={cn(headClass, "w-[12%]")}>Kết quả</th>
            <th className={cn(headClass, "w-[13%]")}>Điểm</th>
            <th className={cn(headClass, "w-[12%]")}>Thời gian làm</th>
            <th className={cn(headClass, "w-[15%]")}>Ngày làm</th>
            <th className={cn(headClass, "w-[12%]")}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => <HistoryRow key={item.resultId} item={item} disabled={Boolean(resolvingId)}
            isResolving={resolvingId === item.resultId} title={resolveHistoryTitle(item, titleOverrides)} onViewResult={onViewResult} />)}
        </tbody>
      </table>
    </div>
    <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-t border-[#e8edf6] px-6 py-3">
      <p className="text-[13.5px] text-[#1b2536]">Hiển thị <strong className="text-[#0f172a]">{start}–{end}</strong> trong <strong className="text-[#0f172a]">{total}</strong> lượt thi</p>
      <nav aria-label="Phân trang lịch sử thi" className="flex flex-wrap items-center gap-1.5">
        <button className="size-9 rounded-lg hover:bg-[#eef2ff] disabled:opacity-35" disabled={page <= 0} onClick={() => onPageChange(page-1)} aria-label="Trang trước"><ChevronLeft className="mx-auto size-4" /></button>
        {paginationPages(page, totalPages).map(index => <button key={index} onClick={() => onPageChange(index)} aria-current={index===page ? "page":undefined}
          className={cn("size-9 rounded-lg text-[13.5px] font-semibold transition", index === page ? "bg-[#0758d9] text-white" : "text-[#23324d] hover:bg-[#eef2ff]")}>{index+1}</button>)}
        <button className="size-9 rounded-lg hover:bg-[#eef2ff] disabled:opacity-35" disabled={page >= totalPages-1} onClick={() => onPageChange(page+1)} aria-label="Trang sau"><ChevronRight className="mx-auto size-4" /></button>
      </nav>
    </div>
  </section>;
}

function HistoryRow({ item, disabled, isResolving, title, onViewResult }: {
  item: HistoryListItem; disabled: boolean; isResolving: boolean; title: string; onViewResult: (item: HistoryListItem) => void;
}) {
  const activity = item.activityType === "PRESET_EXAM" ? { label:"Bộ đề có sẵn", icon: FileText }
    : item.activityType === "RANDOM_EXAM" ? { label:"Thi thử ngẫu nhiên", icon: Dices }
    : item.activityType === "OFFICIAL_EXAM" ? { label:"Thi chính thức", icon: BadgeCheck }
    : { label:"Chưa xác định", icon: FileText };
  const Icon = activity.icon;
  const canOpen = Boolean(resolveHistoryResultPath(item));
  return <tr className="border-b border-[#e9edf4] align-middle transition-colors last:border-0 hover:bg-[#fafbff]">
    <td className="py-4 pl-6 pr-3 text-left align-middle">
      <span className="flex items-start gap-2.5"><Icon className="mt-0.5 size-4 shrink-0 text-[#0758d9]" />
        <span className="font-semibold leading-6 text-[#0b1020]">{title}</span></span>
    </td>
    <td className="px-3 py-4 text-center align-middle"><span className="inline-flex justify-center rounded-lg bg-[#eef2ff] px-3 py-1.5 text-[13.5px] font-medium text-[#20395e]">{activity.label}</span></td>
    <td className="px-3 py-4 text-center align-middle">{item.result === "PASSED" ? <span className="inline-flex items-center rounded-full border border-[#aee6cb] bg-[#eafbf3] px-3 py-1.5 text-[13.5px] font-semibold text-[#067548]">Đạt</span> : <span className="inline-flex items-center rounded-full border border-[#f8c1c1] bg-[#fff0f0] px-3 py-1.5 text-[13.5px] font-semibold text-[#bb2b2b]">Chưa đạt</span>}</td>
    <td className="px-3 py-4 text-center align-middle">
      <span className="font-semibold text-[#0b1020]">{num(item.score)}{item.maxScore == null ? "" : ` / ${num(item.maxScore)}`}</span>
      {item.correctCount != null && item.questionCount != null && <span className="block text-[13.5px] text-[#1b2536]">Đúng {item.correctCount}/{item.questionCount} câu</span>}
    </td>
    <td className="px-3 py-4 text-center align-middle text-[#111827]">{duration(item.durationSeconds)}</td>
    <td className="px-3 py-4 text-center align-middle whitespace-nowrap text-[#111827]">{dateTime(item.completedAt)}</td>
    <td className="px-3 py-4 text-center align-middle">
      <button type="button" onClick={() => onViewResult(item)} disabled={!canOpen || disabled}
        title={canOpen ? "Xem kết quả từ hệ thống thi" : "Chưa có đường dẫn kết quả hợp lệ"}
        className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-[13.5px] font-semibold text-[#0758d9] hover:bg-[#eef4ff] disabled:cursor-not-allowed disabled:text-[#78879c] disabled:hover:bg-transparent">
        {isResolving ? "Đang mở…" : canOpen ? "Xem kết quả" : "Chưa khả dụng"}
        {canOpen && <ArrowRight className="size-4" />}
      </button>
    </td>
  </tr>;
}

function HistoryNotice({ mode, onRetry }: { mode: "loading" | "empty" | "error"; onRetry?: () => void }) {
  if (mode === "loading") return <section className="mt-[1cm] rounded-2xl border border-[#e1e6ef] bg-white p-6" aria-busy="true">
    <p className="text-[14.5px] text-[#334155]">Đang tải lịch sử từ hệ thống…</p>
    {Array.from({ length: 5 }, (_, i) => <div key={i} className="mt-4 h-12 animate-pulse rounded-lg bg-[#f0f3fa]" />)}
  </section>;
  return <section className="mt-[1cm] flex min-h-[245px] items-center justify-center rounded-2xl border border-[#dfe6f0] bg-white p-8 text-center">
    <div className="max-w-lg">
      {mode === "error" ? <AlertCircle className="mx-auto size-10 text-[#cc4242]" /> : <FileText className="mx-auto size-10 text-[#0758d9]" />}
      <h2 className="mt-4 text-[19px] font-semibold text-[#0f172a]">{mode === "error" ? "Không tải được lịch sử thi" : "Chưa có lịch sử phù hợp"}</h2>
      <p className="mt-2 text-[14.5px] leading-6 text-[#334155]">{mode === "error" ? "Không thể kết nối tới dữ liệu lúc này. Bạn có thể thử tải lại." : "Chưa có lượt thi nào phù hợp với bộ lọc đang chọn."}</p>
      {mode === "error" && <button type="button" onClick={onRetry} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#eef3ff] px-4 py-2.5 text-[14.5px] font-semibold text-[#0758d9]"><RefreshCcw className="size-4" /> Thử lại</button>}
    </div>
  </section>;
}

function resolveHistoryTitle(item: HistoryListItem, titleOverrides?: Record<string, string>) {
  const rawTitle = titleOverrides?.[item.targetId] ?? item.title;
  return rawTitle && rawTitle.trim().length > 0 ? rawTitle.trim() : "Chưa có tên bài";
}

function paginationPages(page: number, totalPages: number) {
  if (totalPages <= 5) return Array.from({length: totalPages}, (_, index) => index);
  const start = Math.max(0, Math.min(page - 2, totalPages - 5));
  return Array.from({length: 5}, (_, index) => start + index);
}
function num(value: number | null) { return value == null ? "—" : String(value); }
function duration(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "—";
  const whole = Math.round(seconds);
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}
function dateTime(instant: string) {
  const d = new Date(instant);
  if (Number.isNaN(d.getTime())) return "—";
  const parts = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit", hourCycle:"h23" }).formatToParts(d);
  const part = (name: string) => parts.find(p => p.type === name)?.value ?? "";
  return `${part("day")}/${part("month")}/${part("year")} · ${part("hour")}:${part("minute")}`;
}
