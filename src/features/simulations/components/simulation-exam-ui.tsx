"use client";
import type { ReactNode } from "react";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import styles from "./simulation-exam-layout.module.css";
import textStyles from "./simulation-text-layout.module.css";
import { cn } from "@/lib/utils";
import {
  BackAction,
  LearningNotice,
  LearningShell,
  learningStyles,
} from "./learning-ui";
import type { LearningLoadState } from "../simulation-learning-types";
export const examCard = cn(learningStyles.card, "p-5 sm:p-6");
export const examTitle =
  "inline-flex items-center gap-2 text-[18px] font-semibold text-[#0b1427]";
export const examBody = "text-[15.5px] font-medium leading-6 text-[#344054]";
export function ExamBadge({
  children,
  tone = "blue",
  className,
}: {
  children: ReactNode;
  tone?: "blue" | "red" | "green";
  className?: string;
}) {
  return (
    <span
      data-tone={tone}
      className={cn(learningStyles.badge, styles.badge, className)}
    >
      {children}
    </span>
  );
}
export function ExamShell({
  title,
  description,
  back = "Quay lại Ôn luyện",
  onBack,
  badge,
  children,
}: {
  title: string;
  description: string;
  back?: string;
  onBack?: () => void;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <LearningShell
      navigation={<BackAction onClick={onBack}>{back}</BackAction>}
    >
      <div className="mb-[1cm] flex flex-wrap items-center justify-between gap-4">
        <div className={textStyles.headingDescription}>
          <h1 className={learningStyles.heading}>{title}</h1>
          <p className={examBody}>{description}</p>
        </div>
        {badge}
      </div>
      {children}
    </LearningShell>
  );
}
export function ExamLoad({
  state,
  onRetry,
}: {
  state: LearningLoadState<unknown>;
  onRetry?: () => void;
}) {
  if (state.status === "loading")
    return (
      <div
        role="status"
        aria-label="Đang tải bài thi mô phỏng"
        className="space-y-[1cm]"
      >
        <div className={cn(examCard, "h-28 animate-pulse")}>
          <div className="h-5 w-48 rounded bg-[#eceef4]" />
          <div className="mt-5 h-3 rounded bg-[#eceef4]" />
        </div>
        <div className={cn(examCard, "h-80 animate-pulse bg-[#f0f2f8]")} />
      </div>
    );
  if (state.status === "error")
    return (
      <LearningNotice kind="error" message={state.message} onRetry={onRetry} />
    );
  return (
    <LearningNotice
      kind="unavailable"
      message="Thi thử mô phỏng sẽ khả dụng khi nội dung và dịch vụ được phát hành."
    />
  );
}
export function ExamPositions({
  positions,
  current,
  onChoose,
  label = "Tiến độ bài thi",
  compact = false,
}: {
  positions: { position: number; status: string }[];
  current: number;
  onChoose?: (position: number) => void;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "grid grid-cols-5 gap-2",
        compact ? styles.compactPositions : "sm:grid-cols-10",
      )}
    >
      {positions.map((p) => {
        const selected = p.position === current;
        const cls = cn(
          "flex min-h-10 items-center justify-center gap-1 rounded-[8px] px-1 text-[14.5px] font-semibold",
          selected ? "bg-[#0758d9] text-white" : "bg-[#f0f2fb] text-[#475467]",
          onChoose &&
            "outline-none hover:ring-2 hover:ring-[#0758d9] focus-visible:ring-2 focus-visible:ring-[#0758d9]",
        );
        const content = (
          <>
            {p.status === "COMPLETED" && !onChoose && (
              <CheckCircle2 className="size-3.5" />
            )}
            {String(p.position).padStart(2, "0")}
          </>
        );
        return onChoose ? (
          <button
            key={p.position}
            type="button"
            aria-label={`Xem lại tình huống ${p.position}`}
            aria-current={selected ? "step" : undefined}
            className={cls}
            onClick={() => onChoose(p.position)}
          >
            {content}
          </button>
        ) : (
          <span
            key={p.position}
            aria-current={selected ? "step" : undefined}
            className={cls}
          >
            {content}
          </span>
        );
      })}
    </div>
  );
}
export function ExamProgress({
  completed,
  total,
  current,
  positions,
  finalizing = false,
}: {
  completed: number;
  total: number;
  current: number;
  positions: { position: number; status: string }[];
  finalizing?: boolean;
}) {
  return (
    <section className={examCard} aria-label="Tiến độ bài thi">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-[#172335]">
            {finalizing
              ? `Đã hoàn thành ${completed}/${total} tình huống`
              : `Tình huống ${String(current).padStart(2, "0")} / ${total}`}
          </h2>
          <p className={cn(examBody, "mt-1")}>
            {finalizing
              ? "Đang xác nhận kết quả tổng kết bài thi."
              : `Đang thực hiện tình huống thứ ${current}`}
          </p>
        </div>
        <ExamBadge>
          <CheckCircle2 className="size-4" />
          {completed} / {total} tình huống hoàn thành
        </ExamBadge>
      </div>
      <ExamPositions positions={positions} current={finalizing ? 0 : current} />
    </section>
  );
}
export function ExamCenterState({
  title,
  message,
  busy = false,
  onRetry,
}: {
  title: string;
  message: string;
  busy?: boolean;
  onRetry?: () => void;
}) {
  return (
    <section
      role={busy ? "status" : "alert"}
      className={cn(examCard, styles.centerState)}
    >
      <div className={styles.centerStateContent}>
        <span
          className={cn(
            "mb-5 flex size-14 items-center justify-center rounded-[14px]",
            busy
              ? "bg-[#eef2ff] text-[#0758d9]"
              : "bg-[#fff0ef] text-[#d92d20]",
          )}
        >
          {busy ? (
            <Loader2 className="size-7 animate-spin" />
          ) : (
            <CircleAlert className="size-7" />
          )}
        </span>
        <h2 className="text-[20px] font-bold text-[#0b1427]">{title}</h2>
        <p className={cn(examBody, "mt-3 max-w-[520px]")}>{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          className={cn(learningStyles.primary, styles.centerRetry)}
          onClick={onRetry}
        >
          Kiểm tra và thử lại
        </button>
      )}
    </section>
  );
}
