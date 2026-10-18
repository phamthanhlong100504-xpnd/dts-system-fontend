"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  RefreshCcw,
  Timer,
} from "lucide-react";

import { OfficialExamStartDialog } from "@/features/examination/components/official-exam-waiting-room/official-exam-start-dialog";
import { useOfficialExamDetail } from "@/features/examination/use-official-exam-detail";
import { cn } from "@/lib/utils";

interface OfficialExamWaitingRoomContentProps {
  examId: string;
  licenseClass: string;
  examVersionId?: string;
  onStart: (examVersionId?: string) => void;
  isStarting?: boolean;
}

export function OfficialExamWaitingRoomContent({
  examId,
  licenseClass,
  examVersionId,
  onStart,
  isStarting = false,
}: OfficialExamWaitingRoomContentProps) {
  const [startDialogOpen, setStartDialogOpen] =
    useState(false);

  const {
    data: exam,
    isLoading,
    isError,
    refetch,
  } = useOfficialExamDetail(
    examId,
    licenseClass,
    examVersionId
  );

  if (isLoading) {
    return <WaitingRoomSkeleton />;
  }

  if (isError || !exam) {
    return (
      <WaitingRoomError
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const durationMinutes =
    exam.durationSeconds != null
      ? Math.round(
          exam.durationSeconds / 60
        )
      : undefined;

  const actionLabel =
    exam.canResume
      ? "Tiếp tục thi"
      : "Bắt đầu thi";

  const disabled =
    (!exam.canStart && !exam.canResume) ||
    isStarting;

  function handleOpenStartDialog() {
    if (disabled) {
      return;
    }

    setStartDialogOpen(true);
  }

  const selectedExamVersionId = exam.examVersionId;

  function handleConfirmStart() {
    if (isStarting) {
      return;
    }

    onStart(selectedExamVersionId);
  }

  return (
    <>
      <div className="font-dts w-full pb-16 pt-7">
        <div className="px-5 lg:px-[1cm]">
        <Link
          href="/examination"
          className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#344054] transition hover:text-[#0758d9]"
        >
          <ArrowLeft
            className="size-4"
            strokeWidth={2}
          />
          Quay lại danh sách kỳ thi
        </Link>
        </div>

        <div className="mx-auto mt-6 w-full max-w-[1200px] px-5 sm:px-7">
        <article className="rounded-[18px] border border-[#dedfea] bg-white px-6 py-7 shadow-[0_4px_14px_rgba(31,41,55,0.055)] sm:px-9 sm:py-9">
          <div className="flex flex-wrap items-center gap-x-[0.8cm] gap-y-2">
            <span
              className={cn(
                "inline-flex min-h-7 items-center gap-1.5 rounded-[7px] px-2.5 text-[12px] font-bold uppercase",
                exam.canStart
                  ? "bg-[#dff6fb] text-[#087f8d]"
                  : "bg-[#f2f4f7] text-[#667085]"
              )}
            >
              <span className="size-1.5 rounded-full bg-current" />

              {exam.canStart || exam.canResume
                ? "Đang mở"
                : "Chưa thể tham gia"}
            </span>

            {exam.licenseClass && (
              <span className="inline-flex min-h-7 items-center rounded-[7px] bg-[#eef0ff] px-2.5 text-[12px] font-semibold text-[#475467]">
                Hạng {exam.licenseClass}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-[25px] font-bold leading-tight tracking-[-0.025em] text-[#101828]">
            {exam.title}
          </h1>

          <section className="mt-7 rounded-[14px] bg-[#f0f1ff] p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <ExamInfoItem
                icon={
                  <CalendarDays
                    className="size-4"
                    strokeWidth={1.9}
                  />
                }
                label="Thời gian bắt đầu"
                value={formatDateTime(
                  exam.startedAt
                )}
              />

              <ExamInfoItem
                icon={
                  <Clock3
                    className="size-4"
                    strokeWidth={1.9}
                  />
                }
                label="Thời gian kết thúc"
                value={formatDateTime(
                  exam.endedAt
                )}
              />

              <ExamInfoItem
                icon={
                  <Timer
                    className="size-4"
                    strokeWidth={1.9}
                  />
                }
                label="Thời gian làm bài"
                value={
                  durationMinutes != null
                    ? `${durationMinutes} phút`
                    : "Chưa có thông tin"
                }
              />

              <ExamInfoItem
                icon={
                  <FileText
                    className="size-4"
                    strokeWidth={1.9}
                  />
                }
                label="Số câu hỏi"
                value={
                  exam.questionsCount != null
                    ? `${exam.questionsCount} câu`
                    : "Chưa có thông tin"
                }
              />

              <div className="md:col-span-2">
                <ExamInfoItem
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
                  highlight
                />
              </div>
            </div>
          </section>

          <section className="mt-5">
            <div className="flex items-center gap-2">
              <Info
                className="size-4 text-[#0758d9]"
                strokeWidth={2}
              />

              <h2 className="text-[16px] font-bold text-[#101828]">
                Hướng dẫn kỳ thi
              </h2>
            </div>

            <div className="mt-4 space-y-3 rounded-[12px] bg-[#f0f1ff] px-5 py-5">
              {(exam.instructions?.trim() ? exam.instructions.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : ["Đọc kỹ câu hỏi trước khi chọn đáp án.", "Hoàn thành bài thi trong thời gian được quy định.", "Kiểm tra lại câu trả lời trước khi nộp bài."]).map((line, index) => <GuideItem key={index}>{line}</GuideItem>)}
            </div>
          </section>

          {!exam.canStart && !exam.canResume && <div role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">Kỳ thi hiện chưa thể bắt đầu.{exam.reasonCode ? " Vui lòng kiểm tra điều kiện tham gia hoặc thử lại sau." : ""}{exam.retryAvailableAt ? ` Thời điểm được thử lại: ${new Date(exam.retryAvailableAt).toLocaleString("vi-VN")}.` : ""}</div>}

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              disabled={disabled}
              onClick={handleOpenStartDialog}
              className={cn(
                "inline-flex h-11 min-w-[170px] items-center justify-center gap-2 rounded-[10px] px-6 text-[14px] font-bold transition",
                disabled
                  ? "cursor-not-allowed bg-[#e9edf5] text-[#98a2b3]"
                  : "bg-[#0758d9] text-white shadow-[0_2px_6px_rgba(7,88,217,0.18)] hover:bg-[#064fc2]"
              )}
            >
              {isStarting ? (
                <>
                  <RefreshCcw className="size-4 animate-spin" />
                  Đang chuẩn bị...
                </>
              ) : (
                <>
                  {actionLabel}

                  <ArrowRight
                    className="size-4"
                    strokeWidth={2.2}
                  />
                </>
              )}
            </button>
          </div>
        </article>
        </div>
      </div>

      <OfficialExamStartDialog
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
        exam={exam}
        onConfirm={handleConfirmStart}
        isStarting={isStarting}
      />
    </>
  );
}

function ExamInfoItem({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex min-h-[74px] items-center gap-3 rounded-[11px] bg-white px-4 py-3">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-[8px]",
          highlight
            ? "bg-[#dff6fb] text-[#087f8d]"
            : "bg-[#e8eaff] text-[#0758d9]"
        )}
      >
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[14px] font-medium leading-[1.5] text-[#344054]">
          {label}
        </p>

        <p
          className={cn(
            "mt-2 text-[15px] font-semibold leading-[1.5]",
            highlight
              ? "text-[#0758d9]"
              : "text-[#101828]"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function GuideItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#dce7ff] text-[#0758d9]">
        <CheckCircle2
          className="size-3"
          strokeWidth={2}
        />
      </span>

      <p className="text-[15px] font-medium leading-6 text-[#344054]">
        {children}
      </p>
    </div>
  );
}

function WaitingRoomSkeleton() {
  return (
    <div className="font-dts mx-auto w-full max-w-[1200px] px-5 pb-16 pt-8 sm:px-7">
      <div className="h-4 w-44 animate-pulse rounded bg-[#edf0f5]" />

      <div className="mt-6 rounded-[18px] border border-[#e7e9f0] bg-white px-7 py-7">
        <div className="h-6 w-36 animate-pulse rounded bg-[#edf0f5]" />

        <div className="mt-3 h-8 w-[420px] max-w-full animate-pulse rounded bg-[#edf0f5]" />

        <div className="mt-7 rounded-[14px] bg-[#f0f1ff] p-5 sm:p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-[74px] animate-pulse rounded-[9px] bg-white" />
            <div className="h-[74px] animate-pulse rounded-[9px] bg-white" />
            <div className="h-[74px] animate-pulse rounded-[9px] bg-white" />
            <div className="h-[74px] animate-pulse rounded-[9px] bg-white" />
            <div className="h-[74px] animate-pulse rounded-[9px] bg-white md:col-span-2" />
          </div>
        </div>

        <div className="mt-5 h-[105px] animate-pulse rounded-[12px] bg-[#f0f1ff]" />

        <div className="mx-auto mt-6 h-11 w-[150px] animate-pulse rounded-[10px] bg-[#edf0f5]" />
      </div>
    </div>
  );
}

function WaitingRoomError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="font-dts mx-auto w-full max-w-[1200px] px-5 pb-16 pt-8 sm:px-7">
      <section className="flex min-h-[300px] items-center justify-center rounded-[16px] border border-[#fecdca] bg-white px-8 py-10 text-center">
        <div className="max-w-[440px]">
          <span className="mx-auto flex size-12 items-center justify-center rounded-[12px] bg-[#fff1f0] text-[#d92d20]">
            <AlertCircle
              className="size-5"
              strokeWidth={1.9}
            />
          </span>

          <h2 className="mt-5 text-[18px] font-bold text-[#101828]">
            Không tải được thông tin kỳ thi
          </h2>

          <p className="mt-2 text-[14px] font-medium leading-6 text-[#667085]">
            Không thể lấy dữ liệu phòng chờ ở thời điểm hiện tại.
          </p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-[9px] bg-[#f2f4f7] px-5 text-[14px] font-semibold text-[#344054] transition hover:bg-[#e9edf3]"
          >
            <RefreshCcw className="size-4" />
            Thử lại
          </button>
        </div>
      </section>
    </div>
  );
}

function formatRemainingAttempts(
  remainingAttempts?: number | null
) {
  if (remainingAttempts === null) return "Không giới hạn";
  if (remainingAttempts === undefined) {
    return "Chưa có thông tin";
  }

  return `${remainingAttempts} lượt`;
}

function formatDateTime(
  value?: string
) {
  if (!value) {
    return "Chưa có thông tin";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const year =
    date.getFullYear();

  const hour =
    String(
      date.getHours()
    ).padStart(2, "0");

  const minute =
    String(
      date.getMinutes()
    ).padStart(2, "0");

  return `${day}/${month}/${year} · ${hour}:${minute}`;
}