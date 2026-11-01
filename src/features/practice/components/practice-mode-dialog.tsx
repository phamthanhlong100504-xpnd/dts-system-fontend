"use client";

import type { ReactNode } from "react";
import {
  ChevronRight,
  Clock3,
  FileQuestion,
  FileText,
  Lightbulb,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LicenseOption } from "@/config/license";
import type { ExamMode } from "@/features/practice/practice-service";
import { useStartExamAndGo } from "@/features/practice/use-practice";
import { cn } from "@/lib/utils";

interface PracticeModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: LicenseOption;

  onModeSelect?: (mode: ExamMode) => void;
  pending?: boolean;

  totalQuestions?: number;
  durationMinutes?: number;
}

export function PracticeModeDialog({
  open,
  onOpenChange,
  license,
  onModeSelect,
  pending = false,
  totalQuestions,
  durationMinutes,
}: PracticeModeDialogProps) {
  const startExamMutation =
    useStartExamAndGo();

  const isExternalStart =
    typeof onModeSelect === "function";

  const isPending =
    isExternalStart
      ? pending
      : startExamMutation.isPending;

  const hasBackendMetadata =
    totalQuestions != null &&
    durationMinutes != null;

  const isDisabled =
    isPending ||
    !hasBackendMetadata;

  function handleStart(mode: ExamMode) {
    if (isDisabled) {
      return;
    }

    if (onModeSelect) {
      onModeSelect(mode);
      return;
    }

    /**
     * Backend ExamMatrix là source of truth.
     * Không gửi totalQuestions/durationMinutes nữa.
     */
    startExamMutation.mutate({
      examType: license.code,
      mode,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="font-dts gap-0 overflow-hidden rounded-[18px] border border-[#e0e5ed] bg-white p-0 shadow-[0_24px_70px_rgba(15,23,42,0.22)] sm:max-w-[600px]">
        <div className="px-7 pb-7 pt-7">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-[22px] font-bold tracking-[-0.02em] text-[#101828]">
              Bạn muốn làm bài theo cách nào?
            </DialogTitle>

            <DialogDescription className="text-[14.5px] font-medium leading-6 text-[#475467]">
              Chọn chế độ phù hợp với mục tiêu hiện tại.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex flex-col gap-[27px]">
            <ModeOption
              icon={<FileText className="size-[20px]" />}
              title="Mô phỏng thi thật"
              badge="Giống trải nghiệm thi"
              badgeTone="blue"
              description="Không hiển thị đáp án trong lúc làm bài. Kết quả và giải thích được hiển thị sau khi bạn nộp bài."
              totalQuestions={totalQuestions}
              durationMinutes={durationMinutes}
              disabled={isDisabled}
              onClick={() => handleStart("EXAM")}
            />

            <ModeOption
              icon={<Lightbulb className="size-[20px]" />}
              title="Luyện tập có giải thích"
              badge="Phù hợp để học"
              badgeTone="blue"
              description="Biết đúng/sai và xem giải thích ngay sau khi trả lời từng câu."
              totalQuestions={totalQuestions}
              durationMinutes={durationMinutes}
              disabled={isDisabled}
              onClick={() => handleStart("PRACTICE")}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModeOption({
  icon,
  title,
  badge,
  badgeTone = "neutral",
  description,
  totalQuestions,
  durationMinutes,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  badge: string;
  badgeTone?: "neutral" | "blue";
  description: string;
  totalQuestions?: number;
  durationMinutes?: number;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex min-h-[132px] w-full items-center gap-4 rounded-[14px] border border-[#e0e5ed] bg-white px-5 py-5 text-left transition hover:border-[#86aaf0] hover:bg-[#f9fbff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/20 disabled:pointer-events-none disabled:opacity-60"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[11px] bg-[#edf3ff] text-[#0758d9]">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <h3 className="min-w-0 text-[17px] font-bold leading-6 text-[#101828]">
            {title}
          </h3>

          <span
            className={cn(
              "shrink-0 translate-x-[30px] rounded-[6px] px-2.5 py-1 text-[12.5px] font-semibold leading-none",
              badgeTone === "blue"
                ? "bg-[#edf3ff] text-[#0758d9]"
                : "bg-[#f2f4f7] text-[#475467]"
            )}
          >
            {badge}
          </span>
        </div>

        <p className="mt-2.5 max-w-[420px] text-[14.5px] font-medium leading-[22px] text-[#475467]">
          {description}
        </p>

        <div className="mt-3.5 flex items-center gap-5 text-[12.5px] font-medium text-[#98a2b3]">
          <span className="inline-flex items-center gap-1.5">
            <FileQuestion className="size-3.5" />

            {totalQuestions != null
              ? `${totalQuestions} câu`
              : "Chưa có số câu"}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" />

            {durationMinutes != null
              ? `${durationMinutes} phút`
              : "Chưa có thời gian"}
          </span>
        </div>
      </div>

      <ChevronRight className="ml-1 size-[18px] shrink-0 text-[#b4bdca] transition group-hover:translate-x-0.5 group-hover:text-[#0758d9]" />
    </button>
  );
}