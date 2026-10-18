"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import { MediaImage } from "@/components/ui/media-image";
import { ChapterQuestionNavigator } from "@/features/practice/components/chapters/chapter-question-navigator";
import { ChapterSelectorDrawer } from "@/features/practice/components/chapters/chapter-selector-drawer";
import { ChapterSessionHeader } from "@/features/practice/components/chapters/chapter-session-header";
import type { ChapterSessionQuestion } from "@/features/practice/chapter-session-types";
import type {
  Question,
  QuestionOption,
} from "@/features/practice/practice-service";
import {
  useChapterBookmarks,
  useChapterLearnedAnswers,
  useRecordChapterAnswer,
  useSaveChapterCursor,
  useSetChapterBookmark,
} from "@/features/practice/use-chapter-session";
import { useChapterLearningOverview } from "@/features/practice/use-chapter-overview";
import {
  useActiveChapterReviewSession,
  useFinishChapterReviewSession,
  useRecordChapterReviewAnswer,
  useSaveChapterReviewCursor,
} from "@/features/practice/use-chapter-review-session";
import { cn } from "@/lib/utils";
interface ChapterSessionContentProps {
  licenseClass: string;
  chapterId: number;
  chapterTitle: string;
  questions: Question[];
  onChangeChapter: (chapterId: number) => void;
}
interface NormalizedOption {
  label: string;
  text: string;
}

