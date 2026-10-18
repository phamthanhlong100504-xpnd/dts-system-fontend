"use client";

import {
  ArrowRight,
  CheckCircle2,
  History,
  Loader2,
  RotateCcw,
} from "lucide-react";

import type {
  ChapterLearningProgress,
} from "@/features/practice/chapter-overview-types";
import { cn } from "@/lib/utils";

interface ChapterOverviewCardProps {
  chapter: ChapterLearningProgress;

  onStart: (
    chapter: ChapterLearningProgress
  ) => void;

  onResume: (
    chapter: ChapterLearningProgress
  ) => void;

  onReview: (
    chapter: ChapterLearningProgress
  ) => void;

  pending?: boolean;
}

export function ChapterOverviewCard({
  chapter,
  onStart,
  onResume,
  onReview,
  pending = false,
}: ChapterOverviewCardProps) {
  const isNotStarted =
    chapter.status ===
    "NOT_STARTED";

  const isInProgress =
    chapter.status ===
    "IN_PROGRESS";

  const isCompleted =
    chapter.status ===
    "COMPLETED";

  const percent =
    Math.min(
      100,
      Math.max(
        0,
        chapter.completionPercent
      )
    );

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
      className="
        flex
        min-h-[238px]
        flex-col
        rounded-[18px]
        border
        border-[#e3e5ec]
        bg-white
        p-5
        shadow-[0_3px_12px_rgba(31,41,55,0.035)]
        transition
        hover:border-[#d7dce6]
        hover:shadow-[0_6px_18px_rgba(31,41,55,0.05)]
      "
    >
      <div>
        <span
          className="
            inline-flex
            min-h-7
            items-center
            rounded-[7px]
            bg-[#eaf0ff]
            px-3
            text-[11px]
            font-bold
            uppercase
            tracking-[0.03em]
            text-[#0758d9]
          "
        >
          CHƯƠNG{" "}
          {toRoman(
            chapter.order
          )}
        </span>
      </div>

      <h3
        className="
          mt-4
          line-clamp-2
          min-h-[46px]
          text-[16px]
          font-bold
          leading-[1.45]
          text-[#101828]
        "
      >
        {chapter.title}
      </h3>

      <div
        className="
          mt-4
          flex
          items-center
          justify-between
          gap-4
        "
      >
        {isNotStarted ? (
          <>
            <span
              className="
                text-[13px]
                font-medium
                text-[#475467]
              "
            >
              {chapter.totalQuestions} câu
            </span>

            <span
              className="
                text-[12px]
                font-medium
                text-[#98a2b3]
              "
            >
              Chưa bắt đầu
            </span>
          </>
        ) : (
          <>
            <span
              className="
                text-[13px]
                font-medium
                text-[#475467]
              "
            >
              <strong
                className="
                  font-semibold
                  text-[#27364f]
                "
              >
                {chapter.learnedQuestions}
                {" / "}
                {chapter.totalQuestions}
              </strong>
              {" "}
              câu đã học
            </span>

            {isCompleted ? (
              <span
                className="
                  inline-flex
                  shrink-0
                  items-center
                  gap-1.5
                  rounded-full
                  bg-[#e8efff]
                  px-2.5
                  py-1
                  text-[11px]
                  font-semibold
                  text-[#0758d9]
                "
              >
                <CheckCircle2
                  className="size-3.5"
                  strokeWidth={2.3}
                />

                Đã học hết câu
              </span>
            ) : (
              <span
                className="
                  shrink-0
                  text-[12.5px]
                  font-bold
                  text-[#0758d9]
                "
              >
                {Math.round(
                  percent
                )}
                %
              </span>
            )}
          </>
        )}
      </div>

      <div
        className="
          mt-3
          h-2
          overflow-hidden
          rounded-full
          bg-[#e8ebf5]
        "
      >
        <div
          className={cn(
            `
              h-full
              rounded-full
              transition-[width]
              duration-300
            `,
            isCompleted
              ? "bg-[#0758d9]"
              : "bg-[#2f6eea]"
          )}
          style={{
            width: `${percent}%`,
          }}
        />
      </div>

      <div
        className="
          mt-3
          min-h-6
        "
      >
        {isInProgress && (
          <div
            className="
              flex
              items-center
              gap-2
              text-[12px]
              font-medium
              text-[#667085]
            "
          >
            <History
              className="size-3.5"
              strokeWidth={1.9}
            />

            {chapter.lastQuestionId
              ? "Tiếp tục từ nội dung gần nhất"
              : "Tiếp tục ôn chương này"}
          </div>
        )}
      </div>

      <div className="flex-1" />

      <div
        className="
          mt-4
          flex
          justify-end
        "
      >
        <button
          type="button"
          disabled={pending}
          onClick={handleAction}
          className={cn(
            `
              inline-flex
              h-10
              min-w-[136px]
              items-center
              justify-center
              gap-2
              rounded-[10px]
              px-5
              text-[13px]
              font-semibold
              transition
              disabled:pointer-events-none
              disabled:opacity-60
            `,
            isCompleted
              ? `
                  bg-[#e5eaff]
                  text-[#0758d9]
                  hover:bg-[#dbe3ff]
                `
              : `
                  bg-[#0758d9]
                  text-white
                  hover:bg-[#064fc3]
                `
          )}
        >
          {pending ? (
            <>
              <Loader2
                className="
                  size-4
                  animate-spin
                "
              />

              Đang xử lý...
            </>
          ) : isCompleted ? (
            <>
              Ôn lại

              <RotateCcw
                className="size-4"
                strokeWidth={2}
              />
            </>
          ) : isInProgress ? (
            <>
              Tiếp tục ôn

              <ArrowRight
                className="size-4"
                strokeWidth={2}
              />
            </>
          ) : (
            <>
              Bắt đầu ôn

              <ArrowRight
                className="size-4"
                strokeWidth={2}
              />
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function toRoman(
  value: number
) {
  const romanMap: Array<
    [number, string]
  > = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let remaining =
    Math.max(
      1,
      Math.floor(value)
    );

  let result = "";

  for (const [
    number,
    symbol,
  ] of romanMap) {
    while (
      remaining >=
      number
    ) {
      result += symbol;
      remaining -= number;
    }
  }

  return result;
}