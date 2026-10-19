"use client";

import {
  ArrowRight,
  Clock3,
  FileText,
  RefreshCcw,
  Timer,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OfficialExamDetail } from "@/features/examination/official-exam-detail-types";
import { cn } from "@/lib/utils";

interface OfficialExamStartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  exam: OfficialExamDetail;

  onConfirm: () => void;
  isStarting?: boolean;
}

export function OfficialExamStartDialog({
  open,
  onOpenChange,
  exam,
  onConfirm,
  isStarting = false,
}: OfficialExamStartDialogProps) {
  const durationMinutes =
    exam.durationSeconds != null
      ? Math.round(
          exam.durationSeconds / 60
        )
      : undefined;

  function handleClose() {
    if (isStarting) {
      return;
    }

    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isStarting) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent
        showCloseButton={!isStarting}
        className="font-dts w-[520px] max-w-[calc(100vw-32px)] gap-0 rounded-[18px] border border-[#dedfea] bg-white p-0 shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:max-w-[520px]"
      >
        <div className="px-6 pb-7 pt-7 sm:px-8 sm:pt-8">
          <div className="text-center">
            <span className="mx-auto flex size-11 items-center justify-center rounded-[12px] bg-[#e8edff] text-[#0758d9]">
              <Timer
                className="size-5"
                strokeWidth={2}
              />
            </span>

            <DialogTitle className="mt-4 text-[22px] font-bold tracking-[-0.015em] text-[#101828]">
              {exam.canResume ? "Tiếp tục kỳ thi?" : "Bắt đầu kỳ thi?"}
            </DialogTitle>

            <DialogDescription className="mt-1.5 text-[14.5px] font-medium leading-6 text-[#344054]">
              {exam.canResume ? "Phiên đang làm sẽ được khôi phục, không tạo lượt mới." : "Sau khi bắt đầu, thời gian làm bài sẽ được tính."}
            </DialogDescription>
          </div>

          <div className="mt-5 rounded-[11px] bg-[#f0f1ff] p-4">
            <h3 className="text-[16px] font-bold leading-[1.5] text-[#101828]">
              {exam.title}
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {exam.questionsCount != null && (
                <ExamMeta
                  icon={
                    <FileText
                      className="size-3.5"
                      strokeWidth={1.9}
                    />
                  }
                >
                  {exam.questionsCount} câu
                </ExamMeta>
              )}

              {durationMinutes != null && (
                <ExamMeta
                  icon={
                    <Clock3
                      className="size-3.5"
                      strokeWidth={1.9}
                    />
                  }
                >
                  {durationMinutes} phút
                </ExamMeta>
              )}

              {exam.remainingAttempts !== undefined && (
                <ExamMeta
                  icon={
                    <RefreshCcw
                      className="size-3.5"
                      strokeWidth={1.9}
                    />
                  }
                  highlight
                >
                  {exam.remainingAttempts === null ? "Không giới hạn lượt" : `${exam.remainingAttempts} lượt thi còn lại`}
                </ExamMeta>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-[10px] bg-[#f0f1ff] px-4 py-4">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-[#0758d9]">
              <Clock3
                className="size-3.5"
                strokeWidth={2}
              />
            </span>

            <p className="text-[14.5px] font-medium leading-5 text-[#344054]">
              {durationMinutes != null
                ? `Bạn sẽ có ${durationMinutes} phút để hoàn thành bài thi sau khi bắt đầu.`
                : "Thời gian làm bài sẽ bắt đầu được tính ngay sau khi xác nhận."}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isStarting}
              onClick={handleClose}
              className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-[9px] border border-[#d9dee8] bg-white px-4 text-[14.5px] font-semibold text-[#475467] transition hover:bg-[#f8f9fb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Chưa bắt đầu
            </button>

            <button
              type="button"
              disabled={isStarting}
              onClick={onConfirm}
              className={cn(
                "inline-flex h-10 min-w-[116px] items-center justify-center gap-2 rounded-[9px] px-4 text-[14.5px] font-bold transition",
                isStarting
                  ? "cursor-not-allowed bg-[#aac7f5] text-white"
                  : "bg-[#0758d9] text-white shadow-[0_2px_5px_rgba(7,88,217,0.18)] hover:bg-[#064fc2]"
              )}
            >
              {isStarting ? (
                <>
                  <RefreshCcw className="size-3.5 animate-spin" />
                  Đang mở...
                </>
              ) : (
                <>
                  {exam.canResume ? "Tiếp tục thi" : "Bắt đầu thi"}
                  <ArrowRight
                    className="size-3.5"
                    strokeWidth={2.2}
                  />
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExamMeta({
  icon,
  children,
  highlight = false,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-[7px] bg-white px-2.5 text-[14.5px] font-semibold",
        highlight
          ? "text-[#087f8d]"
          : "text-[#344054]"
      )}
    >
      <span
        className={
          highlight
            ? "text-[#087f8d]"
            : "text-[#0758d9]"
        }
      >
        {icon}
      </span>

      {children}
    </span>
  );
}