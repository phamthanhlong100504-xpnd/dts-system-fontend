"use client";

import { useState } from "react";

import type {
  WrongQuestionSessionAnswer,
  WrongQuestionSessionQuestion,
} from "@/features/practice/wrong-question-session-types";
import { cn } from "@/lib/utils";

interface WrongQuestionNavigatorProps {
  questions: WrongQuestionSessionQuestion[];
  answers: Record<string, WrongQuestionSessionAnswer>;
  currentPosition: number;
  totalQuestions: number;
  onSelectQuestion: (position: number) => void;
}

interface ManualRangeSelection {
  rangeIndex: number;
  anchorPosition: number;
}

const RANGE_SIZE = 25;

export function WrongQuestionNavigator({
  questions,
  answers,
  currentPosition,
  totalQuestions,
  onSelectQuestion,
}: WrongQuestionNavigatorProps) {
  const currentRangeIndex = getRangeIndex(currentPosition);
  const [manualRange, setManualRange] = useState<ManualRangeSelection | null>(null);

  const requestedRangeIndex =
    manualRange?.anchorPosition === currentPosition
      ? manualRange.rangeIndex
      : currentRangeIndex;

  const rangeCount = Math.max(1, Math.ceil(totalQuestions / RANGE_SIZE));
  const activeRangeIndex = Math.min(rangeCount - 1, Math.max(0, requestedRangeIndex));

  const rangeStart = activeRangeIndex * RANGE_SIZE + 1;
  const rangeEnd = Math.min(totalQuestions, rangeStart + RANGE_SIZE - 1);

  const positions = Array.from(
    { length: Math.max(0, rangeEnd - rangeStart + 1) },
    (_, index) => rangeStart + index
  );

  const answeredCount = Object.keys(answers).length;

  const questionByPosition = new Map(
    questions.map((question) => [question.position, question])
  );

  return (
    <aside className="font-dts w-full rounded-[16px] border border-[#dedfea] bg-white px-5 py-[22px] shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-bold leading-none text-[#101828]">
            Danh sách câu hỏi
          </h2>

          <p className="mt-2.5 text-[12px] font-medium text-[#667085]">
            {answeredCount} / {totalQuestions} đã ôn
          </p>
        </div>

        <span className="inline-flex min-w-[54px] shrink-0 items-center justify-center rounded-full bg-[#eaf0ff] px-2.5 py-1.5 text-[11px] font-bold text-[#0758d9]">
          {currentPosition} / {totalQuestions}
        </span>
      </div>

      {rangeCount > 1 && (
        <div
          className="mt-5 grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${Math.min(rangeCount, 4)}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: rangeCount }).map((_, index) => {
            const from = index * RANGE_SIZE + 1;
            const to = Math.min(totalQuestions, from + RANGE_SIZE - 1);
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
                  "h-9 rounded-[8px] text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/20",
                  active
                    ? "bg-[#eef2ff] text-[#0758d9]"
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
          const isAnswered = question
            ? Boolean(answers[String(question.questionId)])
            : false;
          const isCritical = Boolean(question?.isCritical);

          return (
            <QuestionNumberButton
              key={position}
              position={position}
              current={isCurrent}
              answered={isAnswered}
              critical={isCritical}
              disabled={!question}
              onClick={() => onSelectQuestion(position)}
            />
          );
        })}
      </div>

      <div className="mt-5 border-t border-[#eef0f4] pt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
          <LegendItem tone="current" label="Đang ôn" />
          <LegendItem tone="answered" label="Đã ôn" />
          <LegendItem tone="unseen" label="Chưa ôn" />
          <LegendItem tone="critical" label="Câu điểm liệt" />
        </div>
      </div>
    </aside>
  );
}

function QuestionNumberButton({
  position,
  current,
  answered,
  critical,
  disabled,
  onClick,
}: {
  position: number;
  current: boolean;
  answered: boolean;
  critical: boolean;
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
        "relative flex size-[38px] items-center justify-center justify-self-center rounded-[9px] text-[11.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d9]/20 disabled:pointer-events-none disabled:opacity-40",
        current
          ? "bg-[#0758d9] text-white shadow-[0_2px_6px_rgba(7,88,217,0.28)]"
          : answered
            ? "bg-[#e9efff] text-[#0758d9] hover:bg-[#dfe8ff]"
            : "bg-[#f0f1f7] text-[#4f5d73] hover:bg-[#e9ebf3]"
      )}
    >
      {position}

      {answered && !current && (
        <span className="absolute bottom-[4px] left-1/2 size-[3px] -translate-x-1/2 rounded-full bg-[#0758d9]" />
      )}

      {critical && (
        <span
          className={cn(
            "absolute right-[3px] top-[3px] size-[5px] rounded-full",
            current ? "bg-[#ffd56a]" : "bg-[#f79009]"
          )}
        />
      )}
    </button>
  );
}

function LegendItem({
  tone,
  label,
}: {
  tone: "current" | "answered" | "unseen" | "critical";
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-[#667085]">
      <span
        className={cn(
          "size-[7px] rounded-[2px]",
          tone === "current" && "bg-[#0758d9]",
          tone === "answered" && "bg-[#b9ccff]",
          tone === "unseen" && "bg-[#f0f1f7]",
          tone === "critical" && "size-[5px] rounded-full bg-[#f79009]"
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