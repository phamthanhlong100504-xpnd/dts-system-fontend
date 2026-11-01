"use client";
import type { ReactNode } from "react";
import { ArrowLeft, BookOpen, CircleAlert, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  simulationLayout,
  simulationSurfaces,
} from "./simulation-presentation";
export const learningStyles = {
  ...simulationSurfaces,
  scenarioCard: "flex min-w-0 flex-col gap-4 p-5 sm:flex-row",
  scenarioThumbnail:
    "relative aspect-video w-full shrink-0 overflow-hidden rounded-[10px] bg-[#172235] outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9] sm:w-[160px] sm:self-start",
  itemHeading: "text-[16px] font-semibold leading-6 text-[#172335]",
  progressTrack: "h-2 overflow-hidden rounded-full bg-[#e7eaf4]",
  progressFill: "h-full rounded-full bg-[#2f6eea]",
  heading:
    "text-[22px] font-semibold leading-[1.3] tracking-[-0.025em] text-[#0b1427]",
  body: "text-[15.5px] font-medium leading-6 text-[#475467]",
  primary:
    "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[#0758d9] px-5 py-2 text-[14.5px] font-semibold text-white outline-none transition hover:bg-[#064fc3] focus-visible:ring-2 focus-visible:ring-[#0758d9] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[#eef2ff] px-4 py-2 text-[14.5px] font-semibold text-[#0758d9] outline-none transition hover:bg-[#e3eaff] focus-visible:ring-2 focus-visible:ring-[#0758d9] disabled:cursor-not-allowed disabled:opacity-50",
  back: "inline-flex min-h-8 items-center gap-2 rounded-[8px] py-1 text-[14.5px] font-medium text-[#475467] outline-none transition hover:text-[#0758d9] focus-visible:ring-2 focus-visible:ring-[#0758d9]",
};
/** Match the existing chapter page in every state, including errors and loading. */
export function LearningShell({
  children,
  navigation,
}: {
  children: ReactNode;
  navigation?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "font-dts min-h-[calc(100vh-64px)] text-[#0b1427]",
        simulationLayout.background,
      )}
    >
      {navigation && (
        <div className={cn(simulationLayout.navigation, "pt-7")}>
          {navigation}
        </div>
      )}
      <main
        className={cn(
          simulationLayout.content,
          "pb-10",
          navigation ? "pt-5" : "pt-7",
        )}
      >
        {children}
      </main>
    </div>
  );
}
export function BackAction({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={learningStyles.back}>
      <ArrowLeft className="size-4" aria-hidden="true" />
      {children}
    </button>
  );
}
export function ProgressSummary({
  label,
  learned,
  total,
  percent,
}: {
  label: string;
  learned: number;
  total: number;
  percent: number;
}) {
  return (
    <section
      className={cn(learningStyles.card, "px-6 py-5")}
      aria-label={label}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[11px] bg-[#edf3ff] text-[#0758d9]">
            <BookOpen className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[13.5px] font-bold uppercase tracking-[0.04em] text-[#0758d9]">
              {label}
            </p>
            <p className="mt-[0.7cm] text-[15.5px] font-medium text-[#344054]">
              <strong className="text-[18px] font-bold text-[#0b1427]">
                {learned} / {total}
              </strong>{" "}
              tình huống đã luyện
            </p>
          </div>
        </div>
        <span className="shrink-0 text-[26px] font-bold tracking-[-0.025em] text-[#0758d9]">
          {percent}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className={cn(learningStyles.progressTrack, "mt-4")}
      >
        <div
          className={learningStyles.progressFill}
          style={{ width: `${percent}%` }}
        />
      </div>
    </section>
  );
}
export function LearningNotice({
  kind,
  message,
  onRetry,
}: {
  kind: "unavailable" | "error" | "empty";
  message?: string;
  onRetry?: () => void;
}) {
  const error = kind === "error";
  const Icon = error ? CircleAlert : Video;
  const title = error
    ? "Không thể tải nội dung"
    : kind === "empty"
      ? "Chưa có nội dung phù hợp"
      : "Nội dung mô phỏng đang được chuẩn bị";
  return (
    <section
      role={error ? "alert" : undefined}
      className={cn(
        learningStyles.card,
        "flex min-h-[230px] flex-col items-center justify-center px-6 py-10 text-center",
      )}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-[12px]",
          error ? "bg-[#fff0ef] text-[#d92d20]" : "bg-[#eef2ff] text-[#0758d9]",
        )}
      >
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-[18px] font-bold text-[#0b1427]">{title}</h2>
      <p className={cn(learningStyles.body, "mt-2 max-w-[520px]")}>
        {message ??
          (kind === "unavailable"
            ? "Danh sách và tiến độ luyện tập sẽ xuất hiện khi nội dung được phát hành."
            : "Hãy thử bộ lọc khác hoặc quay lại danh sách chương.")}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(learningStyles.secondary, "mt-5")}
        >
          Thử lại
        </button>
      )}
    </section>
  );
}
export function LearningSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div
      role="status"
      aria-label="Đang tải nội dung mô phỏng"
      className="space-y-6"
    >
      <div className={cn(learningStyles.card, "h-[118px] animate-pulse p-5")}>
        <div className="h-5 w-44 rounded bg-[#eceef4]" />
        <div className="mt-6 h-2 rounded-full bg-[#eceef4]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: cards }, (_, i) => (
          <div
            key={i}
            className={cn(
              learningStyles.card,
              "min-h-[210px] animate-pulse p-5",
            )}
          >
            <div className="h-6 w-24 rounded bg-[#eceef4]" />
            <div className="mt-5 h-5 w-3/4 rounded bg-[#eceef4]" />
            <div className="mt-6 h-2 rounded-full bg-[#eceef4]" />
          </div>
        ))}
      </div>
    </div>
  );
}
export function roman(value: number) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 100)
    return String(value);
  let remaining = value,
    result = "";
  for (const [n, s] of [
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ] as const) {
    while (remaining >= n) {
      result += s;
      remaining -= n;
    }
  }
  return result;
}
export function mediaTime(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
export function reactionTime(ms: number) {
  return `${(ms / 1000).toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} giây`;
}
