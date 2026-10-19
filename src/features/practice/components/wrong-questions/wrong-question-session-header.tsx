"use client";

import { ArrowLeft } from "lucide-react";

interface WrongQuestionSessionHeaderProps {
  licenseClass: string;
  currentPosition: number;
  totalQuestions: number;
  submitting?: boolean;
  onExit: () => void;
  onSubmit: () => void;
}

export function WrongQuestionSessionHeader({
  licenseClass,
  currentPosition,
  totalQuestions,
  submitting = false,
  onExit,
  onSubmit,
}: WrongQuestionSessionHeaderProps) {
  return (
    <header className="font-dts border-b border-[#e8ebf1] bg-white">
      <div className="grid min-h-[78px] w-full grid-cols-[1fr_minmax(340px,520px)_1fr] items-center gap-6 px-5 lg:px-[1cm]">
        <div className="flex justify-start">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-[8px] py-2 text-[13.5px] font-medium text-[#475467] transition hover:text-[#0758d9]"
          >
            <ArrowLeft className="size-4" strokeWidth={2} />
            Thoát
          </button>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-2.5 text-center">
          <h1 className="truncate text-[15.5px] font-bold text-[#27364f]">
            Ôn lại câu đã sai
          </h1>

          <span className="shrink-0 rounded-[7px] bg-[#eef2ff] px-2.5 py-1 text-[13.5px] font-semibold text-[#0758d9]">
            Hạng {licenseClass}
          </span>
        </div>

        <div className="flex items-center justify-end gap-5">
          <span className="whitespace-nowrap text-[13.5px] font-semibold text-[#475467]">
            {currentPosition} / {totalQuestions} câu
          </span>

          <button
            type="button"
            disabled={submitting}
            onClick={onSubmit}
            className="inline-flex h-10 min-w-[92px] items-center justify-center rounded-[10px] bg-[#0758d9] px-5 text-[13.5px] font-semibold text-white transition hover:bg-[#064fc3] disabled:pointer-events-none disabled:opacity-60"
          >
            {submitting ? "Đang nộp..." : "Nộp bài"}
          </button>
        </div>
      </div>
    </header>
  );
}