"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";

import { MediaImage } from "@/components/ui/media-image";
import type {
  WrongQuestionSessionAnswer,
  WrongQuestionSessionQuestion,
} from "@/features/practice/wrong-question-session-types";
import { cn } from "@/lib/utils";

interface WrongQuestionCardProps {
  question: WrongQuestionSessionQuestion;
  answer?: WrongQuestionSessionAnswer;
  currentPosition: number;
  totalQuestions: number;
  answeredCount: number;
  bookmarked?: boolean;
  onSelectAnswer: (answer: string) => void;
  onToggleBookmark?: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
  pendingAnswer?: boolean;
}

export function WrongQuestionCard({
  question,
  answer,
  currentPosition,
  totalQuestions,
  answeredCount,
  bookmarked = false,
  onSelectAnswer,
  onToggleBookmark,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
  pendingAnswer = false,
}: WrongQuestionCardProps) {
  const answered = Boolean(answer);
  const selectedAnswer = answer?.selectedAnswer;
  const correctAnswer = normalizeAnswer(question.correctAnswer);

  const progressPercent =
    totalQuestions > 0
      ? Math.round((answeredCount / totalQuestions) * 100)
      : 0;

  return (
    <section className="font-dts rounded-[16px] border border-[#dedfea] bg-white px-7 pb-6 pt-6 shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-[#eef0f4] pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[7px] bg-[#eaf0ff] px-2.5 py-1.5 text-[11.5px] font-bold text-[#0758d9]">
            CÂU {currentPosition} / {totalQuestions}
          </span>

          {question.isCritical && (
            <span className="rounded-[7px] bg-[#fff4e8] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#c56a00]">
              Câu điểm liệt
            </span>
          )}
        </div>

        <span className="max-w-[310px] truncate rounded-[7px] bg-[#f1f3fa] px-3 py-1.5 text-[13.5px] font-medium text-[#475467]">
          {question.chapterTitle ?? `Chương ${question.chapterId}`}
        </span>

        <div className="flex justify-end">
          {onToggleBookmark && (
            <button
              type="button"
              onClick={onToggleBookmark}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-[10px] border px-4 text-[12.5px] font-semibold transition",
                bookmarked
                  ? "border-[#bfd0ff] bg-[#eef3ff] text-[#0758d9]"
                  : "border-[#e1e5ec] bg-white text-[#475467] hover:bg-[#f8f9fc]"
              )}
            >
              <Bookmark className="size-4" fill={bookmarked ? "currentColor" : "none"} strokeWidth={1.9} />
              {bookmarked ? "Đã đánh dấu" : "Đánh dấu câu này"}
            </button>
          )}
        </div>
      </div>

      <div className="py-6">
        <h2 className="max-w-[750px] text-[15.5px] font-bold leading-[1.55] tracking-[-0.015em] text-[#101828]">
          {question.questionText}
        </h2>

        {(question.mediaFileId || question.imageUrl) && (
          <div className="mt-5 flex justify-center">
            <MediaImage
              src={question.mediaFileId ?? question.imageUrl}
              alt={`Hình minh họa câu ${currentPosition}`}
              className="max-h-[300px] max-w-full rounded-[10px] border border-[#e5e8ee] object-contain"
            />
          </div>
        )}

        <div className="mt-6 space-y-3">
          {question.options.map((option) => {
            const optionLabel = normalizeAnswer(option.label);
            const isSelected = selectedAnswer === optionLabel;
            const isCorrectOption = answered && optionLabel === correctAnswer;
            const isWrongSelected = answered && isSelected && optionLabel !== correctAnswer;

            return (
              <button
                key={option.label}
                type="button"
                disabled={answered || pendingAnswer}
                onClick={() => onSelectAnswer(optionLabel)}
                className={cn(
                  "flex min-h-[64px] w-full items-center gap-3.5 rounded-[12px] border px-4 py-3.5 text-left transition",
                  !answered && "border-[#e3e3ee] bg-[#f5f4fb] hover:border-[#abc3ee] hover:bg-[#f1f4ff]",
                  answered && isCorrectOption && "border-[#18a566] bg-[#effaf4]",
                  answered && isWrongSelected && "border-[#e34848] bg-[#fff3f2]",
                  answered && !isCorrectOption && !isWrongSelected && "border-[#e5e6ed] bg-[#f6f6f8] opacity-60",
                  pendingAnswer && "pointer-events-none opacity-60"
                )}
              >

                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-[7px] border text-[13.5px] font-semibold",
                    !answered && "border-[#dde2ea] bg-[#eef0f5] text-[#344054]",
                    isCorrectOption && "border-[#abefc6] bg-[#ecfdf3] text-[#067647]",
                    isWrongSelected && "border-[#fecdca] bg-[#fef3f2] text-[#b42318]",
                    answered && !isCorrectOption && !isWrongSelected && "border-[#e4e7ec] bg-[#f2f4f7] text-[#98a2b3]"
                  )}
                >
                  {option.label}
                </span>

                <span
                  className={cn(
                    "flex-1 text-[14.5px] font-medium leading-6",
                    isCorrectOption && "text-[#05603a]",
                    isWrongSelected && "text-[#b42318]",
                    !isCorrectOption && !isWrongSelected && "text-[#344054]"
                  )}
                >
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>

        {answer && (
          <WrongQuestionFeedback
            isCorrect={answer.isCorrect}
            explanation={question.explanation}
          />
        )}
      </div>

      <div className="border-t border-[#eef0f4] pt-5">
        <div className="flex items-center justify-between gap-5">
          <button
            type="button"
            disabled={!canPrevious}
            onClick={onPrevious}
            className="inline-flex h-10 min-w-[118px] items-center justify-center gap-2 rounded-[9px] bg-[#f3f5fb] px-4 text-[13.5px] font-semibold text-[#344054] transition hover:bg-[#e9edf6] disabled:pointer-events-none disabled:opacity-40"
          >
            <ArrowLeft className="size-4" />
            Câu trước
          </button>

          <div className="min-w-[190px] text-center">
            <p className="text-[12.5px] font-medium text-[#475467]">
              Đã ôn:{" "}
              <strong className="font-bold text-[#0758d9]">
                {answeredCount}
              </strong>{" "}
              / {totalQuestions} câu
            </p>

            <div className="mx-auto mt-2 h-1.5 w-[140px] overflow-hidden rounded-full bg-[#e7eaf4]">
              <div
                className="h-full rounded-full bg-[#0758d9] transition-[width]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={!canNext}
            onClick={onNext}
            className="inline-flex h-10 min-w-[118px] items-center justify-center gap-2 rounded-[9px] bg-[#0758d9] px-4 text-[13.5px] font-semibold text-white transition hover:bg-[#064fc3] disabled:pointer-events-none disabled:opacity-40"
          >
            Câu tiếp
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function WrongQuestionFeedback({
  isCorrect,
  explanation,
}: {
  isCorrect: boolean;
  explanation?: string;
}) {
  const hasExplanation = Boolean(explanation?.trim());

  return (
    <div className="mt-5 rounded-[12px] border border-[#dfe4ff] bg-[#f4f5ff] px-5 py-5">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13.5px] font-semibold",
          isCorrect
            ? "bg-[#d1fadf] text-[#027a48]"
            : "bg-[#fee4e2] text-[#b42318]"
        )}
      >
        {isCorrect ? (
          <CheckCircle2 className="size-3.5" />
        ) : (
          <XCircle className="size-3.5" />
        )}

        {isCorrect ? "Chính xác" : "Chưa chính xác"}
      </span>

      {hasExplanation && (
        <div className="mt-4">
          <h3 className="flex items-center gap-2 text-[14.5px] font-bold text-[#101828]">
            <Info className="size-4 text-[#0758d9]" />
            Giải thích chi tiết
          </h3>

          <p className="mt-2.5 whitespace-pre-line pl-6 text-[14.5px] font-medium leading-[1.7] text-[#344054]">
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}

function normalizeAnswer(value?: string | null) {
  return value?.trim().toUpperCase() ?? "";
}