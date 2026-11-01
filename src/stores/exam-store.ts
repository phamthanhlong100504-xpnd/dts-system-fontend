import {
  useCallback,
  useSyncExternalStore,
} from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  ExamMode,
  ExamSessionResponse,
  ExamStatus,
  Question,
} from "@/features/practice/practice-service";

/** Feedback đúng/sai cho 1 câu ở PRACTICE mode */
export interface AnswerFeedback {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

interface ExamState {
  examId: string | null;
  mode: ExamMode | null;
  examType: string;

  totalQuestions: number;
  durationMinutes: number;

  expiresAt: string | null;
  remainingTimeMs: number | null;

  startedAt: string | null;
  status: ExamStatus | null;

  questions: Question[];

  /** key = String(questionId), value = selectedAnswer */
  answers: Record<string, string>;

  /** PRACTICE mode: feedback theo câu */
  feedback: Record<string, AnswerFeedback>;

  /** Vị trí câu hiện tại phía UI, zero-based */
  currentIndex: number;

  /** ID câu hiện tại; backend persist khi pause */
  currentQuestionId: number | null;

  startSession: (
    session: ExamSessionResponse
  ) => void;

  syncSession: (
    session: ExamSessionResponse
  ) => void;

  setAnswer: (
    questionId: number,
    label: string
  ) => void;

  removeAnswer: (
    questionId: number
  ) => void;

  setFeedback: (
    questionId: number,
    feedback: AnswerFeedback
  ) => void;

  setCurrentIndex: (
    index: number
  ) => void;

  clear: () => void;
}

function createInitialData() {
  return {
    examId: null,
    mode: null,
    examType: "",

    totalQuestions: 0,
    durationMinutes: 0,

    expiresAt: null,
    remainingTimeMs: null,

    startedAt: null,
    status: null,

    questions: [] as Question[],
    answers: {} as Record<
      string,
      string
    >,
    feedback: {} as Record<
      string,
      AnswerFeedback
    >,

    currentIndex: 0,
    currentQuestionId: null,
  };
}

function normalizeAnswers(
  answers?: Record<
    string,
    string
  >
): Record<string, string> {
  if (!answers) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(
      answers
    ).filter(
      ([
        questionId,
        selectedAnswer,
      ]) =>
        Boolean(
          questionId
        ) &&
        typeof selectedAnswer ===
          "string" &&
        selectedAnswer.length >
          0
    )
  );
}

function findQuestionIndex(
  questions: Question[],
  questionId?:
    | number
    | null
) {
  if (
    questionId ==
    null
  ) {
    return -1;
  }

  return questions.findIndex(
    (question) =>
      question.id ===
      questionId
  );
}

function clampCurrentIndex(
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
    questions.length - 1
  );
}

function reconcileFeedback(
  feedback: Record<
    string,
    AnswerFeedback
  >,
  answers: Record<
    string,
    string
  >
) {
  return Object.fromEntries(
    Object.entries(
      feedback
    ).filter(
      ([
        questionId,
      ]) =>
        answers[
          questionId
        ] != null
    )
  );
}

const initialState: ExamState = {
  ...createInitialData(),

  startSession:
    () => {},
  syncSession:
    () => {},

  setAnswer:
    () => {},
  removeAnswer:
    () => {},

  setFeedback:
    () => {},
  setCurrentIndex:
    () => {},

  clear:
    () => {},
};

