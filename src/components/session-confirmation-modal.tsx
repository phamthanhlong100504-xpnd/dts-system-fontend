"use client";

import { CheckSquare2, LogOut, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type SessionConfirmationVariant = "SUBMIT" | "EXIT";

interface SessionConfirmationModalProps {
  open: boolean;
  variant: SessionConfirmationVariant;
  onClose: () => void;
  onConfirm: () => void;
  answeredCount?: number;
  totalQuestions?: number;
  isPending?: boolean;
}

export function SessionConfirmationModal({
  open,
  variant,
  onClose,
  onConfirm,
  answeredCount = 0,
  totalQuestions = 0,
  isPending = false,
}: SessionConfirmationModalProps) {
  if (!open) return null;

  if (variant === "SUBMIT") {
    return (
      <SubmitConfirmation
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        isPending={isPending}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
  }

  return (
    <ExitConfirmation
      isPending={isPending}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function SubmitConfirmation({
  answeredCount,
  totalQuestions,
  isPending,
  onClose,
  onConfirm,
}: {
  answeredCount: number;
  totalQuestions: number;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const safeTotal = Math.max(0, totalQuestions);
  const safeAnswered = Math.min(Math.max(0, answeredCount), safeTotal);
  const unansweredCount = Math.max(0, safeTotal - safeAnswered);
  const progressPercent = safeTotal > 0 ? Math.round((safeAnswered / safeTotal) * 100) : 0;

  return (
    <ModalShell>
      <div className="relative w-full max-w-[520px] rounded-[18px] border border-[#e7e9f0] bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,0.20)]">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-md text-[#475467] transition hover:bg-[#f2f4f7] hover:text-[#344054] disabled:pointer-events-none disabled:opacity-50"
          aria-label="Đóng"
        >
          <X className="size-4" />
        </button>

        <div className="flex size-9 items-center justify-center rounded-[9px] bg-[#eef3ff] text-[#0758d9]">
          <CheckSquare2 className="size-[17px]" strokeWidth={2} />
        </div>

        <h2 className="mt-4 text-[21px] font-bold text-[#101828]">Nộp bài?</h2>

        <p className="mt-1 text-[14.5px] font-medium text-[#344054]">
          Kiểm tra lại tiến độ trước khi hoàn thành bài.
        </p>

        <p className="mt-4 text-[14.5px] font-semibold text-[#27364f]">
          Bạn đã trả lời {safeAnswered} / {safeTotal} câu.
        </p>

        <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-[#e7ebff]">
          <div
            className="h-full rounded-full bg-[#0758d9] transition-[width] duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {unansweredCount > 0 && (
          <div className="mt-4 rounded-[9px] border border-[#fedf89] bg-[#fffaeb] px-3 py-2.5">
            <div className="flex gap-2">
              <div className="mt-[1px] flex size-5 shrink-0 items-center justify-center rounded-full border border-[#f79009] text-[14.5px] font-bold text-[#dc6803]">
                !
              </div>

              <div>
                <p className="text-[14.5px] font-semibold text-[#b54708]">
                  Còn {unansweredCount} câu chưa trả lời
                </p>

                <p className="mt-0.5 text-[14.5px] font-medium leading-6 text-[#b54708]">
                  Bạn vẫn có thể quay lại và hoàn thành các câu này trước khi nộp bài.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex min-h-10 items-center justify-center rounded-[8px] border border-[#d0d5dd] bg-white px-4 text-[14.5px] font-semibold text-[#27364f] transition hover:bg-[#f9fafb] disabled:pointer-events-none disabled:opacity-50"
          >
            Tiếp tục làm
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex min-h-10 items-center justify-center rounded-[8px] bg-[#0758d9] px-4 text-[14.5px] font-semibold text-white transition hover:bg-[#064fc2] disabled:pointer-events-none disabled:opacity-60"
          >
            {isPending ? "Đang nộp..." : "Nộp bài"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ExitConfirmation({
  isPending,
  onClose,
  onConfirm,
}: {
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell>
      <div className="relative w-full max-w-[470px] rounded-[18px] border border-[#e7e9f0] bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,0.20)]">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-md text-[#475467] transition hover:bg-[#f2f4f7] hover:text-[#344054] disabled:pointer-events-none disabled:opacity-50"
          aria-label="Đóng"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-[#eef3ff] text-[#0758d9]">
            <LogOut className="size-[17px]" strokeWidth={2} />
          </div>

          <div className="pr-6">
            <h2 className="text-[19px] font-bold text-[#101828]">Thoát phiên làm bài?</h2>

            <p className="mt-1 text-[14.5px] font-medium leading-6 text-[#475467]">
              Bạn có chắc muốn rời khỏi phiên làm bài hiện tại?
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex min-h-10 items-center justify-center rounded-[8px] border border-[#d0d5dd] bg-white px-4 text-[14.5px] font-semibold text-[#344054] transition hover:bg-[#f9fafb] disabled:pointer-events-none disabled:opacity-50"
          >
            Thoát
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex min-h-10 items-center justify-center rounded-[8px] bg-[#0758d9] px-4 text-[14.5px] font-semibold text-white transition hover:bg-[#064fc2] disabled:pointer-events-none disabled:opacity-60"
          >
            Ở lại
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[120] flex items-center justify-center px-4",
        "bg-[#344054]/35 backdrop-blur-[2px]"
      )}
    >
      {children}
    </div>
  );
}