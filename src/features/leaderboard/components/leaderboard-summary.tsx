"use client";
import type { LeaderboardCurrentUser, LeaderboardPeriod } from "../leaderboard-types";
import { cn } from "@/lib/utils";

const periods: { value: LeaderboardPeriod; label: string }[] = [
  { value: "WEEK", label: "Tuần này" },
  { value: "MONTH", label: "Tháng này" },
  { value: "ALL", label: "Tất cả thời gian" },
];
const nf = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

export function LeaderboardSummary({
  licenseClass,
  period,
  currentUser,
  totalParticipants,
  onPeriodChange,
}: {
  licenseClass: string;
  period: LeaderboardPeriod;
  currentUser?: LeaderboardCurrentUser;
  totalParticipants?: number;
  onPeriodChange: (period: LeaderboardPeriod) => void;
}) {
  const displayName =
    currentUser?.displayName?.trim() ||
    (currentUser?.profileStatus === "PENDING" ? "Đang đồng bộ tên người học" : "Người học");
  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((x) => x[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.025em] text-[#0b1427]">Bảng xếp hạng</h1>
          <p className="mt-1 text-[15px] font-normal text-[#3a4658]">
            So sánh thành tích học tập trong hạng <b>{licenseClass}</b>.
          </p>
        </div>
        <div role="group" aria-label="Chu kỳ bảng xếp hạng" className="flex flex-wrap gap-1 rounded-xl bg-[#eef1fb] p-1">
          {periods.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onPeriodChange(item.value)}
              aria-pressed={period === item.value}
              className={cn(
                "rounded-lg px-3 py-2 text-[14px] font-semibold transition",
                item.value === period ? "bg-white text-[#0758d9] shadow-sm" : "text-[#344055] hover:bg-white/60",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="relative mt-[1cm] overflow-hidden rounded-2xl border border-[#dce2ee] bg-white shadow-sm">
        <div className="absolute inset-y-0 left-0 w-1 bg-[#0758d9]" />
        <div className="grid gap-0 sm:grid-cols-[minmax(0,1.6fr)_1fr_1fr]">
          <div className="flex min-w-0 items-center gap-4 p-5 sm:p-6">
            <div className="flex size-[54px] shrink-0 items-center justify-center rounded-xl bg-[#eaf0ff] text-[16px] font-bold text-[#0758d9]">
              {initials || "NH"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[16px] font-bold text-[#0b1427]">{displayName}</p>
              <p className="mt-1 text-[15px] font-normal text-[#3a4658]">Thứ hạng của bạn</p>
            </div>
          </div>
          <div className="border-t border-[#ebedf4] px-5 py-5 sm:border-l sm:border-t-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#273449]">THỨ HẠNG HIỆN TẠI</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[26px] font-extrabold text-[#0758d9]">
                {currentUser?.rank == null ? "Chưa có hạng" : `#${currentUser.rank}`}
              </span>
              {totalParticipants != null && (
                <span className="text-[14px] font-normal text-[#3a4658]">/ {nf.format(totalParticipants)}</span>
              )}
            </div>
          </div>
          <div className="border-t border-[#ebedf4] px-5 py-5 sm:border-l sm:border-t-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#273449]">ĐIỂM XẾP HẠNG</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[26px] font-extrabold text-[#0b1427]">{currentUser ? nf.format(currentUser.rankingScore) : "—"}</span>
              <span className="text-[14px] font-normal text-[#3a4658]">điểm</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
