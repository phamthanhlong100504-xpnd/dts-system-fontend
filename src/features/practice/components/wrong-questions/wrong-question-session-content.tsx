"use client";

import { useMemo } from "react";

import { WrongQuestionCard } from "@/features/practice/components/wrong-questions/wrong-question-card";
import { WrongQuestionNavigator } from "@/features/practice/components/wrong-questions/wrong-question-navigator";
import { WrongQuestionSessionHeader } from "@/features/practice/components/wrong-questions/wrong-question-session-header";
import type { WrongQuestionReviewSession } from "@/features/practice/wrong-question-session-types";

interface WrongQuestionSessionContentProps {
  session: WrongQuestionReviewSession;
  pendingAnswer?: boolean;
  submitting?: boolean;
  bookmarkedQuestionIds?: number[];
  onExit: () => void;
  onSubmit: () => void;
  onPositionChange: (
    position: number
  ) => void;
  onSelectAnswer: (
    questionId: number,
    selectedAnswer: string
  ) => void;
  onToggleBookmark?: (
    questionId: number
  ) => void;
}

const EMPTY_BOOKMARKS: number[] = [];

export function WrongQuestionSessionContent({
  session,
  pendingAnswer = false,
  submitting = false,
  bookmarkedQuestionIds = EMPTY_BOOKMARKS,
  onExit,
  onSubmit,
  onPositionChange,
  onSelectAnswer,
  onToggleBookmark,
}: WrongQuestionSessionContentProps) {
  const totalQuestions =
    session.totalQuestions;

  const currentPosition =
    totalQuestions > 0
      ? Math.min(
          totalQuestions,
          Math.max(
            1,
            session.currentPosition
          )
        )
      : 1;

  const questionByPosition =
    useMemo(
      () =>
        new Map(
          session.questions.map(
            (question) => [
              question.position,
              question,
            ]
          )
        ),
      [session.questions]
    );

  const bookmarkedIds =
    useMemo(
      () =>
        new Set(
          bookmarkedQuestionIds
        ),
      [bookmarkedQuestionIds]
    );

  const currentQuestion =
    questionByPosition.get(
      currentPosition
    );

  const answeredCount =
    session.answeredQuestions;

  function goToPosition(
    position: number
  ) {
    if (
      position < 1 ||
      position > totalQuestions
    ) {
      return;
    }

    if (
      !questionByPosition.has(
        position
      )
    ) {
      return;
    }

    onPositionChange(position);
  }

  if (!currentQuestion) {
    return (
      <div className="font-dts min-h-screen bg-[#f7f6fb] text-[#101828]">
        <WrongQuestionSessionHeader
          licenseClass={
            session.licenseClass
          }
          currentPosition={0}
          totalQuestions={
            totalQuestions
          }
          submitting={
            submitting
          }
          onExit={onExit}
          onSubmit={onSubmit}
        />

        <main className="mx-auto w-full max-w-[1240px] px-6 py-[1.5cm]">
          <div className="rounded-[16px] border border-[#dedfea] bg-white px-8 py-12 text-center shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
            <h2 className="text-[18px] font-bold text-[#101828]">
              Không có câu hỏi để ôn
            </h2>

            <p className="mt-3 text-[14px] font-medium text-[#667085]">
              Phiên ôn hiện tại không có dữ liệu câu hỏi.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const currentAnswer =
    session.answers[
      String(
        currentQuestion.questionId
      )
    ];

  const currentBookmarked =
    bookmarkedIds.has(
      currentQuestion.questionId
    );

  return (
    <div className="font-dts min-h-screen bg-[#f7f6fb] text-[#101828]">
      <WrongQuestionSessionHeader
        licenseClass={
          session.licenseClass
        }
        currentPosition={
          currentPosition
        }
        totalQuestions={
          totalQuestions
        }
        submitting={
          submitting
        }
        onExit={onExit}
        onSubmit={onSubmit}
      />

      <main className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-start justify-center gap-7 px-6 pb-14 pt-[1.5cm] lg:grid-cols-[minmax(0,830px)_360px]">
        <WrongQuestionCard
          question={
            currentQuestion
          }
          answer={
            currentAnswer
          }
          currentPosition={
            currentPosition
          }
          totalQuestions={
            totalQuestions
          }
          answeredCount={
            answeredCount
          }
          bookmarked={
            currentBookmarked
          }
          pendingAnswer={
            pendingAnswer
          }
          onSelectAnswer={(
            selectedAnswer
          ) =>
            onSelectAnswer(
              currentQuestion.questionId,
              selectedAnswer
            )
          }
          onToggleBookmark={
            onToggleBookmark
              ? () =>
                  onToggleBookmark(
                    currentQuestion.questionId
                  )
              : undefined
          }
          canPrevious={
            currentPosition > 1
          }
          canNext={
            currentPosition <
            totalQuestions
          }
          onPrevious={() =>
            goToPosition(
              currentPosition - 1
            )
          }
          onNext={() =>
            goToPosition(
              currentPosition + 1
            )
          }
        />

        <div className="lg:sticky lg:top-7">
          <WrongQuestionNavigator
            questions={
              session.questions
            }
            answers={
              session.answers
            }
            currentPosition={
              currentPosition
            }
            totalQuestions={
              totalQuestions
            }
            onSelectQuestion={
              goToPosition
            }
          />
        </div>
      </main>
    </div>
  );
}