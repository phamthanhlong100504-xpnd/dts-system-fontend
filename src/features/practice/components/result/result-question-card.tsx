"use client";

import { QuestionImage } from "@/components/ui/question-image";

import {
  AnswerOption,
  type AnswerOptionState,
} from "@/features/practice/components/question-session/answer-option";

import { ExplanationPanel } from "@/features/practice/components/question-session/explanation-panel";

import {
  type ExamAnswerResult,
  type QuestionOption,
} from "@/features/practice/practice-service";

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

  const isCorrect =
    answer.isCorrect === true;

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

          <span className="text-[14px] font-bold text-[#27364f]">
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
        {(answer.mediaFileId || answer.imageUrl) && (
          <QuestionImage
            src={answer.mediaFileId || answer.imageUrl}
            alt=""
            className="mt-4"
          />
        )}

        {/* Answers */}
        <div className="mt-5 space-y-3">
          {options.length === 0 && (
            <p className="text-[14.5px] font-medium text-[#475467]">
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

