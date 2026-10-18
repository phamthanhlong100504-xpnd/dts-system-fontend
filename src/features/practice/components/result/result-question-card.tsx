"use client";

import {
  AlertTriangle,
  CheckCircle2,
  MinusCircle,
  XCircle,
} from "lucide-react";

import { MediaImage } from "@/components/ui/media-image";

import {
  AnswerOption,
  type AnswerOptionState,
} from "@/features/practice/components/question-session/answer-option";

import { ExplanationPanel } from "@/features/practice/components/question-session/explanation-panel";

import {
  type ExamAnswerResult,
  type QuestionOption,
} from "@/features/practice/practice-service";

import { cn } from "@/lib/utils";

const OPTION_LABELS = [
  "A",
  "B",
  "C",
  "D",
];

interface OptionView {
  label: string;
  text: string;
}

interface ResultQuestionCardProps {
  answer: ExamAnswerResult;
  index: number;
  totalQuestions: number;
}

function normalizeOptions(
  raw: ExamAnswerResult["options"]
): OptionView[] {
  const options =
    Array.isArray(raw)
      ? (raw as unknown[])
      : [];

  return options.map(
    (option, index) => {
      if (
        typeof option ===
        "string"
      ) {
        return {
          label:
            OPTION_LABELS[index] ??
            String.fromCharCode(
              65 + index
            ),

          text: option,
        };
      }

      const item =
        option as QuestionOption;

      return {
        label:
          item.label ??
          OPTION_LABELS[index] ??
          String.fromCharCode(
            65 + index
          ),

        text:
          item.text ?? "",
      };
    }
  );
}

export function ResultQuestionCard({
  answer,
  index,
  totalQuestions,
}: ResultQuestionCardProps) {
  const options =
    normalizeOptions(
      answer.options
    );

  const selectedAnswer =
    answer.selectedAnswer ?? "";

  const correctAnswer =
    answer.correctAnswer ?? "";

  const isSkipped =
    !selectedAnswer;

  const isCorrect =
    answer.isCorrect === true;

  const isCritical =
    answer.isCritical === true;

  return (
    <article
      className="
        overflow-hidden
        rounded-[16px]
        border
        border-[#dfe2ea]
        bg-white
        shadow-[0_4px_14px_rgba(31,41,55,0.045)]
      "
    >
      <div className="px-6 pb-6 pt-5">
        {/* Question meta */}
        <div className="flex flex-wrap items-center gap-2.5">
          <QuestionStatusBadge
            isCorrect={isCorrect}
            isSkipped={isSkipped}
          />

          {isCritical && (
            <span
              className="
                inline-flex
                items-center
                gap-1
                rounded-[6px]
                bg-[#eef1ff]
                px-2.5
                py-1
                text-[10.5px]
                font-bold
                uppercase
                text-[#0758d9]
              "
            >
              <AlertTriangle
                className="size-3"
                strokeWidth={2.2}
              />

              Câu điểm liệt
            </span>
          )}

          <span className="text-[12px] font-bold text-[#27364f]">
            Câu {index + 1} /{" "}
            {totalQuestions}
          </span>
        </div>

        {/* Question */}
        <h3
          className="
            mt-4
            text-[17px]
            font-bold
            leading-[1.6]
            text-[#101828]
          "
        >
          {answer.questionText}
        </h3>

        {/* Image */}
        {answer.imageUrl && (
          <MediaImage
            src={answer.imageUrl}
            alt=""
            className="
              mt-4
              max-h-[260px]
              rounded-[12px]
              border
              border-[#e0e3eb]
            "
          />
        )}

        {/* Answers */}
        <div className="mt-5 space-y-3">
          {options.length === 0 && (
            <p className="text-[14px] font-medium text-[#667085]">
              Câu hỏi này chưa có đáp án.
            </p>
          )}

          {options.map((option) => {
            const isCorrectOption =
              option.label ===
              correctAnswer;

            const isUserChoice =
              option.label ===
              selectedAnswer;

            let state: AnswerOptionState =
              "neutral";

            if (isCorrectOption) {
              state =
                "correct";
            } else if (
              isUserChoice &&
              !isCorrectOption
            ) {
              state =
                "wrong";
            }

            return (
              <AnswerOption
                key={option.label}
                label={option.label}
                text={option.text}
                state={state}
                disabled
                showFeedbackBadge={false}
                subtleStatusIndicator
              />
            );
          })}
        </div>

        {/* Explanation */}
        <ExplanationPanel
          isCorrect={isCorrect}
          selectedAnswer={
            selectedAnswer ||
            undefined
          }
          correctAnswer={
            correctAnswer ||
            undefined
          }
          explanation={
            answer.explanation
          }
          showStatusSummary={false}
          showAnswerSummary={false}
        />
      </div>
    </article>
  );
}

function QuestionStatusBadge({
  isCorrect,
  isSkipped,
}: {
  isCorrect: boolean;
  isSkipped: boolean;
}) {
  if (isSkipped) {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1
          rounded-[6px]
          bg-[#f0f1f5]
          px-2.5
          py-1
          text-[10.5px]
          font-bold
          uppercase
          text-[#667085]
        "
      >
        <MinusCircle
          className="size-3"
          strokeWidth={2.2}
        />

        Chưa trả lời
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1 text-[10.5px] font-bold uppercase",

        isCorrect
          ? "bg-[#dcf7e8] text-[#087443]"
          : "bg-[#ffe2df] text-[#b42318]"
      )}
    >
      {isCorrect ? (
        <CheckCircle2
          className="size-3"
          strokeWidth={2.3}
        />
      ) : (
        <XCircle
          className="size-3"
          strokeWidth={2.3}
        />
      )}

      {isCorrect
        ? "Câu đúng"
        : "Câu sai"}
    </span>
  );
}