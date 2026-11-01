"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Info,
  Loader2,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { MediaImage } from "@/components/ui/media-image";
import type {
  CriticalQuestionSessionAnswer,
  CriticalQuestionSessionMode,
  CriticalQuestionSessionQuestion,
} from "@/features/practice/critical-session-types";
import { cn } from "@/lib/utils";

interface CriticalQuestionCardProps {
  question: CriticalQuestionSessionQuestion;
  answer?: CriticalQuestionSessionAnswer;
  mode: CriticalQuestionSessionMode;
  currentPosition: number;
  totalQuestions: number;
  progressCount: number;
  completedSession: boolean;
  pendingAnswer: boolean;
  updatingBookmark: boolean;
  startingReview: boolean;
  onSelectAnswer: (selectedAnswer: string) => void;
  onToggleBookmark: () => void;
  onRestart: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
}

export function CriticalQuestionCard({
  question,
  answer,
  mode,
  currentPosition,
  totalQuestions,
  progressCount,
  completedSession,
  pendingAnswer,
  updatingBookmark,
  startingReview,
  onSelectAnswer,
  onToggleBookmark,
  onRestart,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}: CriticalQuestionCardProps) {
  const selectedAnswer = normalizeAnswer(
    answer?.selectedAnswer
  );

  const correctAnswer = normalizeAnswer(
    answer?.correctAnswer
  );

  const answered = Boolean(answer);

  const progressPercent =
    totalQuestions > 0
      ? Math.round(
          (progressCount / totalQuestions) * 100
        )
      : 0;

  const progressLabel =
    mode === "REVIEW"
      ? "Đã ôn"
      : "Đã học";

  return (
    <section className="font-dts rounded-[16px] border border-[#dedfea] bg-white px-7 pb-6 pt-6 shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-[#edf0f4] pb-5">
        <div className="flex justify-start">
          <span className="inline-flex h-8 items-center rounded-[8px] bg-[#eef3ff] px-3 text-[11.5px] font-bold text-[#0758d9]">
            CÂU {currentPosition} / {totalQuestions}
          </span>
        </div>

        <div className="flex justify-center">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[#fff7ed] px-3 text-[11.5px] font-semibold text-[#c56a00]">
            <ShieldAlert className="size-3.5" strokeWidth={2} />
            Câu điểm liệt
          </span>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={updatingBookmark}
            onClick={onToggleBookmark}
            aria-label={
              question.bookmarked
                ? "Bỏ đánh dấu câu hỏi"
                : "Đánh dấu câu hỏi"
            }
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-[10px] border transition disabled:pointer-events-none disabled:opacity-60",
              question.bookmarked
                ? "border-[#bfd0ff] bg-[#eef3ff] text-[#0758d9]"
                : "border-[#dce2ea] bg-white text-[#475467] hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
            )}
          >
            <Bookmark
              className="size-[18px]"
              fill={question.bookmarked ? "currentColor" : "none"}
              strokeWidth={1.9}
            />
          </button>
        </div>
      </div>

      <div className="py-7">
        <h2 className="max-w-[760px] text-[15.5px] font-semibold leading-[1.65] tracking-[-0.01em] text-[#101828]">
          {question.questionText}
        </h2>

        {(question.mediaFileId || question.imageUrl) && (
          <div className="mt-6 flex justify-center">
            <MediaImage
              src={question.mediaFileId ?? question.imageUrl ?? undefined}
              alt={`Hình minh họa câu ${currentPosition}`}
              className="max-h-[320px] max-w-full rounded-[12px] border border-[#e5e8ee] object-contain"
            />
          </div>
        )}

        <div className="mt-7 space-y-3">
          {question.options.map((option) => {
            const optionLabel = normalizeAnswer(option.label);

            const isSelected =
              selectedAnswer === optionLabel;

            const isCorrectOption =
              answered &&
              correctAnswer === optionLabel;

            const isWrongSelected =
              answered &&
              isSelected &&
              correctAnswer !== optionLabel;

            return (
              <button
                key={option.label}
                type="button"
                disabled={
                  answered ||
                  pendingAnswer ||
                  completedSession
                }
                onClick={() =>
                  onSelectAnswer(optionLabel)
                }
                className={cn(
                  "flex min-h-[64px] w-full items-center gap-4 rounded-[12px] border px-5 py-4 text-left transition disabled:cursor-default",
                  !answered &&
                    !completedSession &&
                    "border-[#e3e8f0] bg-[#fafbfc] hover:border-[#c7d5fa] hover:bg-[#f7f9ff]",
                  isCorrectOption &&
                    "border-[#a6e3c5] bg-[#f1fbf6]",
                  isWrongSelected &&
                    "border-[#f6c1bc] bg-[#fff6f5]",
                  answered &&
                    !isCorrectOption &&
                    !isWrongSelected &&
                    "border-[#edf0f4] bg-[#fafbfc] opacity-60"
                )}
              >

                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-[8px] border text-[12.5px] font-bold",
                    isCorrectOption
                      ? "border-[#a6e3c5] bg-[#effaf4] text-[#087443]"
                      : isWrongSelected
                        ? "border-[#f6c1bc] bg-[#fff1f0] text-[#b42318]"
                        : "border-[#dfe4ec] bg-[#f8f9fc] text-[#475467]"
                  )}
                >
                  {option.label}
                </span>

                <span
                  className={cn(
                    "flex-1 text-[14.5px] font-medium leading-6",
                    isCorrectOption &&
                      "text-[#087443]",
                    isWrongSelected &&
                      "text-[#b42318]",
                    !isCorrectOption &&
                      !isWrongSelected &&
                      "text-[#27364f]"
                  )}
                >
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>

        {answer && (
          <CriticalFeedback
            isCorrect={answer.isCorrect}
            explanation={answer.explanation}
          />
        )}
      </div>

      <div className="border-t border-[#edf0f4] pt-5">
        <div className="flex items-center justify-between gap-6">
          <button
            type="button"
            disabled={!canPrevious}
            onClick={onPrevious}
            className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-[10px] bg-[#f3f5fb] px-4 text-[13.5px] font-semibold text-[#344054] transition hover:bg-[#e9edf6] disabled:pointer-events-none disabled:opacity-40"
          >
            <ArrowLeft
              className="size-4"
              strokeWidth={2}
            />
            Câu trước
          </button>

          <div className="min-w-[190px] flex-1 text-center">
            <p className="text-[12.5px] font-medium text-[#475467]">
              {progressLabel}:{" "}
              <strong className="font-bold text-[#27364f]">
                {progressCount} / {totalQuestions}
              </strong>{" "}
              câu
            </p>

            <div className="mx-auto mt-2 h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-[#e5eaf3]">
              <div
                className="h-full rounded-full bg-[#0758d9] transition-[width]"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>
          </div>

          {completedSession ? (
            <button
              type="button"
              disabled={startingReview}
              onClick={onRestart}
              className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-[10px] bg-[#0758d9] px-4 text-[13.5px] font-semibold text-white transition hover:bg-[#064fc3] disabled:pointer-events-none disabled:opacity-60"
            >
              {startingReview ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RotateCcw
                  className="size-4"
                  strokeWidth={2}
                />
              )}

              Ôn lại
            </button>
          ) : (
            <button
              type="button"
              disabled={!canNext}
              onClick={onNext}
              className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-[10px] bg-[#0758d9] px-4 text-[13.5px] font-semibold text-white transition hover:bg-[#064fc3] disabled:pointer-events-none disabled:opacity-40"
            >
              Câu tiếp
              <ArrowRight
                className="size-4"
                strokeWidth={2}
              />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function CriticalFeedback({
  isCorrect,
  explanation,
}: {
  isCorrect: boolean;
  explanation?: string | null;
}) {
  const hasExplanation = Boolean(
    explanation?.trim()
  );

  return (
    <div
      className={cn(
        "mt-6 rounded-[12px] border px-5 py-5",
        isCorrect
          ? "border-[#ccebdc] bg-[#f4fbf7]"
          : "border-[#f3d0cd] bg-[#fff7f6]"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 text-[13.5px] font-semibold",
          isCorrect
            ? "text-[#087443]"
            : "text-[#b42318]"
        )}
      >
        {isCorrect ? (
          <CheckCircle2 className="size-4" />
        ) : (
          <XCircle className="size-4" />
        )}

        {isCorrect
          ? "Chính xác"
          : "Chưa chính xác"}
      </div>

      {hasExplanation && (
        <div className="mt-4">
          <h3 className="flex items-center gap-2 text-[13.5px] font-semibold text-[#27364f]">
            <Info className="size-4 text-[#0758d9]" />
            Giải thích
          </h3>

          <p className="mt-2 whitespace-pre-line pl-6 text-[14.5px] font-medium leading-[1.7] text-[#344054]">
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}

function normalizeAnswer(
  value?: string | null
) {
  return (
    value
      ?.trim()
      .toUpperCase() ??
    ""
  );
}