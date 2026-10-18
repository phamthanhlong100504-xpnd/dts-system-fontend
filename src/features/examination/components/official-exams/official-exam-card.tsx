"use client";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCcw,
} from "lucide-react";

import type { OfficialExamListItem } from "@/features/examination/official-exam-types";
import { cn } from "@/lib/utils";

interface OfficialExamCardProps {
  exam: OfficialExamListItem;
  onStart: (exam: OfficialExamListItem) => void;
  isStarting?: boolean;
}

export function OfficialExamCard({
  exam,
  onStart,
  isStarting = false,
}: OfficialExamCardProps) {
  const durationMinutes =
    exam.durationSeconds != null
      ? Math.round(exam.durationSeconds / 60)
      : undefined;

  const participationLabel =
    exam.canResume
      ? "Tiếp tục thi"
      : exam.canStart ? "Bắt đầu thi" : "Xem chi tiết";

  const startDisabled =
    isStarting;

  return (
    <article className="min-h-[176px] rounded-[18px] border border-[#dedfea] bg-white px-6 py-[1cm] shadow-[0_4px_14px_rgba(31,41,55,0.055)] sm:px-8">
      <div className="flex h-full flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-[0.8cm] gap-y-2">
            <ExamStatusBadge exam={exam} />

            {exam.licenseClass && (
              <span className="inline-flex min-h-7 items-center rounded-[7px] bg-[#f2f4f7] px-2.5 text-[13px] font-medium text-[#344054]">
                Hạng {exam.licenseClass}
              </span>
            )}

            {exam.questionsCount != null && (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#344054]">
                <FileText
                  className="size-3.5"
                  strokeWidth={1.9}
                />
                {exam.questionsCount} câu hỏi
              </span>
            )}

            {durationMinutes != null && (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#344054]">
                <Clock3
                  className="size-3.5"
                  strokeWidth={1.9}
                />
                {durationMinutes} phút
              </span>
            )}
          </div>

          <h2 className="mt-[0.7cm] text-[18px] font-bold leading-[1.45] tracking-[-0.01em] text-[#101828] [text-shadow:0_0_0.3px_currentColor]">
            {exam.title}
          </h2>

          <div className="mt-[0.7cm] grid gap-3 md:grid-cols-2">
            <InfoBox
              icon={
                <CalendarDays
                  className="size-4"
                  strokeWidth={1.9}
                />
              }
              label="Thời gian tham gia"
              compactValue
              value={formatParticipationWindow(
                exam.startedAt,
                exam.endedAt
              )}
            />

            <InfoBox
              icon={
                <RefreshCcw
                  className="size-4"
                  strokeWidth={1.9}
                />
              }
              label="Lượt thi còn lại"
              value={formatRemainingAttempts(
                exam.remainingAttempts
              )}
            />
          </div>
        </div>

        <div className="shrink-0 md:self-center">
          <button
            type="button"
            disabled={startDisabled}
            onClick={() => {
              if (!startDisabled) {
                onStart(exam);
              }
            }}
            className={cn(
              "inline-flex h-11 min-w-[156px] items-center justify-center gap-2.5 rounded-[10px] px-5 text-[13px] font-bold transition",
              startDisabled
                ? "cursor-not-allowed bg-[#e9edf5] text-[#98a2b3]"
                : "bg-[#0758d9] text-white shadow-[0_2px_5px_rgba(7,88,217,0.16)] hover:bg-[#064fc2]"
            )}
          >
            {isStarting ? (
              <>
                <RefreshCcw className="size-4 animate-spin" />
                Đang mở...
              </>
            ) : (
              <>
                {participationLabel}
                <ArrowRight
                  className="size-4"
                  strokeWidth={2.2}
                />
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function ExamStatusBadge({
  exam,
}: {
  exam: OfficialExamListItem;
}) {
  if (["SUBMITTED", "EXPIRED", "PARTICIPATED"].includes(exam.participationStatus)) {
    return (
      <span className="inline-flex min-h-7 items-center gap-1.5 rounded-[7px] bg-[#edf8f0] px-2.5 text-[11px] font-semibold uppercase text-[#15803d]">
        <CheckCircle2
          className="size-3.5"
          strokeWidth={2}
        />
        Đã tham gia
      </span>
    );
  }

  if (exam.availability === "UPCOMING") {
    return (
      <span className="inline-flex min-h-7 items-center gap-1.5 rounded-[7px] bg-[#fff4e5] px-2.5 text-[12px] font-semibold uppercase text-[#b54708]">
        <span className="size-1.5 rounded-full bg-current" />
        Sắp diễn ra
      </span>
    );
  }

  if (exam.availability === "CLOSED") {
    return (
      <span className="inline-flex min-h-7 items-center gap-1.5 rounded-[7px] bg-[#f2f4f7] px-2.5 text-[12px] font-semibold uppercase text-[#667085]">
        <span className="size-1.5 rounded-full bg-current" />
        Đã đóng
      </span>
    );
  }

  if (exam.availability === "OPEN") {
    return (
      <span className="inline-flex min-h-7 items-center gap-1.5 rounded-[7px] bg-[#eaf2ff] px-2.5 text-[12px] font-semibold uppercase text-[#0758d9]">
        <span className="size-1.5 rounded-full bg-current" />
        Đang mở
      </span>
    );
  }

  return (
    <span className="inline-flex min-h-7 items-center gap-1.5 rounded-[7px] bg-[#f2f4f7] px-2.5 text-[12px] font-semibold uppercase text-[#667085]">
      <span className="size-1.5 rounded-full bg-current" />
      Chưa xác định
    </span>
  );
}

function InfoBox({
  icon,
  label,
  value,
  compactValue = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  compactValue?: boolean;
}) {
  return (
    <div className="flex min-h-[76px] items-center gap-3 rounded-[10px] bg-[#f2f4ff] px-4 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-white text-[#0758d9] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[14px] font-medium leading-[1.45] text-[#344054]">
          {label}
        </p>

        <p className={cn("mt-1.5 font-medium leading-[1.55] text-[#101828]", compactValue ? "text-[13px]" : "text-[14px]")}>
          {value}
        </p>
      </div>
    </div>
  );
}

function formatParticipationWindow(
  startedAt?: string,
  endedAt?: string
) {
  if (!startedAt && !endedAt) {
    return "Chưa có thông tin";
  }

  if (startedAt && endedAt) {
    return `${formatDateTime(
      startedAt
    )} – ${formatDateTime(endedAt)}`;
  }

  if (startedAt) {
    return `Từ ${formatDateTime(startedAt)}`;
  }

  return `Đến ${formatDateTime(
    endedAt!
  )}`;
}

function formatRemainingAttempts(
  remainingAttempts?: number | null
) {
  if (remainingAttempts === null) return "Không giới hạn";
  if (remainingAttempts === undefined) return "Chưa có thông tin";

  return `${remainingAttempts} lượt`;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).format(date);
}