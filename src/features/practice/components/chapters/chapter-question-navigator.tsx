
"use client";

import { useState } from "react";

import type { ChapterSessionQuestion } from "@/features/practice/chapter-session-types";
import { cn } from "@/lib/utils";

interface ChapterQuestionNavigatorProps {
  questions: ChapterSessionQuestion[];
  currentPosition: number;
  totalQuestions: number;
  onSelectQuestion: (position: number) => void;

  // Phân biệt lượt ôn lại với lượt học bình thường.
  isReviewMode?: boolean;
}

interface ManualRangeSelection {
  rangeIndex: number;
  anchorPosition: number;
}

const RANGE_SIZE = 25;

export function ChapterQuestionNavigator({
  questions,
  currentPosition,
  totalQuestions,
  onSelectQuestion,
  isReviewMode = false,
}: ChapterQuestionNavigatorProps) {
  const currentRangeIndex = getRangeIndex(currentPosition);

  const [manualRange, setManualRange] =
    useState<ManualRangeSelection | null>(null);

  const requestedRangeIndex =
    manualRange?.anchorPosition === currentPosition
      ? manualRange.rangeIndex
      : currentRangeIndex;

  const rangeCount = Math.max(
    1,
    Math.ceil(totalQuestions / RANGE_SIZE)
  );

  const activeRangeIndex = Math.min(
    rangeCount - 1,
    Math.max(0, requestedRangeIndex)
  );

  const rangeStart =
    activeRangeIndex * RANGE_SIZE + 1;

  const rangeEnd = Math.min(
    totalQuestions,
    rangeStart + RANGE_SIZE - 1
  );

  const positions = Array.from(
    {
      length: Math.max(
        0,
        rangeEnd - rangeStart + 1
      ),
    },
    (_, index) => rangeStart + index
  );

  const learnedCount = questions.filter(
    (question) => question.learned
  ).length;

  const questionByPosition = new Map(
    questions.map(
      (question) =>
        [question.position, question] as const
    )
  );

  return (
    <aside
      className="
        font-dts
        w-full
        rounded-[16px]
        border
        border-[#dedfea]
        bg-white
        px-5
        py-[22px]
        shadow-[0_4px_14px_rgba(31,41,55,0.055)]
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-bold leading-none text-[#101828]">
            Danh sách câu hỏi
          </h2>

          <p className="mt-2 text-[12.5px] font-medium text-[#475467]">
            {learnedCount}
            {" / "}
            {totalQuestions}
            {" "}
            {isReviewMode
              ? "câu đã ôn"
              : "câu đã học"}
          </p>
        </div>

        <span
          className="
            inline-flex
            min-w-[58px]
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-[#eaf1ff]
            px-2.5
            py-1.5
            text-[11.5px]
            font-semibold
            text-[#0758d9]
          "
        >
          {currentPosition}
          {" / "}
          {totalQuestions}
        </span>
      </div>

      {rangeCount > 1 && (
        <div
          className="mt-5 grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${Math.min(
              rangeCount,
              4
            )}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({
            length: rangeCount,
          }).map((_, index) => {
            const from =
              index * RANGE_SIZE + 1;

            const to = Math.min(
              totalQuestions,
              from + RANGE_SIZE - 1
            );

            const active =
              index === activeRangeIndex;

            return (
              <button
                key={from}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setManualRange({
                    rangeIndex: index,
                    anchorPosition:
                      currentPosition,
                  })
                }
                className={cn(
                  `
                    h-9
                    rounded-[9px]
                    text-[11.5px]
                    font-semibold
                    transition
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#0758d9]/20
                  `,
                  active
                    ? "bg-[#eef2ff] text-[#0758d9]"
                    : "bg-[#f3f4f8] text-[#475467] hover:bg-[#eaecf2] hover:text-[#344054]"
                )}
              >
                {from}–{to}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5 grid grid-cols-5 gap-2.5">
        {positions.map((position) => {
          const question =
            questionByPosition.get(position);

          const isCurrent =
            position === currentPosition;

          const isLearned =
            Boolean(question?.learned);

          const isCritical =
            Boolean(question?.isCritical);

          return (
            <QuestionNumberButton
              key={position}
              position={position}
              current={isCurrent}
              learned={isLearned}
              critical={isCritical}
              disabled={!question}
              onClick={() =>
                onSelectQuestion(position)
              }
            />
          );
        })}
      </div>

      <div className="mt-5 border-t border-[#e9eaf1] pt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
          <LegendItem
            tone="current"
            label="Đang học"
          />

          <LegendItem
            tone="learned"
            label={
              isReviewMode
                ? "Đã ôn"
                : "Đã học"
            }
          />

          <LegendItem
            tone="unseen"
            label={
              isReviewMode
                ? "Chưa ôn"
                : "Chưa học"
            }
          />

          <LegendItem
            tone="critical"
            label="Câu điểm liệt"
          />
        </div>
      </div>
    </aside>
  );
}

function QuestionNumberButton({
  position,
  current,
  learned,
  critical,
  disabled,
  onClick,
}: {
  position: number;
  current: boolean;
  learned: boolean;
  critical: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-current={
        current ? "step" : undefined
      }
      aria-label={`Câu ${position}`}
      onClick={onClick}
      className={cn(
        `
          relative
          flex
          size-[38px]
          items-center
          justify-center
          justify-self-center
          rounded-[9px]
          text-[12px]
          font-semibold
          transition
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[#0758d9]/20
          disabled:pointer-events-none
          disabled:opacity-40
        `,
        current
          ? "bg-[#0758d9] text-white shadow-[0_2px_6px_rgba(7,88,217,0.28)]"
          : learned
            ? "bg-[#e9efff] text-[#0758d9] hover:bg-[#dfe8ff]"
            : "bg-[#f0f1f7] text-[#4f5d73] hover:bg-[#e9ebf3]"
      )}
    >
      {position}

      {!current && learned && (
        <span
          aria-hidden="true"
          className="
            absolute
            bottom-1
            size-1
            rounded-full
            bg-[#0758d9]
          "
        />
      )}

      {critical && (
        <span
          aria-hidden="true"
          className="
            absolute
            right-1
            top-1
            size-1.5
            rounded-full
            bg-[#f79009]
          "
        />
      )}
    </button>
  );
}

function LegendItem({
  tone,
  label,
}: {
  tone:
    | "current"
    | "learned"
    | "unseen"
    | "critical";
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#475467]">
      <span
        className={cn(
          "size-[7px] rounded-[2px]",
          tone === "current" &&
            "bg-[#0758d9]",
          tone === "learned" &&
            "bg-[#b9ccff]",
          tone === "unseen" &&
            "border border-[#dfe4ec] bg-[#f8f9fc]",
          tone === "critical" &&
            "size-[6px] rounded-full bg-[#f79009]"
        )}
      />

      {label}
    </span>
  );
}

function getRangeIndex(position: number) {
  return Math.max(
    0,
    Math.floor(
      (Math.max(1, position) - 1) /
        RANGE_SIZE
    )
  );
}
