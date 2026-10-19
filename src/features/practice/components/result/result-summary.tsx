"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Info,
  Eye,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface ResultSummaryProps {
  passed: boolean;

  correctCount: number;
  wrongCount: number;
  totalQuestions: number;

  criticalWrongCount: number;

  timeSpent: string;

  retryPending?: boolean;

  onRetry: () => void;
  onNextExam: () => void;
  onViewWrong: () => void;
}

export function ResultSummary({
  passed,
  correctCount,
  wrongCount,
  totalQuestions,
  criticalWrongCount,
  timeSpent,
  retryPending = false,
  onRetry,
  onNextExam,
  onViewWrong,
}: ResultSummaryProps) {
  const hasWrongCritical =
    criticalWrongCount > 0;

  return (
    <section
      className="
        mx-auto
        w-full
        max-w-[860px]
        rounded-[18px]
        border
        border-[#e2e4ec]
        bg-white
        px-8
        py-8
        shadow-[0_4px_16px_rgba(31,41,55,0.045)]
      "
    >
      {/* Result icon */}
      <div className="text-center">
        <div
          className={cn(
            "mx-auto flex size-14 items-center justify-center rounded-full",
            passed
              ? "bg-[#e5f8ed] text-[#079455]"
              : "bg-[#ffe7e4] text-[#d92d20]"
          )}
        >
          {passed ? (
            <CheckCircle2
              className="size-7"
              strokeWidth={2.2}
            />
          ) : (
            <ClipboardList
              className="size-7"
              strokeWidth={2.2}
            />
          )}
        </div>

        {/* Result badge */}
        <div
          className={cn(
            "mx-auto mt-4 inline-flex rounded-full px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.035em]",
            passed
              ? "bg-[#e4f7ec] text-[#087443]"
              : "bg-[#ffe2df] text-[#b42318]"
          )}
        >
          Kết quả ·{" "}
          {passed ? "Đạt" : "Chưa đạt"}
        </div>

        {/* Score */}
        <div className="mt-3 flex items-baseline justify-center gap-1.5">
          <span className="text-[46px] font-bold tracking-[-0.03em] text-[#101828]">
            {correctCount}
          </span>

          <span className="text-[30px] font-semibold text-[#344054]">
            / {totalQuestions}
          </span>
        </div>

        <p className="mt-1 text-[16px] font-medium text-[#475467]">
          câu trả lời đúng
        </p>
      </div>

      {/* Reason / result note */}
      <div
        className={cn(
          "mx-auto mt-5 flex max-w-[680px] items-start gap-2.5 rounded-[12px] border px-4 py-3.5",

          passed
            ? "border-[#ccebd9] bg-[#f0faf4]"
            : "border-[#dce3f2] bg-[#eef3ff]"
        )}
      >
        {passed ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#079455]" />
        ) : hasWrongCritical ? (
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#0758d9]" />
        ) : (
          <Info className="mt-0.5 size-4 shrink-0 text-[#0758d9]" />
        )}

        <p className="text-[14.5px] font-medium leading-6 text-[#344054]">
          {passed ? (
            <>
              Bạn đã hoàn thành bài với{" "}
              <span className="font-semibold text-[#101828]">
                {correctCount}/{totalQuestions}
              </span>{" "}
              câu trả lời đúng.
            </>
          ) : hasWrongCritical ? (
            <>
              Bạn đã trả lời đúng{" "}
              <span className="font-semibold text-[#101828]">
                {correctCount}/{totalQuestions}
              </span>{" "}
              câu nhưng chưa đạt do trả lời sai{" "}
              <span className="font-semibold text-[#d92d20]">
                {criticalWrongCount} câu điểm liệt
              </span>
              .
            </>
          ) : (
            <>
              Bạn đã trả lời đúng{" "}
              <span className="font-semibold text-[#101828]">
                {correctCount}/{totalQuestions}
              </span>{" "}
              câu. Kết quả hiện tại chưa đạt yêu cầu.
            </>
          )}
        </p>
      </div>

      {/* Metrics */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <MetricItem
          icon={
            <Clock3 className="size-4" />
          }
          label="Thời gian"
          value={timeSpent}
        />

        <MetricItem
          icon={
            <CheckCircle2 className="size-4" />
          }
          label="Câu đúng"
          value={`${correctCount} / ${totalQuestions}`}
        />

        <MetricItem
          icon={
            <XCircle className="size-4" />
          }
          label="Câu sai"
          value={`${wrongCount} câu`}
        />

        <MetricItem
          icon={
            <AlertTriangle className="size-4" />
          }
          label="Điểm liệt"
          value={
            criticalWrongCount > 0
              ? `Sai ${criticalWrongCount} câu`
              : "Không sai"
          }
        />
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          disabled={retryPending}
          className="
            inline-flex
            h-11
            items-center
            justify-center
            gap-2
            rounded-[10px]
            bg-[#0758d9]
            px-5
            text-[14.5px]
            font-semibold
            text-white
            shadow-[0_2px_5px_rgba(7,88,217,0.16)]
            transition
            hover:bg-[#064fc3]
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          <RotateCcw className="size-4" />

          {retryPending
            ? "Đang khởi tạo..."
            : "Làm lại đề"}
        </button>

        <button
          type="button"
          onClick={onNextExam}
          className="
            inline-flex
            h-11
            items-center
            justify-center
            rounded-[10px]
            bg-[#edf1ff]
            px-5
            text-[14.5px]
            font-semibold
            text-[#27364f]
            transition
            hover:bg-[#e4eaff]
          "
        >
          Đề tiếp theo
        </button>

        {wrongCount > 0 && (
          <button
            type="button"
            onClick={onViewWrong}
            className="
              inline-flex
              h-11
              items-center
              justify-center
              gap-1.5
              rounded-[10px]
              px-3.5
              text-[14.5px]
              font-semibold
              text-[#0758d9]
              transition
              hover:bg-[#f2f5ff]
            "
          >
            <Eye className="size-4" />
            Xem ngay câu sai ({wrongCount})
          </button>
        )}
      </div>
    </section>
  );
}

function MetricItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[10px] bg-[#f3f4fb] px-4 py-4">
      <div className="flex items-center gap-2 text-[14.5px] font-semibold text-[#344054]">
        {icon}
        {label}
      </div>

      <p className="mt-[0.5cm] text-center text-[19px] font-bold leading-none text-[#101828]">
        {value}
      </p>
    </div>
  );
}