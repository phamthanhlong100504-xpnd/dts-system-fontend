"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Clock3,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { toast } from "sonner";

import { RequireAuth } from "@/components/require-auth";
import { MediaImage } from "@/components/ui/media-image";
import { Skeleton } from "@/components/ui/skeleton";

import {
  AnswerOption,
  type AnswerOptionState,
} from "@/features/practice/components/question-session/answer-option";

import { ExplanationPanel } from "@/features/practice/components/question-session/explanation-panel";

import { QuestionSessionShell } from "@/features/practice/components/question-session/question-session-shell";

import {
  CHAPTER_META,
  type ExamSessionResponse,
  type PracticeAnswerFeedback,
  type Question,
  type QuestionOption,
  type SubmitAnswerRequest,
} from "@/features/practice/practice-service";

import {
  useExamFlags,
  useExamSession,
  useFinishExam,
  usePauseExam,
  useResumeExam,
  useSubmitAnswer,
  useUpdateExamCursor,
  useUpdateExamFlag,
} from "@/features/practice/use-practice";

import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

import {
  type AnswerFeedback,
  useExamStore,
  useHasExamHydrated,
} from "@/stores/exam-store";

const OPTION_LABELS = [
  "A",
  "B",
  "C",
  "D",
];

const EMPTY_QUESTIONS: Question[] =
  [];

const EMPTY_ANSWERS: Record<
  string,
  string
> = {};

const EMPTY_FEEDBACK: Record<
  string,
  AnswerFeedback
> = {};

interface OptionView {
  label: string;
  text: string;
}

interface OptimisticAnswers {
  examId: string;

  values: Record<
    string,
    string
  >;
}

interface PracticeFeedbackState {
  examId: string;

  values: Record<
    string,
    AnswerFeedback
  >;
}

function normalizeOptions(
  question: Question
): OptionView[] {
  const raw =
    Array.isArray(
      question.options
    )
      ? (
          question.options as unknown[]
        )
      : [];

  return raw.map(
    (
      option,
      index
    ) => {
      if (
        typeof option ===
        "string"
      ) {
        return {
          label:
            OPTION_LABELS[
              index
            ] ??
            String.fromCharCode(
              65 + index
            ),

          text:
            option,
        };
      }

      const item =
        option as QuestionOption;

      return {
        label:
          item.label ??
          OPTION_LABELS[
            index
          ] ??
          String.fromCharCode(
            65 + index
          ),

        text:
          item.text ??
          "",
      };
    }
  );
}

function clampIndex(
  index: number,
  questions: Question[]
) {
  if (
    questions.length ===
    0
  ) {
    return 0;
  }

  return Math.min(
    Math.max(
      index,
      0
    ),

    questions.length -
      1
  );
}

function getBackendQuestionIndex(
  session: ExamSessionResponse,
  questions: Question[]
) {
  if (
    session.currentQuestionId ==
    null
  ) {
    return -1;
  }

  return questions.findIndex(
    (question) =>
      question.id ===
      session.currentQuestionId
  );
}

function getInitialTimeSeconds(
  session: ExamSessionResponse
) {
  if (
    session.status ===
      "COMPLETED" ||
    session.status ===
      "TIMEOUT"
  ) {
    return 0;
  }

  if (
    typeof session.remainingTimeMs ===
    "number"
  ) {
    return Math.max(
      0,

      Math.ceil(
        session.remainingTimeMs /
          1000
      )
    );
  }

  if (
    session.expiresAt &&
    session.serverTime
  ) {
    const expiresAt =
      new Date(
        session.expiresAt
      ).getTime();

    const serverTime =
      new Date(
        session.serverTime
      ).getTime();

    if (
      !Number.isNaN(
        expiresAt
      ) &&
      !Number.isNaN(
        serverTime
      )
    ) {
      return Math.max(
        0,

        Math.ceil(
          (
            expiresAt -
            serverTime
          ) /
            1000
        )
      );
    }
  }

  return Math.max(
    0,

    (
      session.durationMinutes ??
      0
    ) * 60
  );
}

function getTimerKey(
  session: ExamSessionResponse
) {
  return [
    session.examId ??
      "",

    session.status ??
      "",

    session.serverTime ??
      "",

    session.remainingTimeMs ??
      "",

    session.expiresAt ??
      "",
  ].join("|");
}

