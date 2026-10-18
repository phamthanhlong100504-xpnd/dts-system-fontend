"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

interface CriticalNavigatorQuestion {
  questionId: number;
  position: number;
  answered: boolean;
}

interface CriticalQuestionNavigatorProps {
  questions: CriticalNavigatorQuestion[];
  currentPosition: number;
  totalQuestions: number;
  onSelectQuestion: (position: number) => void;
}

interface ManualRangeSelection {
  rangeIndex: number;
  anchorPosition: number;
}

const RANGE_SIZE = 25;

export function CriticalQuestionNavigator({
  questions,
  currentPosition,
  totalQuestions,
  onSelectQuestion,
}: CriticalQuestionNavigatorProps) {
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

  const rangeStart = activeRangeIndex * RANGE_SIZE + 1;
  const rangeEnd = Math.min(
    totalQuestions,
    rangeStart + RANGE_SIZE - 1
  );

  const positions = Array.from(
    { length: Math.max(0, rangeEnd - rangeStart + 1) },
    (_, index) => rangeStart + index
  );

  const answeredCount = questions.filter(
    (question) => question.answered
  ).length;

  const questionByPosition = new Map(
    questions.map((question) => [
      question.position,
      question,
    ])
  );

  return (
    <aside className="font-dts w-full rounded-[16px] border border-[#dedfea] bg-white px-6 py-6 shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-[#101828]">
            Danh sách câu hỏi
          </h2>

          <p className="mt-1 text-[12px] font-medium text-[#667085]">
            {answeredCount} / {totalQuestions} câu đã trả lời
          </p>
        </div>

        <span className="inline-flex min-w-[58px] items-center justify-center rounded-[8px] bg-[#eef3ff] px-2.5 py-1.5 text-[11px] font-bold text-[#0758d9]">
          {currentPosition} / {totalQuestions}
        </span>
      </div>

      {rangeCount > 1 && (
        <div
          className="mt-5 grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${Math.min(
              rangeCount,
              3
            )}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: rangeCount }).map((_, index) => {
            const from = index * RANGE_SIZE + 1;
            const to = Math.min(
              totalQuestions,
              from + RANGE_SIZE - 1
            );

            const active = index === activeRangeIndex;

            return (
              <button
                key={from}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setManualRange({
                    rangeIndex: index,
                    anchorPosition: currentPosition,
                  })
                }
                className={cn(
                  "h-9 rounded-[8px] text-[10.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/20",
                  active
                    ? "bg-[#eef3ff] text-[#0758d9]"
                    : "bg-[#f8f9fc] text-[#667085] hover:bg-[#f0f3fa] hover:text-[#344054]"
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
          const question = questionByPosition.get(position);
          const isCurrent = position === currentPosition;
          const isAnswered = Boolean(question?.answered);

          return (
            <QuestionNumberButton
              key={position}
              position={position}
              current={isCurrent}
              answered={isAnswered}
              disabled={!question}
              onClick={() => onSelectQuestion(position)}
            />
          );
        })}
      </div>

      <div className="mt-6 border-t border-[#eef0f4] pt-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <LegendItem tone="current" label="Đang làm" />
          <LegendItem tone="answered" label="Đã trả lời" />
          <LegendItem tone="unanswered" label="Chưa làm" />
        </div>
      </div>
    </aside>
  );
}

function QuestionNumberButton({
  position,
  current,
  answered,
  disabled,
  onClick,
}: {
  position: number;
  current: boolean;
  answered: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-current={current ? "step" : undefined}
      aria-label={`Câu ${position}`}
      onClick={onClick}
      className={cn(
        "flex size-[38px] items-center justify-center justify-self-center rounded-[9px] text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/20 disabled:pointer-events-none disabled:opacity-40",
        current
          ? "bg-[#e7efff] text-[#0758d9] ring-1 ring-[#9fbcff]"
          : answered
            ? "bg-[#eef3ff] text-[#0758d9] hover:bg-[#e6edff]"
            : "bg-[#f3f4f6] text-[#667085] hover:bg-[#eaecf0]"
      )}
    >
      {position}
    </button>
  );
}

function LegendItem({
  tone,
  label,
}: {
  tone: "current" | "answered" | "unanswered";
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-[#667085]">
      <span
        className={cn(
          "size-[7px] rounded-[2px]",
          tone === "current" && "bg-[#0758d9]",
          tone === "answered" && "bg-[#c9d8ff]",
          tone === "unanswered" && "bg-[#eceff3]"
        )}
      />

      {label}
    </span>
  );
}

function getRangeIndex(position: number) {
  return Math.max(
    0,
    Math.floor((Math.max(1, position) - 1) / RANGE_SIZE)
  );
}