export const useExamStore =
  create<ExamState>()(
    persist(
      (set) => ({
        ...initialState,

        startSession:
          (session) =>
            set(() => {
              const questions =
                session.questions ??
                [];

              const answers =
                normalizeAnswers(
                  session.answers
                );

              const backendIndex =
                findQuestionIndex(
                  questions,
                  session.currentQuestionId
                );

              const currentIndex =
                backendIndex >= 0
                  ? backendIndex
                  : 0;

              return {
                examId:
                  session.examId ??
                  null,

                mode:
                  session.mode ??
                  null,

                examType:
                  session.examType ??
                  "",

                totalQuestions:
                  session.totalQuestions ??
                  questions.length,

                durationMinutes:
                  session.durationMinutes ??
                  0,

                expiresAt:
                  session.expiresAt ??
                  null,

                remainingTimeMs:
                  session.remainingTimeMs ??
                  null,

                startedAt:
                  session.startedAt ??
                  null,

                status:
                  session.status ??
                  "IN_PROGRESS",

                questions,
                answers,

                feedback: {},

                currentIndex,

                currentQuestionId:
                  questions[
                    currentIndex
                  ]?.id ??
                  session.currentQuestionId ??
                  null,
              };
            }),

        syncSession:
          (session) =>
            set(
              (
                state
              ) => {
                const questions =
                  session.questions ??
                  [];

                const answers =
                  normalizeAnswers(
                    session.answers
                  );

                const sameSession =
                  state.examId ===
                  session.examId;

                const backendIndex =
                  findQuestionIndex(
                    questions,
                    session.currentQuestionId
                  );

                /**
                 * PAUSED:
                 * backend currentQuestionId authoritative.
                 *
                 * IN_PROGRESS cùng session:
                 * giữ currentIndex UI hiện tại.
                 *
                 * Session mới:
                 * backend currentQuestionId làm fallback.
                 */
                let currentIndex =
                  0;

                if (
                  session.status ===
                    "PAUSED" &&
                  backendIndex >=
                    0
                ) {
                  currentIndex =
                    backendIndex;
                } else if (
                  sameSession
                ) {
                  currentIndex =
                    clampCurrentIndex(
                      state.currentIndex,
                      questions
                    );
                } else if (
                  backendIndex >=
                  0
                ) {
                  currentIndex =
                    backendIndex;
                }

                const feedback =
                  sameSession
                    ? reconcileFeedback(
                        state.feedback,
                        answers
                      )
                    : {};

                return {
                  examId:
                    session.examId ??
                    null,

                  mode:
                    session.mode ??
                    null,

                  examType:
                    session.examType ??
                    "",

                  totalQuestions:
                    session.totalQuestions ??
                    questions.length,

                  durationMinutes:
                    session.durationMinutes ??
                    0,

                  expiresAt:
                    session.expiresAt ??
                    null,

                  remainingTimeMs:
                    session.remainingTimeMs ??
                    null,

                  startedAt:
                    session.startedAt ??
                    null,

                  status:
                    session.status ??
                    null,

                  questions,
                  answers,
                  feedback,

                  currentIndex,

                  currentQuestionId:
                    questions[
                      currentIndex
                    ]?.id ??
                    session.currentQuestionId ??
                    null,
                };
              }
            ),

        setAnswer:
          (
            questionId,
            label
          ) =>
            set(
              (
                state
              ) => ({
                answers: {
                  ...state.answers,

                  [String(
                    questionId
                  )]:
                    label,
                },
              })
            ),

        removeAnswer:
          (
            questionId
          ) =>
            set(
              (
                state
              ) => {
                const questionKey =
                  String(
                    questionId
                  );

                const answers = {
                  ...state.answers,
                };

                const feedback = {
                  ...state.feedback,
                };

                delete answers[
                  questionKey
                ];

                delete feedback[
                  questionKey
                ];

                return {
                  answers,
                  feedback,
                };
              }
            ),

        setFeedback:
          (
            questionId,
            feedback
          ) =>
            set(
              (
                state
              ) => ({
                feedback: {
                  ...state.feedback,

                  [String(
                    questionId
                  )]:
                    feedback,
                },
              })
            ),

        setCurrentIndex:
          (
            index
          ) =>
            set(
              (
                state
              ) => {
                const nextIndex =
                  clampCurrentIndex(
                    index,
                    state.questions
                  );

                return {
                  currentIndex:
                    nextIndex,

                  currentQuestionId:
                    state.questions[
                      nextIndex
                    ]?.id ??
                    null,
                };
              }
            ),

        clear: () =>
          set(
            createInitialData()
          ),
      }),
      {
        name:
          "dts-exam",

        skipHydration:
          true,

        partialize:
          (state) => ({
            examId:
              state.examId,

            mode:
              state.mode,

            examType:
              state.examType,

            totalQuestions:
              state.totalQuestions,

            durationMinutes:
              state.durationMinutes,

            expiresAt:
              state.expiresAt,

            remainingTimeMs:
              state.remainingTimeMs,

            startedAt:
              state.startedAt,

            status:
              state.status,

            questions:
              state.questions,

            answers:
              state.answers,

            feedback:
              state.feedback,

            currentIndex:
              state.currentIndex,

            currentQuestionId:
              state.currentQuestionId,
          }),
      }
    )
  );

export function useHasExamHydrated(): boolean {
  const subscribe =
    useCallback(
      (
        onChange:
          () => void
      ) =>
        useExamStore.persist.onFinishHydration(
          onChange
        ),
      []
    );

  return useSyncExternalStore(
    subscribe,
    () =>
      useExamStore.persist.hasHydrated(),
    () => false
  );
}
