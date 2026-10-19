"use client";
import { AlertCircle, ChevronLeft, ChevronRight, Medal, RefreshCcw, Trophy } from "lucide-react";
import type { LeaderboardUserEntry } from "../leaderboard-types";

const nf = new Intl.NumberFormat("vi-VN");

function initialsFromName(name?: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) return "NH";
  return trimmed
    .split(/\s+/)
    .map((part) => part[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

export function LeaderboardTable({
  items,
  page,
  size,
  totalParticipants,
  totalPages,
  isLoading,
  isError,
  onPageChange,
  onRetry,
}: {
  items: LeaderboardUserEntry[];
  page: number;
  size: number;
  totalParticipants?: number;
  totalPages?: number;
  isLoading?: boolean;
  isError?: boolean;
  onPageChange: (p: number) => void;
  onRetry?: () => void;
}) {
  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-white" aria-label="Đang tải bảng xếp hạng" />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-[#fecdca] bg-white p-12 text-center">
        <AlertCircle className="mx-auto mb-3 text-[#dc2626]" />
        <p className="text-[15.5px] font-semibold text-[#0b1427]">Không tải được bảng xếp hạng.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex gap-2 rounded-lg bg-[#eef2ff] px-4 py-2 text-[14.5px] font-bold text-[#0758d9]"
        >
          <RefreshCcw className="size-4" />
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dce2ee] bg-white shadow-sm">
      <div className="min-w-[640px]">
        <div className="grid min-h-[50px] grid-cols-[110px_minmax(0,1fr)_210px] items-center bg-[#edf1ff] px-5 text-center text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#273449]">
          <span>HẠNG</span>
          <span className="pl-6 text-left">NGƯỜI HỌC</span>
          <span>ĐIỂM XẾP HẠNG</span>
        </div>

        {items.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-6 text-[15.5px] font-medium text-[#2b3749]">
            <Trophy className="text-[#d97706]" />
            {totalParticipants ? "Trang này không có dữ liệu; hãy quay về trang trước." : "Chưa có người học đạt điểm trong chu kỳ này."}
          </div>
        ) : (
          items.map((item) => {
            const name = item.isCurrentUser
              ? "Bạn"
              : item.displayName?.trim() || (item.profileStatus === "PENDING" ? "Đang đồng bộ tên" : "Người học");
            const avatarText = item.isCurrentUser ? "B" : initialsFromName(item.displayName);

            return (
              <div
                key={item.userId}
                className="grid min-h-[72px] grid-cols-[110px_minmax(0,1fr)_210px] items-center border-t border-[#e8ecf3] px-5 text-[14.5px] text-[#0b1427]"
              >
                <div className="flex items-center justify-center text-[15.5px] font-semibold text-[#253041]">
                  {item.rank != null && item.rank <= 3 ? (
                    <span className="flex size-8 items-center justify-center rounded-full bg-[#fff3e3] text-[#bb6910]">
                      <Medal className="size-5" />
                    </span>
                  ) : item.rank != null ? (
                    String(item.rank).padStart(2, "0")
                  ) : (
                    "—"
                  )}
                </div>

                <div className="flex min-w-0 items-center justify-start gap-3 pl-6 text-left">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#edf2ff] text-[14.5px] font-bold text-[#1f57ba]">
                    {avatarText}
                  </div>
                  <div className="min-w-0 truncate text-[15.5px] font-medium text-[#172335]">{name}</div>
                </div>

                <div className="text-center text-[15.5px] font-semibold text-[#172335]">
                  {nf.format(item.rankingScore)} <span className="font-medium text-[#2b3749]">điểm</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e8ecf3] px-5 py-3 text-[14.5px] font-medium text-[#2b3749]">
        <span>
          {items.length ? `Hiển thị ${page * size + 1}–${page * size + items.length}` : "Hiển thị 0"} trong {nf.format(totalParticipants ?? 0)} người học
        </span>
        {(totalPages ?? 0) > 1 && (
          <nav aria-label="Phân trang bảng xếp hạng" className="flex items-center gap-2">
            <button
              aria-label="Trang trước"
              type="button"
              disabled={page <= 0}
              onClick={() => onPageChange(page - 1)}
              className="rounded-md border border-[#d7dfef] p-2 disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-[14.5px] font-medium text-[#2b3749]">Trang {page + 1} / {totalPages}</span>
            <button
              aria-label="Trang sau"
              type="button"
              disabled={page >= (totalPages ?? 0) - 1}
              onClick={() => onPageChange(page + 1)}
              className="rounded-md border border-[#d7dfef] p-2 disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