function getFeedbackFromQuestion(
  question: Question,
  selectedAnswer?: string
): AnswerFeedback | undefined {
  if (
    !selectedAnswer ||
    !question.correctAnswer
  ) {
    return undefined;
  }

  return {
    isCorrect:
      selectedAnswer ===
      question.correctAnswer,

    correctAnswer:
      question.correctAnswer,

    explanation:
      question.explanation ??
      "",
  };
}

function normalizePracticeFeedback(
  value?: PracticeAnswerFeedback
): AnswerFeedback | undefined {
  if (
    !value ||
    value.isCorrect == null ||
    !value.correctAnswer
  ) {
    return undefined;
  }

  return {
    isCorrect:
      Boolean(
        value.isCorrect
      ),

    correctAnswer:
      value.correctAnswer,

    explanation:
      value.explanation ??
      "",
  };
}

export default function StudentExamRunnerPage() {
  return (
    <RequireAuth>
      <QuestionSession />
    </RequireAuth>
  );
}

function QuestionSession() {
  const router =
    useRouter();

  const {
    examId,
  } =
    useParams<{
      examId: string;
    }>();

  const hydrated =
    useHasExamHydrated();

  const storeExamId =
    useExamStore(
      (state) =>
        state.examId
    );

  const storeQuestionsLength =
    useExamStore(
      (state) =>
        state.questions.length
    );

  const storeCurrentIndex =
    useExamStore(
      (state) =>
        state.currentIndex
    );

  const storeFeedback =
    useExamStore(
      (state) =>
        state.feedback
    );

  const setStoreAnswer =
    useExamStore(
      (state) =>
        state.setAnswer
    );

  const removeStoreAnswer =
    useExamStore(
      (state) =>
        state.removeAnswer
    );

  const setStoreFeedback =
    useExamStore(
      (state) =>
        state.setFeedback
    );

  const setStoreCurrentIndex =
    useExamStore(
      (state) =>
        state.setCurrentIndex
    );

  const sessionQuery =
    useExamSession(
      examId
    );

  const session =
    sessionQuery.data ??
    null;

  const status =
    session?.status;

  useEffect(
    () => {
      if (
        status ===
          "COMPLETED" ||
        status ===
          "TIMEOUT"
      ) {
        router.replace(
          `/practice/result/${examId}`
        );
      }
    },
    [
      examId,
      router,
      status,
    ]
  );

  if (
    sessionQuery.isLoading ||
    !hydrated
  ) {
    return (
      <RunnerSkeleton />
    );
  }

  if (
    sessionQuery.isError ||
    !session ||
    !session.examId ||
    !session.questions
      ?.length
  ) {
    return (
      <SessionNotFound
        onBack={() =>
          router.push(
            "/practice"
          )
        }
      />
    );
  }

  if (
    session.status ===
      "COMPLETED" ||
    session.status ===
      "TIMEOUT"
  ) {
    return (
      <RunnerSkeleton />
    );
  }

  const storeMatches =
    storeExamId ===
      examId &&
    storeQuestionsLength >
      0;

  const backendIndex =
    getBackendQuestionIndex(
      session,
      session.questions
    );

  let initialIndex =
    0;

  if (
    backendIndex >=
    0
  ) {
    initialIndex =
      backendIndex;
  } else if (
    storeMatches
  ) {
    initialIndex =
      clampIndex(
        storeCurrentIndex,
        session.questions
      );
  }

  const sessionViewKey =
    session.status ===
    "PAUSED"
      ? `${session.examId}:paused:${session.currentQuestionId ?? "none"}`
      : `${session.examId}:active`;

  return (
    <QuestionSessionContent
      key={
        sessionViewKey
      }
      examId={
        examId
      }
      session={
        session
      }
      initialIndex={
        initialIndex
      }
      storeMatches={
        storeMatches
      }
      storeFeedback={
        storeMatches
          ? storeFeedback
          : EMPTY_FEEDBACK
      }
      setStoreAnswer={
        setStoreAnswer
      }
      removeStoreAnswer={
        removeStoreAnswer
      }
      setStoreFeedback={
        setStoreFeedback
      }
      setStoreCurrentIndex={
        setStoreCurrentIndex
      }
      refetchSession={
        sessionQuery.refetch
      }
    />
  );
}