const OPTION_LABELS = ["A", "B", "C", "D"];
export function ChapterSessionContent({
  licenseClass,
  chapterId,
  chapterTitle,
  questions,
  onChangeChapter,
}: ChapterSessionContentProps) {
  const [chapterDrawerOpen, setChapterDrawerOpen] = useState(false);
  const [positionByScope, setPositionByScope] = useState<
    Record<string, number>
  >({});

  const [normalStartedByScope, setNormalStartedByScope] = useState<
    Record<string, boolean>
  >({});
  const lastSavedCursorRef = useRef("");
  const normalizedLicense = licenseClass.trim().toUpperCase();
  const initializationScope = `${normalizedLicense}:${chapterId}`;
  const overviewQuery = useChapterLearningOverview(normalizedLicense);
  const learnedAnswersQuery = useChapterLearnedAnswers(
    chapterId,
    normalizedLicense
  );
  const bookmarksQuery = useChapterBookmarks(
    chapterId,
    normalizedLicense
  );
  const {
    mutate: recordAnswer,
    isPending: isRecordingAnswer,
  } = useRecordChapterAnswer();
  const { mutate: saveCursor } = useSaveChapterCursor();
  const {
    mutate: setBookmark,
    isPending: isBookmarkPending,
  } = useSetChapterBookmark();
  const answerByQuestion = useMemo(() => {
    const learnedAnswers = learnedAnswersQuery.data ?? [];
    return new Map(
      learnedAnswers.map(
        (answer) => [answer.questionId, answer] as const
      )
    );
  }, [learnedAnswersQuery.data]);
  const bookmarkedIds = useMemo(() => {
    return new Set(
      bookmarksQuery.data?.questionIds ?? []
    );
  }, [bookmarksQuery.data?.questionIds]);
  const chapterOverview = overviewQuery.data?.chapters.find(
    (chapter) => chapter.chapterId === chapterId
  );

  const isReviewMode =
    chapterOverview?.status === "COMPLETED" &&
    !normalStartedByScope[initializationScope];

  const reviewQuery = useActiveChapterReviewSession(
    chapterId,
    normalizedLicense,
    isReviewMode
  );
  const reviewSession = isReviewMode ? reviewQuery.data : undefined;
  const reviewAnswerMutation = useRecordChapterReviewAnswer(
    normalizedLicense,
    chapterId
  );
  const reviewCursorMutation = useSaveChapterReviewCursor(
    normalizedLicense,
    chapterId
  );
  const finishReviewMutation = useFinishChapterReviewSession(
    normalizedLicense,
    chapterId
  );

  const sessionQuestions = useMemo<ChapterSessionQuestion[]>(() => {
    if (isReviewMode) {
      if (!reviewSession) return [];
      return [...reviewSession.questions]
        .sort((a, b) => a.position - b.position)
        .map((question) => {
          const answer = reviewSession.answers[String(question.questionId)];
          const answered = Boolean(answer);
          return {
            id: question.questionId,
            chapter: chapterId,
            questionText: question.questionText,
            options: question.options,
            position: question.position,
            isCritical: question.isCritical,
            imageUrl: question.imageUrl ?? undefined,
            mediaFileId: question.mediaFileId ?? undefined,
            correctAnswer: answer?.correctAnswer,
            explanation: answer?.explanation,
            bookmarked: bookmarkedIds.has(question.questionId),
            learned: answered,
            selectedAnswer: answer?.selectedAnswer,
            answered,
            isCorrect: answer?.isCorrect,
          };
        });
    }
    return questions.flatMap((question, index) => {
      if (
        question.id == null ||
        !question.questionText ||
        !Array.isArray(question.options)
      ) {
        return [];
      }
      const learnedAnswer = answerByQuestion.get(question.id);
      const answered = Boolean(learnedAnswer);
      return [{
        ...question,
        id: question.id,
        chapter: question.chapter ?? chapterId,
        questionText: question.questionText,
        options: question.options,
        position: index + 1,
        learned: answered,
        bookmarked: bookmarkedIds.has(question.id),
        selectedAnswer: learnedAnswer?.selectedAnswer,
        answered,
        isCorrect: learnedAnswer?.isCorrect,
      }];
    });
  }, [
    answerByQuestion,
    bookmarkedIds,
    chapterId,
    isReviewMode,
    questions,
    reviewSession,
  ]);
  const totalQuestions = sessionQuestions.length;

  const resumePosition = useMemo(() => {
    if (sessionQuestions.length === 0) return 1;
    if (isReviewMode && reviewSession) {
      const savedIndex = sessionQuestions.findIndex(
        (question) => question.id === reviewSession.currentQuestionId
      );
      if (savedIndex >= 0) return savedIndex + 1;
      if (
        reviewSession.currentPosition >= 1 &&
        reviewSession.currentPosition <= sessionQuestions.length
      ) {
        return reviewSession.currentPosition;
      }
      return 1;
    }
    for (const questionId of [
      chapterOverview?.lastQuestionId,
      chapterOverview?.resumeQuestionId,
    ]) {
      if (questionId == null) continue;
      const index = sessionQuestions.findIndex(
        (question) => question.id === questionId
      );
      if (index >= 0) return index + 1;
    }
    return 1;
  }, [
    chapterOverview?.lastQuestionId,
    chapterOverview?.resumeQuestionId,
    isReviewMode,
    reviewSession,
    sessionQuestions,
  ]);
  const currentPosition =
    totalQuestions > 0
      ? Math.min(
          totalQuestions,
          Math.max(
            1,
            positionByScope[initializationScope] ?? resumePosition
          )
        )
      : 1;
  const currentIndex = currentPosition - 1;
  const currentQuestion = sessionQuestions[currentIndex];
  const currentQuestionId = currentQuestion?.id;

  useEffect(() => {
    if (
      isReviewMode ||
      overviewQuery.isLoading ||
      overviewQuery.isFetching ||
      overviewQuery.isError ||
      learnedAnswersQuery.isLoading ||
      learnedAnswersQuery.isError ||
      currentQuestionId == null
    ) {
      return;
    }
    const cursorKey = `${initializationScope}:${currentQuestionId}`;
    if (lastSavedCursorRef.current === cursorKey) {
      return;
    }
    lastSavedCursorRef.current = cursorKey;
    saveCursor({
      chapterId,
      licenseClass: normalizedLicense,
      questionId: currentQuestionId,
    });
  }, [
    chapterId,
    currentQuestionId,
    initializationScope,
    isReviewMode,
    learnedAnswersQuery.isError,
    learnedAnswersQuery.isLoading,
    normalizedLicense,
    overviewQuery.isError,
    overviewQuery.isFetching,
    overviewQuery.isLoading,
    saveCursor,
  ]);
  if (
    overviewQuery.isLoading ||
    learnedAnswersQuery.isLoading ||
    bookmarksQuery.isLoading ||
    (isReviewMode && (reviewQuery.isFetching || !reviewQuery.data) && !reviewQuery.isError)
  ) {
    return (
      <div className="font-dts flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#f7f6fb]">
        <p className="text-[14px] font-medium text-[#667085]">
          Đang tải tiến độ học...
        </p>
      </div>
    );
  }
  if (
    overviewQuery.isError ||
    learnedAnswersQuery.isError ||
    bookmarksQuery.isError ||
    (isReviewMode && reviewQuery.isError)
  ) {
    return (
      <div className="font-dts flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#f7f6fb] px-6">
        <div className="text-center">
          <p className="text-[15px] font-bold text-[#101828]">
            Không thể tải tiến độ chương
          </p>
          <p className="mt-2 text-[13px] font-medium text-[#667085]">
            Vui lòng thử tải lại dữ liệu học tập.
          </p>
          <button
            type="button"
            className="mt-4 h-10 rounded-[10px] bg-[#0758d9] px-5 text-[13px] font-semibold text-white transition hover:bg-[#064fc3]"
            onClick={() => {
              void overviewQuery.refetch();
              void learnedAnswersQuery.refetch();
              void bookmarksQuery.refetch();
              if (isReviewMode) void reviewQuery.refetch();
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }
  if (!currentQuestion) {
    return null;
  }

  const learnedCount = sessionQuestions.filter(
    (question) => question.learned
  ).length;
  const progressPercent =
    totalQuestions > 0
      ? Math.round((learnedCount / totalQuestions) * 100)
      : 0;

  const currentAnswer = isReviewMode
    ? reviewSession?.answers[String(currentQuestion.id)]
    : answerByQuestion.get(currentQuestion.id);
  const selectedAnswer = currentAnswer?.selectedAnswer;
  const correctAnswer = normalizeAnswer(
    isReviewMode
      ? reviewSession?.answers[String(currentQuestion.id)]?.correctAnswer
      : currentQuestion.correctAnswer
  );
  const answered = Boolean(currentAnswer);
  const isCorrect = currentAnswer?.isCorrect === true;
  const bookmarked = bookmarkedIds.has(currentQuestion.id);
  const reviewFinished = isReviewMode && reviewSession?.status === "COMPLETED";
  function goToPosition(position: number) {
    if (
      position < 1 || position > totalQuestions ||
      position === currentPosition
    ) return;
    if (isReviewMode) {
      if (!reviewSession || reviewAnswerMutation.isPending || reviewCursorMutation.isPending) return;
      if (reviewFinished) {
        setPositionByScope((current) => ({ ...current, [initializationScope]: position }));
        return;
      }
      const target = sessionQuestions[position - 1];
      if (!target) return;
      // Hiển thị vị trí mới trong lúc chờ PUT, chưa xem là dữ liệu bền vững.
      setPositionByScope((current) => ({
        ...current,
        [initializationScope]: position,
      }));
      reviewCursorMutation.mutate(
        {
          chapterId,
          sessionId: reviewSession.reviewSessionId,
          currentQuestionId: target.id,
        },
        {
          onSettled: () => {
            // Sau PUT + GET, quay lại dùng cursor chính thức của backend.
            setPositionByScope((current) => {
              const next = { ...current };
              delete next[initializationScope];
              return next;
            });
          },
        }
      );
      return;
    }
    setPositionByScope((current) => ({
      ...current,
      [initializationScope]: position,
    }));
  }
  function selectAnswer(label: string) {
    if (
      answered || reviewFinished || isRecordingAnswer ||
      reviewAnswerMutation.isPending || reviewCursorMutation.isPending ||
      (!isReviewMode && !correctAnswer)
    ) return;
    if (isReviewMode) {
      if (!reviewSession) return;
      reviewAnswerMutation.mutate({
        chapterId,
        sessionId: reviewSession.reviewSessionId,
        questionId: currentQuestion.id,
        selectedAnswer: label,
      });
      // Hook sẽ GET lại DB và cập nhật đúng answers/answeredQuestions.
      return;
    }
    setNormalStartedByScope((current) => ({
      ...current,
      [initializationScope]: true,
    }));
    recordAnswer({
      chapterId,
      licenseClass: normalizedLicense,
      questionId: currentQuestion.id,
      selectedAnswer: label,
    });
  }
  function finishReview() {
    if (
      !isReviewMode || !reviewSession || reviewFinished ||
      reviewAnswerMutation.isPending || reviewCursorMutation.isPending ||
      finishReviewMutation.isPending ||
      reviewSession.answeredQuestions !== reviewSession.totalQuestions
    ) return;
    finishReviewMutation.mutate({
      chapterId,
      sessionId: reviewSession.reviewSessionId,
    });
  }
  function handleBookmark() {
    if (isBookmarkPending) {
      return;
    }
    setBookmark({
      chapterId,
      questionId: currentQuestion.id,
      licenseClass: normalizedLicense,
      bookmarked: !bookmarked,
    });
  }
  function handleSelectChapter(nextChapterId: number) {
    setChapterDrawerOpen(false);
    if (nextChapterId === chapterId) {
      return;
    }
    onChangeChapter(nextChapterId);
  }
  return (
    <div className="font-dts min-h-screen bg-[#f7f6fb] text-[#101828]">
      <ChapterSessionHeader
        chapterId={chapterId}
        chapterTitle={chapterTitle}
        currentPosition={currentPosition}
        totalQuestions={totalQuestions}
        onChangeChapter={() => setChapterDrawerOpen(true)}
      />
      <main className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-start justify-center gap-7 px-6 pb-14 pt-[1.5cm] lg:grid-cols-[minmax(0,830px)_360px]">
        <section className="rounded-[16px] border border-[#dedfea] bg-white px-7 pb-6 pt-6 shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
          <QuestionHeader
            question={currentQuestion}
            currentPosition={currentPosition}
            totalQuestions={totalQuestions}
            bookmarked={bookmarked}
            bookmarkPending={isBookmarkPending}
            onBookmark={handleBookmark}
          />
          <div className="py-6">
            <h2 className="max-w-[750px] text-[16px] font-bold leading-[1.55] tracking-[-0.015em] text-[#101828]">
              {currentQuestion.questionText}
            </h2>
            {(currentQuestion.mediaFileId ||
              currentQuestion.imageUrl) && (
              <div className="mt-5 flex justify-center">
                <MediaImage
                  src={
                    currentQuestion.mediaFileId ??
                    currentQuestion.imageUrl
                  }
                  alt={`Hình minh họa câu ${currentPosition}`}
                  className="max-h-[300px] max-w-full rounded-[10px] border border-[#e5e8ee] object-contain"
                />
              </div>
            )}
            {!correctAnswer && !isReviewMode && (
              <div className="mt-5 rounded-[10px] border border-[#fedf89] bg-[#fffaeb] px-4 py-3 text-[12px] font-medium text-[#b54708]">
                Câu hỏi này chưa có đáp án đúng trong dữ liệu Practice
                Service.
              </div>
            )}
            <div className="mt-6 space-y-3">
              {normalizeOptions(currentQuestion).map((option) => (
                <AnswerOption
                  key={option.label}
                  option={option}
                  selectedAnswer={selectedAnswer}
                  correctAnswer={correctAnswer}
                  answered={answered}
                  disabled={
                    reviewFinished ||
                    isRecordingAnswer ||
                    reviewAnswerMutation.isPending ||
                    (!isReviewMode && !correctAnswer)
                  }
                  onSelect={selectAnswer}
                />
              ))}
            </div>
            {answered && correctAnswer && (
              <FeedbackPanel
                isCorrect={isCorrect}
                explanation={currentQuestion.explanation}
              />
            )}
          </div>
          <div className="border-t border-[#eef0f4] pt-5">
            <div className="flex items-center justify-between gap-5">
              <button
                type="button"
                disabled={currentPosition <= 1}
                onClick={() => goToPosition(currentPosition - 1)}
                className="inline-flex h-10 min-w-[118px] items-center justify-center gap-2 rounded-[9px] bg-[#f3f5fb] px-4 text-[13px] font-semibold text-[#475467] transition hover:bg-[#e9edf6] disabled:pointer-events-none disabled:opacity-40"
              >
                <ArrowLeft className="size-4" />
                Câu trước
              </button>
              <div className="min-w-[190px] text-center">
                <p className="text-[12px] font-medium text-[#667085]">
                  {isReviewMode ? "Đã ôn:" : "Đã học:"}{" "}
                  <strong className="font-bold text-[#0758d9]">
                    {learnedCount}
                  </strong>{" "}
                  / {totalQuestions} câu
                </p>
                <div className="mx-auto mt-2 h-1.5 w-[140px] overflow-hidden rounded-full bg-[#e7eaf4]">
                  <div
                    className="h-full rounded-full bg-[#0758d9] transition-[width]"
                    style={{
                      width: `${progressPercent}%`,
                    }}
                  />
                </div>
              </div>
              {isReviewMode && reviewFinished ? (
                <span className="inline-flex h-10 items-center rounded-[9px] bg-[#ecfdf3] px-4 text-[13px] font-semibold text-[#067647]">
                  Đã hoàn thành
                </span>
              ) : isReviewMode &&
                reviewSession?.answeredQuestions === totalQuestions ? (
                <button
                  type="button"
                  disabled={finishReviewMutation.isPending || reviewCursorMutation.isPending}
                  onClick={finishReview}
                  className="inline-flex h-10 min-w-[118px] items-center justify-center gap-2 rounded-[9px] bg-[#0758d9] px-4 text-[13px] font-semibold text-white transition hover:bg-[#064fc3] disabled:pointer-events-none disabled:opacity-40"
                >
                  Hoàn tất lượt ôn
                  <Check className="size-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    currentPosition >= totalQuestions ||
                    (isReviewMode && (reviewAnswerMutation.isPending || reviewCursorMutation.isPending))
                  }
                  onClick={() => goToPosition(currentPosition + 1)}
                  className="inline-flex h-10 min-w-[118px] items-center justify-center gap-2 rounded-[9px] bg-[#0758d9] px-4 text-[13px] font-semibold text-white transition hover:bg-[#064fc3] disabled:pointer-events-none disabled:opacity-40"
                >
                  Câu tiếp
                  <ArrowRight className="size-4" />
                </button>
              )}
            </div>
          </div>
        </section>
        <div className="lg:sticky lg:top-7">
          <ChapterQuestionNavigator
            questions={sessionQuestions}
            currentPosition={currentPosition}
            totalQuestions={totalQuestions}
            onSelectQuestion={goToPosition}
            isReviewMode={isReviewMode}
          />
        </div>
      </main>
      <ChapterSelectorDrawer
        open={chapterDrawerOpen}
        onOpenChange={setChapterDrawerOpen}
        licenseClass={normalizedLicense}
        currentChapterId={chapterId}
        onSelectChapter={handleSelectChapter}
      />
    </div>
  );
}
function QuestionHeader({
  question,
  currentPosition,
  totalQuestions,
  bookmarked,
  bookmarkPending,
  onBookmark,
}: {
  question: ChapterSessionQuestion;
  currentPosition: number;
  totalQuestions: number;
  bookmarked: boolean;
  bookmarkPending: boolean;
  onBookmark: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-[#eef0f4] pb-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-[7px] bg-[#eaf0ff] px-2.5 py-1.5 text-[11px] font-bold text-[#0758d9]">
          CÂU {currentPosition} / {totalQuestions}
        </span>
        {question.isCritical && (
          <span className="rounded-[7px] bg-[#fff4e8] px-2.5 py-1.5 text-[11px] font-semibold text-[#c56a00]">
            Câu điểm liệt
          </span>
        )}
      </div>
      <span className="rounded-[7px] bg-[#f1f3fa] px-3 py-1.5 text-[13px] font-medium text-[#667085]">
        Nội dung chương
      </span>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={bookmarkPending}
          onClick={onBookmark}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-2 rounded-[10px] border px-4 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
            bookmarked
              ? "border-[#bfd0ff] bg-[#eef3ff] text-[#0758d9]"
              : "border-[#e1e5ec] bg-white text-[#667085] hover:bg-[#f8f9fc]"
          )}
        >
          <Bookmark
            className="size-4"
            fill={bookmarked ? "currentColor" : "none"}
            strokeWidth={1.9}
          />
          {bookmarked ? "Đã đánh dấu" : "Đánh dấu câu này"}
        </button>
      </div>
    </div>
  );
}
function AnswerOption({
  option,
  selectedAnswer,
  correctAnswer,
  answered,
  disabled,
  onSelect,
}: {
  option: NormalizedOption;
  selectedAnswer?: string;
  correctAnswer: string;
  answered: boolean;
  disabled: boolean;
  onSelect: (label: string) => void;
}) {
  const isSelected = selectedAnswer === option.label;
  const isCorrectOption =
    answered &&
    option.label === correctAnswer;
  const isWrongSelected =
    answered &&
    isSelected &&
    option.label !== correctAnswer;
  return (
    <button
      type="button"
      disabled={disabled || answered}
      onClick={() => onSelect(option.label)}
      className={cn(
        "flex min-h-[64px] w-full items-center gap-3.5 rounded-[12px] border px-4 py-3.5 text-left transition",
        !answered &&
          !disabled &&
          "border-[#e3e3ee] bg-[#f5f4fb] hover:border-[#abc3ee] hover:bg-[#f1f4ff]",
        !answered &&
          disabled &&
          "cursor-not-allowed border-[#e5e6ed] bg-[#f6f6f8] opacity-60",
        answered &&
          isCorrectOption &&
          "border-[#18a566] bg-[#effaf4]",
        answered &&
          isWrongSelected &&
          "border-[#e34848] bg-[#fff3f2]",
        answered &&
          !isCorrectOption &&
          !isWrongSelected &&
          "border-[#e5e6ed] bg-[#f6f6f8] opacity-60"
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          !answered &&
            "border-[#d5dae4] bg-white",
          isCorrectOption &&
            "border-[#12a264] bg-[#effaf4] text-[#079455]",
          isWrongSelected &&
            "border-[#d92d20] bg-[#fff3f2] text-[#d92d20]",
          answered &&
            !isCorrectOption &&
            !isWrongSelected &&
            "border-[#e1e4ea] bg-white"
        )}
      >
        {isCorrectOption ? (
          <Check
            className="size-3"
            strokeWidth={2.5}
          />
        ) : isWrongSelected ? (
          <X
            className="size-3"
            strokeWidth={2.5}
          />
        ) : null}
      </span>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-[7px] border text-[13px] font-semibold",
          !answered &&
            "border-[#dde2ea] bg-[#eef0f5] text-[#536078]",
          isCorrectOption &&
            "border-[#abefc6] bg-[#ecfdf3] text-[#067647]",
          isWrongSelected &&
            "border-[#fecdca] bg-[#fef3f2] text-[#b42318]",
          answered &&
            !isCorrectOption &&
            !isWrongSelected &&
            "border-[#e4e7ec] bg-[#f2f4f7] text-[#98a2b3]"
        )}
      >
        {option.label}
      </span>
      <span
        className={cn(
          "flex-1 text-[14px] font-medium leading-6",
          isCorrectOption &&
            "text-[#05603a]",
          isWrongSelected &&
            "text-[#b42318]",
          !isCorrectOption &&
            !isWrongSelected &&
            "text-[#475467]"
        )}
      >
        {option.text}
      </span>
    </button>
  );
}
function FeedbackPanel({
  isCorrect,
  explanation,
}: {
  isCorrect: boolean;
  explanation?: string | null;
}) {
  const hasExplanation = Boolean(
    explanation?.trim()
  );
  return (
    <div className="mt-5 rounded-[12px] border border-[#dfe4ff] bg-[#f4f5ff] px-5 py-5">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold",
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
          <h3 className="flex items-center gap-2 text-[14px] font-bold text-[#101828]">
            <Info className="size-4 text-[#0758d9]" />
            Giải thích chi tiết
          </h3>
          <p className="mt-2.5 whitespace-pre-line pl-6 text-[14px] font-medium leading-[1.7] text-[#475467]">
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}
function normalizeOptions(
  question: ChapterSessionQuestion
): NormalizedOption[] {
  const options = Array.isArray(question.options)
    ? question.options
    : [];
  return options.map(
    (
      option: QuestionOption,
      index: number
    ) => {
      const rawLabel = option.label?.trim();
      const fallbackLabel =
        OPTION_LABELS[index] ??
        String.fromCharCode(65 + index);
      return {
        label: normalizeAnswer(
          rawLabel || fallbackLabel
        ),
        text: option.text?.trim() ?? "",
      };
    }
  );
}
function normalizeAnswer(value?: string | null) {
  return value?.trim().toUpperCase() ?? "";
}
