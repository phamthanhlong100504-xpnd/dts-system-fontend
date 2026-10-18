"use client";

import {
  BookOpen,
  CheckCircle2,
  Lightbulb,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface ExplanationPanelProps {
  isCorrect: boolean;
  selectedAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  memoryTip?: string;
  showStatusSummary?: boolean;
  showAnswerSummary?: boolean;
}

export function ExplanationPanel({
  isCorrect,
  selectedAnswer,
  correctAnswer,
  explanation,
  memoryTip,
  showStatusSummary = true,
  showAnswerSummary = true,
}: ExplanationPanelProps) {
  return (
    <div
      className="
        mt-5
        w-full
        rounded-[14px]
        border
        border-[#dfe3ef]
        bg-[#f3f4fb]
        px-5
        py-4
      "
    >
      {/* Status summary */}
      {showStatusSummary && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold",

              isCorrect
                ? "bg-[#dff7e9] text-[#087443]"
                : "bg-[#ffe3e1] text-[#b42318]"
            )}
          >
            {isCorrect ? (
              <CheckCircle2
                className="size-3.5"
                strokeWidth={2.4}
              />
            ) : (
              <XCircle
                className="size-3.5"
                strokeWidth={2.4}
              />
            )}

            {isCorrect
              ? "Chính xác"
              : "Chưa chính xác"}
          </div>

          {showAnswerSummary && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedAnswer &&
                !isCorrect && (
                  <span className="rounded-full bg-[#ffe5e3] px-2.5 py-1 text-[11px] font-semibold text-[#b42318]">
                    Bạn chọn:{" "}
                    {selectedAnswer}
                  </span>
                )}

              {correctAnswer && (
                <span className="rounded-full bg-[#dcf7e8] px-2.5 py-1 text-[11px] font-semibold text-[#087443]">
                  Đáp án đúng:{" "}
                  {correctAnswer}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Explanation */}
      <div
        className={
          showStatusSummary
            ? "mt-4"
            : ""
        }
      >
        <div className="flex items-center gap-2">
          <BookOpen
            className="size-4 shrink-0 text-[#0758d9]"
            strokeWidth={2.1}
          />

          <h3 className="text-[14px] font-bold text-[#27364f]">
            Giải thích chi tiết
          </h3>
        </div>

        <p className="mt-2.5 whitespace-pre-line text-[13.5px] font-medium leading-[1.7] text-[#475467]">
          {explanation?.trim()
            ? explanation
            : "Chưa có nội dung giải thích cho câu hỏi này."}
        </p>
      </div>

      {/* Optional memory tip */}
      {memoryTip?.trim() && (
        <div className="mt-4 rounded-[10px] border border-[#d6e1f5] bg-[#edf3ff] px-3.5 py-3">
          <div className="flex items-start gap-2">
            <Lightbulb
              className="mt-0.5 size-4 shrink-0 text-[#0758d9]"
              strokeWidth={2.1}
            />

            <p className="text-[12.5px] font-medium leading-5 text-[#3f4d63]">
              <span className="font-semibold text-[#0758d9]">
                Mẹo nhớ nhanh:
              </span>{" "}
              {memoryTip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}