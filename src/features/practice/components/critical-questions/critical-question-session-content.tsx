"use client";

import { useMemo } from "react";

import { CriticalQuestionCard } from "@/features/practice/components/critical-questions/critical-question-card";
import { CriticalQuestionNavigator } from "@/features/practice/components/critical-questions/critical-question-navigator";
import { CriticalQuestionSessionHeader } from "@/features/practice/components/critical-questions/critical-question-session-header";
import type { CriticalQuestionSession } from "@/features/practice/critical-session-types";

interface CriticalQuestionSessionContentProps {
  session: CriticalQuestionSession;
  pendingAnswer: boolean;
  updatingBookmark: boolean;
  startingReview: boolean;
  onExit: () => void;
  onPositionChange: (position: number) => void;
  onSelectAnswer: (questionId: number, selectedAnswer: string) => void;
  onToggleBookmark: (questionId: number) => void;
  onReviewAgain: () => void;
}

export function CriticalQuestionSessionContent({
  session,
  pendingAnswer,
  updatingBookmark,
  startingReview,
  onExit,
  onPositionChange,
  onSelectAnswer,
  onToggleBookmark,
  onReviewAgain,
}: CriticalQuestionSessionContentProps) {
  const currentQuestion =
    session.questions.find(
      (question) => question.questionId === session.currentQuestionId
    ) ??
    session.questions.find(
      (question) => question.position === session.currentPosition
    ) ??
    session.questions[0];

  const currentAnswer = currentQuestion
    ? session.answers[String(currentQuestion.questionId)]
    : undefined;

  const progressCount = Math.min(
    session.totalQuestions,
    Math.max(0, session.answeredQuestions)
  );

  const navigatorQuestions = useMemo(
    () =>
      session.questions.map((question) => {
        const answeredInCurrentSession = Boolean(
          session.answers[String(question.questionId)]
        );

        return {
          questionId: question.questionId,
          position: question.position,
          answered:
            session.mode === "REVIEW"
              ? answeredInCurrentSession
              : question.learnedBeforeSession || answeredInCurrentSession,
        };
      }),
    [session.answers, session.mode, session.questions]
  );

  if (!currentQuestion) {
    return null;
  }

  const canNavigate = session.status === "IN_PROGRESS";

  return (
    <div className="font-dts min-h-screen bg-[#f7f6fb] text-[#101828]">
      <CriticalQuestionSessionHeader
        licenseClass={session.licenseClass}
        currentPosition={session.currentPosition}
        totalQuestions={session.totalQuestions}
        onExit={onExit}
      />

      <main className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-start gap-7 px-6 pb-14 pt-[1.5cm] lg:grid-cols-[minmax(0,830px)_360px]">
        <CriticalQuestionCard
          question={currentQuestion}
          answer={currentAnswer}
          mode={session.mode}
          currentPosition={currentQuestion.position}
          totalQuestions={session.totalQuestions}
          progressCount={progressCount}
          completedSession={session.status === "COMPLETED"}
          pendingAnswer={pendingAnswer}
          updatingBookmark={updatingBookmark}
          startingReview={startingReview}
          onSelectAnswer={(selectedAnswer) =>
            onSelectAnswer(currentQuestion.questionId, selectedAnswer)
          }
          onToggleBookmark={() =>
            onToggleBookmark(currentQuestion.questionId)
          }
          onRestart={onReviewAgain}
          canPrevious={
            canNavigate &&
            currentQuestion.position > 1
          }
          canNext={
            canNavigate &&
            currentQuestion.position < session.totalQuestions
          }
          onPrevious={() =>
            onPositionChange(currentQuestion.position - 1)
          }
          onNext={() =>
            onPositionChange(currentQuestion.position + 1)
          }
        />

        <div className="w-full lg:sticky lg:top-7">
          <CriticalQuestionNavigator
            questions={navigatorQuestions}
            currentPosition={session.currentPosition}
            totalQuestions={session.totalQuestions}
            onSelectQuestion={(position) => {
              if (canNavigate) {
                onPositionChange(position);
              }
            }}
          />
        </div>
      </main>
    </div>
  );
}