function QuestionSessionContent({
  examId,
  session,
  initialIndex,
  storeMatches,
  storeFeedback,
  setStoreAnswer,
  removeStoreAnswer,
  setStoreFeedback,
  setStoreCurrentIndex,
  refetchSession,
}: {
  examId: string;

  session:
    ExamSessionResponse;

  initialIndex:
    number;

  storeMatches:
    boolean;

  storeFeedback:
    Record<
      string,
      AnswerFeedback
    >;

  setStoreAnswer: (
    questionId:
      number,
    label:
      string
  ) => void;

  removeStoreAnswer: (
    questionId:
      number
  ) => void;

  setStoreFeedback: (
    questionId:
      number,
    feedback:
      AnswerFeedback
  ) => void;

  setStoreCurrentIndex: (
    index:
      number
  ) => void;

  refetchSession:
    () => Promise<unknown>;
}) {
  const router =
    useRouter();

  const questions =
    session.questions ??
    EMPTY_QUESTIONS;

  const status =
    session.status;

  const isPractice =
    session.mode ===
    "PRACTICE";

  const isPaused =
    status ===
    "PAUSED";

  const isInProgress =
    status ===
    "IN_PROGRESS";

  const flagsQuery =
    useExamFlags(
      examId
    );

  const updateFlagMutation =
    useUpdateExamFlag();

  const updateCursorMutation =
    useUpdateExamCursor();

  const submitAnswerMutation =
    useSubmitAnswer();

  const pauseMutation =
    usePauseExam();

  const resumeMutation =
    useResumeExam();

  const finishMutation =
    useFinishExam();

  const [
    currentIndex,
    setCurrentIndex,
  ] =
    useState(
      () =>
        clampIndex(
          initialIndex,
          questions
        )
    );

  const [
    optimisticAnswers,
    setOptimisticAnswers,
  ] =
    useState<OptimisticAnswers>(
      {
        examId,
        values: {},
      }
    );

  const [
    practiceFeedback,
    setPracticeFeedback,
  ] =
    useState<PracticeFeedbackState>(
      {
        examId,
        values: {},
      }
    );

  const serverAnswers =
    session.answers ??
    EMPTY_ANSWERS;

  const pendingAnswers =
    optimisticAnswers.examId ===
    examId
      ? optimisticAnswers.values
      : EMPTY_ANSWERS;

  const answers:
    Record<
      string,
      string
    > = {
      ...serverAnswers,
      ...pendingAnswers,
    };

  const localPracticeFeedback =
    practiceFeedback.examId ===
    examId
      ? practiceFeedback.values
      : EMPTY_FEEDBACK;

  const answeredCount =
    questions.filter(
      (
        question
      ) => {
        const answer =
          answers[
            String(
              question.id
            )
          ];

        return (
          answer != null &&
          answer !== ""
        );
      }
    ).length;

  const isBusy =
    finishMutation.isPending ||
    submitAnswerMutation.isPending ||
    updateCursorMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending;

  const handleSubmit =
    useCallback(
      () => {
        if (
          !isInProgress ||
          isBusy
        ) {
          return;
        }

        const unanswered =
          questions.length -
          answeredCount;

        if (
          unanswered >
          0
        ) {
          const accepted =
            window.confirm(
              `Bạn đã trả lời ${answeredCount}/${questions.length} câu. Còn ${unanswered} câu chưa trả lời. Bạn vẫn muốn nộp bài?`
            );

          if (
            !accepted
          ) {
            return;
          }
        }

        finishMutation.mutate(
          examId
        );
      },
      [
        answeredCount,
        examId,
        finishMutation,
        isBusy,
        isInProgress,
        questions.length,
      ]
    );

  const handleTimerExpire =
    useCallback(
      () => {
        void refetchSession();
      },
      [
        refetchSession,
      ]
    );

  function handleSelectOption(
    question:
      Question,
    label:
      string
  ) {
    const questionId =
      question.id;

    if (
      questionId ==
        null ||
      !isInProgress ||
      isBusy
    ) {
      return;
    }

    const questionKey =
      String(
        questionId
      );

    if (
      isPractice &&
      answers[
        questionKey
      ] != null
    ) {
      return;
    }

    const previousAnswer =
      serverAnswers[
        questionKey
      ];

    const payload:
      SubmitAnswerRequest =
      {
        questionId:
          questionKey,

        selectedAnswer:
          label as SubmitAnswerRequest["selectedAnswer"],
      };

    setOptimisticAnswers(
      (
        previous
      ) => ({
        examId,

        values: {
          ...(
            previous.examId ===
            examId
              ? previous.values
              : EMPTY_ANSWERS
          ),

          [questionKey]:
            label,
        },
      })
    );

    if (
      storeMatches
    ) {
      setStoreAnswer(
        questionId,
        label
      );
    }

    submitAnswerMutation.mutate(
      {
        examId,
        payload,
      },
      {
        onSuccess: (
          response
        ) => {
          setOptimisticAnswers(
            (
              previous
            ) => {
              if (
                previous.examId !==
                examId
              ) {
                return previous;
              }

              const next = {
                ...previous.values,
              };

              delete next[
                questionKey
              ];

              return {
                examId,
                values:
                  next,
              };
            }
          );

          if (
            isPractice &&
            response.isCorrect !=
              null
          ) {
            const nextFeedback:
              AnswerFeedback =
              {
                isCorrect:
                  Boolean(
                    response.isCorrect
                  ),

                correctAnswer:
                  response.correctAnswer ??
                  "",

                explanation:
                  response.explanation ??
                  "",
              };

            setPracticeFeedback(
              (
                previous
              ) => ({
                examId,

                values: {
                  ...(
                    previous.examId ===
                    examId
                      ? previous.values
                      : EMPTY_FEEDBACK
                  ),

                  [questionKey]:
                    nextFeedback,
                },
              })
            );

            if (
              storeMatches
            ) {
              setStoreFeedback(
                questionId,
                nextFeedback
              );
            }
          }
        },

        onError: (
          error
        ) => {
          setOptimisticAnswers(
            (
              previous
            ) => {
              if (
                previous.examId !==
                examId
              ) {
                return previous;
              }

              const next = {
                ...previous.values,
              };

              delete next[
                questionKey
              ];

              return {
                examId,
                values:
                  next,
              };
            }
          );

          if (
            storeMatches
          ) {
            if (
              previousAnswer !=
              null
            ) {
              setStoreAnswer(
                questionId,
                previousAnswer
              );
            } else {
              removeStoreAnswer(
                questionId
              );
            }
          }

          toast.error(
            error instanceof
              ApiError
              ? error.message
              : "Không lưu được đáp án. Thử lại."
          );

          void refetchSession();
        },
      }
    );
  }

  function goToQuestion(
    index:
      number
  ) {
    if (
      !isInProgress ||
      isBusy
    ) {
      return;
    }

    const nextIndex =
      clampIndex(
        index,
        questions
      );

    if (
      nextIndex ===
      currentIndex
    ) {
      return;
    }

    const nextQuestionId =
      questions[
        nextIndex
      ]?.id;

    setCurrentIndex(
      nextIndex
    );

    if (
      storeMatches
    ) {
      setStoreCurrentIndex(
        nextIndex
      );
    }

    if (
      nextQuestionId !=
      null
    ) {
      updateCursorMutation.mutate(
        {
          examId,

          currentQuestionId:
            nextQuestionId,
        }
      );
    }
  }

  function handlePauseToggle() {
    if (
      isBusy
    ) {
      return;
    }

    if (
      isPaused
    ) {
      resumeMutation.mutate(
        examId
      );

      return;
    }

    if (
      !isInProgress
    ) {
      return;
    }

    const currentQuestionId =
      questions[
        currentIndex
      ]?.id;

    if (
      currentQuestionId ==
      null
    ) {
      toast.error(
        "Không xác định được câu hiện tại"
      );

      return;
    }

    pauseMutation.mutate(
      {
        examId,
        currentQuestionId,
      }
    );
  }

  const question =
    questions[
      currentIndex
    ];

  if (
    !question
  ) {
    return (
      <RunnerSkeleton />
    );
  }

  const questionId =
    String(
      question.id
    );

  const flaggedQuestionIds =
    flagsQuery.data
      ?.flaggedQuestionIds ??
    [];

  const isFlagged =
    question.id !=
      null &&
    flaggedQuestionIds.includes(
      question.id
    );

  const isFlagBusy =
    flagsQuery.isLoading ||
    updateFlagMutation.isPending;

  function handleToggleFlag() {
    if (
      question.id ==
        null ||
      flagsQuery.isLoading ||
      flagsQuery.isError ||
      updateFlagMutation.isPending
    ) {
      return;
    }

    updateFlagMutation.mutate(
      {
        examId,

        questionId:
          question.id,

        flagged:
          !isFlagged,
      }
    );
  }

  const selectedAnswer =
    answers[
      questionId
    ];

  const localFeedback =
    localPracticeFeedback[
      questionId
    ];

  const persistedFeedback =
    isPractice
      ? normalizePracticeFeedback(
          session.answerFeedback?.[
            questionId
          ]
        )
      : undefined;

  const legacyStoreFeedback =
    storeFeedback[
      questionId
    ];

  const questionFallbackFeedback =
    isPractice
      ? getFeedbackFromQuestion(
          question,
          selectedAnswer
        )
      : undefined;

  const questionFeedback =
    localFeedback ??
    persistedFeedback ??
    legacyStoreFeedback ??
    questionFallbackFeedback;

  const practiceLocked =
    isPractice &&
    selectedAnswer !=
      null;

  const practiceAnswered =
    practiceLocked &&
    questionFeedback !=
      null;

  const options =
    normalizeOptions(
      question
    );

  const chapter =
    question.chapter !=
    null
      ? CHAPTER_META[
          String(
            question.chapter
          )
        ]
      : undefined;

  const modeLabel =
    isPractice
      ? "Luyện tập có giải thích"
      : "Mô phỏng thi thật";

  const timerKey =
    getTimerKey(
      session
    );

  const initialTimeSeconds =
    getInitialTimeSeconds(
      session
    );

  return (
    <div className="font-dts min-h-screen bg-[#f7f6fb] text-[#101828]">
      {/* ===================================================== */}
      {/* Session Header                                        */}
      {/* ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-[#e1e2ec] bg-white">
        <div className="grid h-[64px] w-full grid-cols-[1fr_auto_1fr] items-center px-6 lg:px-[38px]">
          {/* Left */}
          <div className="flex items-center justify-start">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/practice"
                )
              }
              className="flex shrink-0 items-center gap-2 text-[13px] font-semibold text-[#5f6c80] transition hover:text-[#101828]"
            >
              <ArrowLeft className="size-4" />

              Thoát
            </button>
          </div>

          {/* Center */}
          <div className="flex min-w-0 items-center justify-center gap-2.5">
            <h1 className="truncate text-[16px] font-bold text-[#27364f]">
              Thi thử hạng{" "}
              {
                session.examType
              }
            </h1>

            <span className="shrink-0 rounded-full bg-[#eaf1ff] px-2.5 py-1 text-[11px] font-semibold text-[#0758d9]">
              {
                modeLabel
              }
            </span>

            {isPaused && (
              <span className="shrink-0 rounded-full bg-[#fff2dc] px-2.5 py-1 text-[11px] font-semibold text-[#b54708]">
                Đang tạm dừng
              </span>
            )}
          </div>

          {/* Right */}
          <div className="flex shrink-0 items-center justify-end gap-3">
            <span className="text-[13px] font-semibold text-[#3f4d63]">
              {
                answeredCount
              }

              <span className="text-[#7d899b]">
                {" "}
                /{" "}
                {
                  questions.length
                }{" "}
                câu
              </span>
            </span>

            <SessionTimer
              key={
                timerKey
              }
              initialSeconds={
                initialTimeSeconds
              }
              running={
                isInProgress
              }
              onExpire={
                handleTimerExpire
              }
            />

            <button
              type="button"
              onClick={
                handlePauseToggle
              }
              disabled={
                isBusy
              }
              className="flex h-9 items-center gap-1.5 rounded-[9px] border border-[#d9dee8] bg-white px-3.5 text-[13px] font-semibold text-[#536078] transition hover:bg-[#f7f8fb] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pauseMutation.isPending ||
              resumeMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : isPaused ? (
                <Play className="size-3.5" />
              ) : (
                <Pause className="size-3.5" />
              )}

              {isPaused
                ? "Tiếp tục"
                : "Tạm dừng"}
            </button>

            <button
              type="button"
              onClick={
                handleSubmit
              }
              disabled={
                isPaused ||
                isBusy
              }
              className="flex h-9 min-w-[92px] items-center justify-center rounded-[9px] bg-[#0758d9] px-4 text-[13px] font-semibold text-white shadow-[0_2px_5px_rgba(7,88,217,0.18)] transition hover:bg-[#064fc3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {finishMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Nộp bài"
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================== */}
      {/* Session Content                                       */}
      {/* ===================================================== */}

      <QuestionSessionShell>
        {/* =================================================== */}
        {/* Question card                                       */}
        {/* =================================================== */}

        <section className="flex min-h-[560px] flex-col rounded-[16px] border border-[#dedfea] bg-white p-6 shadow-[0_4px_14px_rgba(31,41,55,0.055)] lg:p-7">
          {/* Question metadata */}
          <div className="relative flex min-h-9 w-full items-center">
            {/* Left: question number */}
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-[7px] bg-[#eaf1ff] px-3 py-1.5 text-[12px] font-bold uppercase text-[#0758d9]">
                Câu{" "}
                {currentIndex + 1} /{" "}
                {questions.length}
              </span>

              {question.isCritical && (
                <span className="rounded-[7px] bg-[#fff2dc] px-2.5 py-1.5 text-[11px] font-semibold text-[#b54708]">
                  Câu điểm liệt
                </span>
              )}
            </div>

            {/* Center: chapter */}
            {chapter && (
              <div className="pointer-events-none absolute left-1/2 top-1/2 max-w-[48%] -translate-x-1/2 -translate-y-1/2">
                <span className="block truncate rounded-[7px] bg-[#eef1ff] px-3 py-1.5 text-center text-[12px] font-semibold text-[#536078]">
                  {chapter.name}
                </span>
              </div>
            )}

            {/* Right: bookmark */}
            <button
              type="button"
              onClick={handleToggleFlag}
              disabled={
                question.id == null ||
                isFlagBusy ||
                flagsQuery.isError
              }
              title={
                flagsQuery.isError
                  ? "Không tải được trạng thái đánh dấu"
                  : undefined
              }
              className={cn(
                "ml-auto flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] border px-3.5 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",

                isFlagged
                  ? "border-[#7fa5eb] bg-[#eaf1ff] text-[#0758d9]"
                  : "border-[#dde1e9] bg-white text-[#536078] hover:border-[#bdc7d8] hover:bg-[#f8f9fc]"
              )}
            >
              {updateFlagMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Bookmark
                  className={cn(
                    "size-3.5",
                    isFlagged &&
                      "fill-current"
                  )}
                />
              )}

              {flagsQuery.isLoading
                ? "Đang tải..."
                : isFlagged
                  ? "Đã đánh dấu"
                  : "Đánh dấu câu này"}
            </button>
          </div>

          {/* Question title */}
          <h2 className="mt-8 w-full text-left text-[16px] font-bold leading-[1.6] text-[#101828]">
            {question.questionText}
          </h2>

          {/* Optional image */}
          {(question.mediaFileId || question.imageUrl) && (
            <div className="mt-5 flex w-full justify-center">
              <div className="flex w-full max-w-[600px] justify-center">
                <MediaImage
                  src={question.mediaFileId ?? question.imageUrl}
                  alt=""
                  className="block h-auto w-auto max-h-[300px] max-w-full rounded-[10px] border border-[#e5e8ee] object-contain"
                />
              </div>
            </div>
          )}

          {/* Answers */}
          <div className="mt-6 w-full space-y-3">
            {options.length === 0 && (
              <p className="text-[14px] font-medium text-[#5f6c80]">
                Câu hỏi này chưa có đáp án.
              </p>
            )}

            {options.map((option) => {
              const isSelected =
                selectedAnswer ===
                option.label;

              const isCorrect =
                practiceAnswered &&
                option.label ===
                  questionFeedback.correctAnswer;

              const isWrongSelection =
                practiceAnswered &&
                isSelected &&
                option.label !==
                  questionFeedback.correctAnswer;

              let optionState: AnswerOptionState =
                "neutral";

              if (practiceAnswered) {
                if (isCorrect) {
                  optionState =
                    "correct";
                } else if (
                  isWrongSelection
                ) {
                  optionState =
                    "wrong";
                } else {
                  optionState =
                    "disabled";
                }
              } else if (isSelected) {
                optionState =
                  "selected";
              }

              return (
                <AnswerOption
                  key={option.label}
                  label={option.label}
                  text={option.text}
                  state={optionState}
                  disabled={
                    !isInProgress ||
                    practiceLocked ||
                    isBusy
                  }
                  selectedLabel={
                    isWrongSelection
                      ? selectedAnswer
                      : undefined
                  }
                  showFeedbackBadge={
                    !isPractice
                  }
                  subtleStatusIndicator={
                    isPractice
                  }
                  onClick={() =>
                    handleSelectOption(
                      question,
                      option.label
                    )
                  }
                />
              );
            })}
          </div>

          {/* Practice feedback */}
          {practiceAnswered && (
            <ExplanationPanel
              isCorrect={
                questionFeedback.isCorrect
              }
              selectedAnswer={
                selectedAnswer
              }
              correctAnswer={
                questionFeedback.correctAnswer
              }
              explanation={
                questionFeedback.explanation
              }
              showAnswerSummary={false}
            />
          )}

          {/* Footer navigation */}
          <div className="mt-auto flex w-full items-center justify-between border-t border-[#e9eaf1] pt-5">
            <button
              type="button"
              disabled={
                !isInProgress ||
                isBusy ||
                currentIndex === 0
              }
              onClick={() =>
                goToQuestion(
                  currentIndex - 1
                )
              }
              className="flex h-9 items-center gap-2 rounded-[9px] bg-[#f0f1f7] px-4 text-[13px] font-semibold text-[#536078] transition hover:bg-[#e8eaf2] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="size-3.5" />
              Câu trước
            </button>

            <div className="min-w-[140px] text-center">
              <p className="text-[12px] font-semibold text-[#536078]">
                Đã làm:{" "}
                {answeredCount}/
                {questions.length}
              </p>

              <div className="mx-auto mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-[#e2e5ef]">
                <div
                  className="h-full rounded-full bg-[#0758d9]"
                  style={{
                    width: `${
                      questions.length > 0
                        ? (
                            answeredCount /
                            questions.length
                          ) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={
                !isInProgress ||
                isBusy ||
                currentIndex ===
                  questions.length - 1
              }
              onClick={() =>
                goToQuestion(
                  currentIndex + 1
                )
              }
              className="flex h-9 items-center gap-2 rounded-[9px] bg-[#0758d9] px-4 text-[13px] font-semibold text-white shadow-[0_2px_5px_rgba(7,88,217,0.16)] transition hover:bg-[#064fc3] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Câu tiếp

              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </section>

        {/* =================================================== */}
        {/* Question Navigator                                  */}
        {/* =================================================== */}

        <aside className="self-start lg:sticky lg:top-[84px]">
          <div className="rounded-[16px] border border-[#dedfea] bg-white px-5 py-[22px] shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[17px] font-bold text-[#101828]">
                  Danh sách câu hỏi
                </h3>

                <p className="mt-1 text-[12px] font-medium text-[#59667a]">
                  {answeredCount} /{" "}
                  {questions.length} đã trả lời
                </p>
              </div>

              <span className="rounded-full bg-[#eaf1ff] px-2.5 py-1 text-[11px] font-semibold text-[#0758d9]">
                {currentIndex + 1} /{" "}
                {questions.length}
              </span>
            </div>

            <div className="mt-4 border-t border-[#e9eaf1] pt-4">
              <div className="grid grid-cols-5 gap-2.5">
                {questions.map(
                  (
                    navQuestion,
                    index
                  ) => {
                    const navId =
                      String(
                        navQuestion.id
                      );

                    const answered =
                      answers[navId] != null &&
                      answers[navId] !== "";

                    const current =
                      currentIndex ===
                      index;

                    const flagged =
                      navQuestion.id != null &&
                      flaggedQuestionIds.includes(
                        navQuestion.id
                      );

                    return (
                      <button
                        key={
                          navQuestion.id ??
                          index
                        }
                        type="button"
                        disabled={
                          !isInProgress ||
                          isBusy
                        }
                        onClick={() =>
                          goToQuestion(
                            index
                          )
                        }
                        className={cn(
                          "relative flex size-[40px] items-center justify-center rounded-[9px] text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",

                          current
                            ? "bg-[#0758d9] text-white shadow-[0_2px_6px_rgba(7,88,217,0.28)]"
                            : answered
                              ? "bg-[#e9efff] text-[#0758d9] hover:bg-[#dfe8ff]"
                              : "bg-[#f0f1f7] text-[#4f5d73] hover:bg-[#e9ebf3]"
                        )}
                      >
                        {index + 1}

                        {!current &&
                          answered && (
                            <span className="absolute bottom-1 size-1 rounded-full bg-[#0758d9]" />
                          )}

                        {flagged && (
                          <Bookmark
                            className={cn(
                              "absolute left-1 top-1 size-2.5",

                              current
                                ? "fill-white text-white"
                                : "fill-[#0758d9] text-[#0758d9]"
                            )}
                            aria-label="Câu đã đánh dấu"
                          />
                        )}

                        {navQuestion.isCritical && (
                          <span
                            className="absolute right-1 top-1 size-1.5 rounded-full bg-[#f59e0b]"
                            title="Câu điểm liệt"
                          />
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#e9eaf1] pt-4 text-[11px] font-medium text-[#59667a]">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-[#0758d9]" />
                Đang làm
              </span>

              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#0758d9]" />
                Đã trả lời
              </span>

              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-[#e5e7ef]" />
                Chưa làm
              </span>

              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#f59e0b]" />
                Câu điểm liệt
              </span>
            </div>
          </div>
        </aside>
      </QuestionSessionShell>
    </div>
  );
}

function SessionTimer({
  initialSeconds,
  running,
  onExpire,
}: {
  initialSeconds:
    number;

  running:
    boolean;

  onExpire:
    () => void;
}) {
  const [
    remainingSeconds,
    setRemainingSeconds,
  ] =
    useState(
      initialSeconds
    );

  const expiredRef =
    useRef(
      false
    );

  useEffect(
    () => {
      if (
        !running ||
        remainingSeconds <=
          0
      ) {
        return;
      }

      const timeout =
        window.setTimeout(
          () => {
            setRemainingSeconds(
              (
                current
              ) =>
                Math.max(
                  0,
                  current -
                    1
                )
            );
          },
          1000
        );

      return () =>
        window.clearTimeout(
          timeout
        );
    },
    [
      remainingSeconds,
      running,
    ]
  );

  useEffect(
    () => {
      if (
        !running ||
        remainingSeconds !==
          0 ||
        expiredRef.current
      ) {
        return;
      }

      expiredRef.current =
        true;

      onExpire();
    },
    [
      onExpire,
      remainingSeconds,
      running,
    ]
  );

  const minutes =
    Math.floor(
      remainingSeconds /
        60
    );

  const seconds =
    remainingSeconds %
    60;

  const formattedTime =
    `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      seconds
    ).padStart(
      2,
      "0"
    )}`;

  return (
    <div className="flex h-9 items-center gap-1.5 rounded-[10px] bg-[#eff1f7] px-3.5 text-[13px] font-semibold text-[#3f4d63]">
      <Clock3 className="size-4 text-[#59667a]" />

      {
        formattedTime
      }
    </div>
  );
}

function SessionNotFound({
  onBack,
}: {
  onBack:
    () => void;
}) {
  return (
    <div className="font-dts flex min-h-screen items-center justify-center bg-[#f7f6fb] px-6">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#fff0ef] text-[#d92d20]">
          <AlertTriangle className="size-6" />
        </span>

        <h1 className="mt-4 text-[20px] font-bold text-[#101828]">
          Không tìm thấy bài thi
        </h1>

        <p className="mt-2 text-[14px] font-medium leading-6 text-[#667085]">
          Bài thi không tồn tại hoặc đã kết thúc.
          Hãy bắt đầu một bài mới từ trang Ôn luyện.
        </p>

        <button
          type="button"
          onClick={
            onBack
          }
          className="mt-5 h-10 rounded-[10px] bg-[#0758d9] px-5 text-[13px] font-semibold text-white transition hover:bg-[#064fc3]"
        >
          Quay về Ôn luyện
        </button>
      </div>
    </div>
  );
}

function RunnerSkeleton() {
  return (
    <div className="font-dts min-h-screen bg-[#f7f6fb]">
      <div className="border-b border-[#e1e2ec] bg-white">
        <div className="flex h-[64px] w-full items-center px-6 lg:px-[38px]">
          <Skeleton className="h-8 w-20" />

          <Skeleton className="ml-16 h-6 w-52" />

          <Skeleton className="ml-auto h-9 w-60" />
        </div>
      </div>

      <QuestionSessionShell>
        <Skeleton className="h-[560px] rounded-[16px]" />

        <Skeleton className="h-[330px] rounded-[16px]" />
      </QuestionSessionShell>
    </div>
  );
}