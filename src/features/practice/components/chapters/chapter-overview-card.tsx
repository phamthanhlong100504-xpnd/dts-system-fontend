"use client";

import {
  ArrowRight,
  CheckCircle2,
  History,
  Loader2,
  RotateCcw,
} from "lucide-react";

import type { ChapterLearningProgress } from "@/features/practice/chapter-overview-types";
import { cn } from "@/lib/utils";
import { learningStyles } from "@/features/simulations/components/learning-ui";

interface ChapterOverviewCardProps {
  chapter: ChapterLearningProgress;

  onStart: (chapter: ChapterLearningProgress) => void;

  onResume: (chapter: ChapterLearningProgress) => void;

  onReview: (chapter: ChapterLearningProgress) => void;

  pending?: boolean;
}

export function ChapterOverviewCard({
  chapter,
  onStart,
  onResume,
  onReview,
  pending = false,
}: ChapterOverviewCardProps) {
  const isInProgress = chapter.status === "IN_PROGRESS";

  const isCompleted = chapter.status === "COMPLETED";

  const percent = Math.min(100, Math.max(0, chapter.completionPercent));

  function handleAction() {
    if (isCompleted) {
      onReview(chapter);
      return;
    }

    if (isInProgress) {
      onResume(chapter);
      return;
    }

    onStart(chapter);
  }

  return (
    <article
      className={cn(
        learningStyles.card,
        "flex min-h-[238px] flex-col p-5 transition hover:border-[#d7dce6]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            learningStyles.badge,
            "rounded-[7px] px-3 py-1.5 font-bold uppercase tracking-[0.03em]",
          )}
        >
          CHƯƠNG {toRoman(chapter.order)}
        </span>
        <span className={learningStyles.badge}>
          {isCompleted ? (
            <>
              <CheckCircle2 className="size-3.5" />
              Đã học hết câu
            </>
          ) : isInProgress ? (
            "Đang học"
          ) : (
            "Chưa bắt đầu"
          )}
        </span>
      </div>
      <h3 className="mt-4 text-[18px] font-bold leading-[1.45] text-[#0b1427]">
        {chapter.title}
      </h3>
      <p className="mt-1 text-[15.5px] font-medium leading-5 text-[#475467]">
        {chapter.totalQuestions} câu
      </p>
      <div className="mt-4 flex items-center justify-between gap-3 text-[15.5px] font-medium text-[#344054]">
        <span>
          {chapter.learnedQuestions} / {chapter.totalQuestions} câu đã học
        </span>
        <strong className="text-[#0758d9]">{Math.round(percent)}%</strong>
      </div>
      <div
        role="progressbar"
        aria-label={`Tiến độ chương ${toRoman(chapter.order)}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className={cn(learningStyles.progressTrack, "mt-3")}
      >
        <div
          className={cn(
            learningStyles.progressFill,
            "transition-[width] duration-300",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {isInProgress && (
        <div className="mt-3 flex items-center gap-2 text-[14.5px] font-medium text-[#475467]">
          <History className="size-3.5" strokeWidth={1.9} />
          {chapter.lastQuestionId
            ? "Tiếp tục từ nội dung gần nhất"
            : "Tiếp tục ôn chương này"}
        </div>
      )}
      <div className="mt-auto flex justify-end pt-5">
        <button
          type="button"
          disabled={pending}
          onClick={handleAction}
          className={
            isCompleted ? learningStyles.secondary : learningStyles.primary
          }
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Đang xử lý...
            </>
          ) : isCompleted ? (
            <>
              Ôn lại
              <RotateCcw className="size-4" strokeWidth={2} />
            </>
          ) : (
            <>
              {isInProgress ? "Tiếp tục ôn" : "Bắt đầu ôn"}
              <ArrowRight className="size-4" strokeWidth={2} />
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function toRoman(value: number) {
  const romanMap: Array<[number, string]> = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let remaining = Math.max(1, Math.floor(value));

  let result = "";

  for (const [number, symbol] of romanMap) {
    while (remaining >= number) {
      result += symbol;
      remaining -= number;
    }
  }

  return result;
}
