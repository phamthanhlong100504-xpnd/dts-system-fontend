"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface CriticalQuestionSessionHeaderProps {
  licenseClass: string;
  currentPosition: number;
  totalQuestions: number;
  onExit?: () => void;
}

export function CriticalQuestionSessionHeader({
  licenseClass,
  currentPosition,
  totalQuestions,
  onExit,
}: CriticalQuestionSessionHeaderProps) {
  const backClass =
    "inline-flex items-center gap-1.5 rounded-[7px] py-2 text-[13px] font-medium text-[#667085] transition hover:text-[#0758d9]";

  return (
    <header className="font-dts border-b border-[#e8ebf1] bg-white">
      <div className="relative flex min-h-[78px] w-full items-center px-5 lg:px-[1cm]">
        <div className="flex min-w-0 flex-1 justify-start">
          {onExit ? (
            <button type="button" onClick={onExit} className={backClass}>
              <ChevronLeft className="size-4" strokeWidth={2} />
              Quay lại Câu điểm liệt
            </button>
          ) : (
            <Link href="/practice/critical-questions" className={backClass}>
              <ChevronLeft className="size-4" strokeWidth={2} />
              Quay lại Câu điểm liệt
            </Link>
          )}
        </div>

        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2">
          <h1 className="whitespace-nowrap text-[15px] font-bold text-[#344054]">
            Câu điểm liệt
          </h1>

          <span className="whitespace-nowrap rounded-[6px] bg-[#eef2ff] px-2.5 py-1 text-[11px] font-semibold text-[#0758d9]">
            Hạng {licenseClass}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 justify-end">
          <span className="whitespace-nowrap text-[13px] font-semibold text-[#667085]">
            {currentPosition} / {totalQuestions} câu
          </span>
        </div>
      </div>
    </header>
  );
}