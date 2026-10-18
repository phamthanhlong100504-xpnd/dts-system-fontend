"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  finishExam,
  getActiveExam,
  getCriticalQuestions,
  getExamFlags,
  getExamHistory,
  getExamResult,
  getExamSession,
  getLeaderboard,
  getQuestionStats,
  pauseExam,
  resumeExam,
  retryExam,
  startExam,
  submitAnswer,
  updateExamCursor,
  updateExamFlag,
  type ExamFlagsResponse,
  type ExamSessionResponse,
  type SubmitAnswerRequest,
} from "./practice-service";

import { logStudySession } from "@/features/progress/progress-service";
import { progressKeys } from "@/features/progress/use-progress";
import { ApiError } from "@/lib/api";
import { useExamStore } from "@/stores/exam-store";

export const practiceKeys = {
  stats: (licenseClass?: string) =>
    [
      "practice",
      "question-stats",
      licenseClass ?? "all",
    ] as const,

  critical: (licenseClass?: string) =>
    [
      "practice",
      "critical",
      licenseClass ?? "all",
    ] as const,

  activeExam: (licenseClass: string) =>
    [
      "practice",
      "active-exam",
      licenseClass,
    ] as const,

  session: (examId: string) =>
    [
      "practice",
      "exam-session",
      examId,
    ] as const,

  flags: (examId: string) =>
    [
      "practice",
      "exam-flags",
      examId,
    ] as const,

  result: (examId: string) =>
    [
      "practice",
      "exam-result",
      examId,
    ] as const,

  history: (page: number, size: number) =>
    [
      "practice",
      "exam-history",
      page,
      size,
    ] as const,

  leaderboard: (examType: string, period: string) =>
    [
      "practice",
      "leaderboard",
      examType,
      period,
    ] as const,
};

export function useQuestionStats(
  licenseClass?: string
) {
  return useQuery({
    queryKey:
      practiceKeys.stats(
        licenseClass
      ),

    queryFn: () =>
      getQuestionStats(
        licenseClass
      ),

    staleTime:
      5 * 60_000,
  });
}

export function useCriticalQuestions(
  licenseClass?: string
) {
  return useQuery({
    queryKey:
      practiceKeys.critical(
        licenseClass
      ),

    queryFn: () =>
      getCriticalQuestions(
        licenseClass
      ),

    staleTime:
      5 * 60_000,
  });
}

export function useActiveExam(
  licenseClass?: string
) {
  const normalizedLicense =
    licenseClass
      ?.trim()
      .toUpperCase() ?? "";

  return useQuery({
    queryKey:
      practiceKeys.activeExam(
        normalizedLicense
      ),

    queryFn: () =>
      getActiveExam(
        normalizedLicense
      ),

    enabled:
      Boolean(
        normalizedLicense
      ),

    staleTime: 15_000,
    refetchOnMount: "always",
  });
}

export function useStartExam() {
  return useMutation({
    mutationFn: startExam,
  });
}

export function useStartExamAndGo() {
  const router =
    useRouter();

  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: startExam,

    onSuccess: (session) => {
      if (!session.examId) {
        toast.error(
          "Backend không trả về mã bài thi"
        );

        return;
      }

      queryClient.setQueryData(
        practiceKeys.session(
          session.examId
        ),
        session
      );

      useExamStore
        .getState()
        .startSession(
          session
        );

      if (session.examType) {
        void queryClient.invalidateQueries({
          queryKey:
            practiceKeys.activeExam(
              session.examType
            ),
        });
      }

      router.push(
        `/practice/exam/${session.examId}`
      );
    },

    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Không thể bắt đầu bài thi"
      );
    },
  });
}

export function useRetryExamAndGo() {
  const router =
    useRouter();

  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: retryExam,

    onSuccess: (session) => {
      if (!session.examId) {
        toast.error(
          "Backend không trả về mã bài thi mới"
        );

        return;
      }

      queryClient.setQueryData(
        practiceKeys.session(
          session.examId
        ),
        session
      );

      if (session.examType) {
        void queryClient.invalidateQueries({
          queryKey:
            practiceKeys.activeExam(
              session.examType
            ),
        });
      }

      router.push(
        `/practice/exam/${session.examId}`
      );
    },

    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Không thể làm lại đề"
      );
    },
  });
}

export function useExamSession(
  examId: string
) {
  return useQuery({
    queryKey:
      practiceKeys.session(
        examId
      ),

    queryFn: () =>
      getExamSession(
        examId
      ),

    enabled:
      Boolean(
        examId
      ),

    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useExamFlags(
  examId: string
) {
  return useQuery({
    queryKey:
      practiceKeys.flags(
        examId
      ),

    queryFn: () =>
      getExamFlags(
        examId
      ),

    enabled:
      Boolean(
        examId
      ),

    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useUpdateExamFlag() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      examId,
      questionId,
      flagged,
    }: {
      examId: string;
      questionId: number;
      flagged: boolean;
    }) =>
      updateExamFlag(
        examId,
        questionId,
        {
          flagged,
        }
      ),

    onMutate: async (
      variables
    ) => {
      const queryKey =
        practiceKeys.flags(
          variables.examId
        );

      await queryClient.cancelQueries({
        queryKey,
      });

      const previous =
        queryClient.getQueryData<ExamFlagsResponse>(
          queryKey
        );

      queryClient.setQueryData<ExamFlagsResponse>(
        queryKey,
        (current) => {
          if (!current) {
            return current;
          }

          const currentIds =
            current.flaggedQuestionIds ??
            [];

          const nextIds =
            variables.flagged
              ? Array.from(
                  new Set([
                    ...currentIds,
                    variables.questionId,
                  ])
                )
              : currentIds.filter(
                  (questionId) =>
                    questionId !==
                    variables.questionId
                );

          return {
            ...current,
            flaggedQuestionIds:
              nextIds,
          };
        }
      );

      return {
        previous,
      };
    },

    onError: (
      error,
      variables,
      context
    ) => {
      if (context?.previous) {
        queryClient.setQueryData(
          practiceKeys.flags(
            variables.examId
          ),
          context.previous
        );
      }

      toast.error(
        error instanceof ApiError
          ? error.message
          : "Không thể cập nhật đánh dấu câu hỏi"
      );
    },

    onSuccess: (
      flags,
      variables
    ) => {
      queryClient.setQueryData(
        practiceKeys.flags(
          variables.examId
        ),
        flags
      );
    },
  });
}

export function useUpdateExamCursor() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      examId,
      currentQuestionId,
    }: {
      examId: string;
      currentQuestionId: number;
    }) =>
      updateExamCursor(
        examId,
        {
          currentQuestionId,
        }
      ),

    onMutate: async (
      variables
    ) => {
      const queryKey =
        practiceKeys.session(
          variables.examId
        );

      await queryClient.cancelQueries({
        queryKey,
      });

      const previous =
        queryClient.getQueryData<ExamSessionResponse>(
          queryKey
        );

      queryClient.setQueryData<ExamSessionResponse>(
        queryKey,
        (current) =>
          current
            ? {
                ...current,

                currentQuestionId:
                  variables.currentQuestionId,
              }
            : current
      );

      return {
        previous,
      };
    },

    onError: (
      error,
      variables,
      context
    ) => {
      if (context?.previous) {
        queryClient.setQueryData(
          practiceKeys.session(
            variables.examId
          ),
          context.previous
        );
      }

      toast.error(
        error instanceof ApiError
          ? error.message
          : "Không thể lưu vị trí câu hỏi hiện tại"
      );
    },

    onSuccess: (
      response,
      variables
    ) => {
      queryClient.setQueryData<ExamSessionResponse>(
        practiceKeys.session(
          variables.examId
        ),
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,

            ...(response ?? {}),

            currentQuestionId:
              response?.currentQuestionId ??
              variables.currentQuestionId,
          };
        }
      );
    },
  });
}

export function usePauseExam() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      examId,
      currentQuestionId,
    }: {
      examId: string;
      currentQuestionId: number;
    }) =>
      pauseExam(
        examId,
        {
          currentQuestionId,
        }
      ),

    onSuccess: (
      session,
      variables
    ) => {
      queryClient.setQueryData(
        practiceKeys.session(
          variables.examId
        ),
        session
      );

      if (session.examType) {
        void queryClient.invalidateQueries({
          queryKey:
            practiceKeys.activeExam(
              session.examType
            ),
        });
      }
    },

    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Không thể tạm dừng bài thi"
      );
    },
  });
}

export function useResumeExam() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      examId: string
    ) =>
      resumeExam(
        examId
      ),

    onSuccess: (
      session,
      examId
    ) => {
      queryClient.setQueryData(
        practiceKeys.session(
          examId
        ),
        session
      );

      if (session.examType) {
        void queryClient.invalidateQueries({
          queryKey:
            practiceKeys.activeExam(
              session.examType
            ),
        });
      }
    },

    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Không thể tiếp tục bài thi"
      );
    },
  });
}

export function useSubmitAnswer() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      examId,
      payload,
    }: {
      examId: string;
      payload: SubmitAnswerRequest;
    }) =>
      submitAnswer(
        examId,
        payload
      ),

    onSuccess: (
      _response,
      variables
    ) => {
      queryClient.setQueryData<ExamSessionResponse>(
        practiceKeys.session(
          variables.examId
        ),
        (current) => {
          if (!current) {
            return current;
          }

          const answers =
            current.answers ?? {};

          const wasAnswered =
            Boolean(
              answers[
                variables.payload.questionId
              ]
            );

          return {
            ...current,

            answers: {
              ...answers,

              [variables.payload.questionId]:
                variables.payload.selectedAnswer,
            },

            answeredCount:
              wasAnswered
                ? current.answeredCount
                : (current.answeredCount ??
                    0) + 1,
          };
        }
      );
    },
  });
}

export function useFinishExam() {
  const router =
    useRouter();

  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: finishExam,

    onSuccess: async (
      result,
      examId
    ) => {
      const examKey =
        result.examId ??
        examId;

      const storageKey =
        `dts_logged_${examKey}`;

      const alreadyLogged =
        sessionStorage.getItem(
          storageKey
        ) === "true";

      if (!alreadyLogged) {
        try {
          const startedAt =
            result.startedAt
              ? new Date(
                  result.startedAt
                ).getTime()
              : Date.now();

          const completedAt =
            result.completedAt
              ? new Date(
                  result.completedAt
                ).getTime()
              : Date.now();

          const durationSeconds =
            Math.max(
              1,
              Math.round(
                (
                  completedAt -
                  startedAt
                ) /
                  1000
              )
            );

          await logStudySession({
            sessionType:
              result.mode ===
              "PRACTICE"
                ? "PRACTICE"
                : "EXAM",

            examType:
              result.examType ??
              "B2",

            mode:
              result.mode ??
              "EXAM",

            examId:
              examKey,

            questionsCount:
              result.totalQuestions ??
              25,

            correctCount:
              result.correctCount ??
              0,

            wrongCount:
              result.wrongCount ??
              0,

            durationSeconds,
          });

          sessionStorage.setItem(
            storageKey,
            "true"
          );

          void queryClient.invalidateQueries({
            queryKey:
              progressKeys.dashboard,
          });
        } catch (error) {
          console.error(
            "Failed to log progress session:",
            error
          );
        }
      }

      useExamStore
        .getState()
        .clear();

      queryClient.removeQueries({
        queryKey:
          practiceKeys.session(
            examId
          ),
      });

      queryClient.removeQueries({
        queryKey:
          practiceKeys.flags(
            examId
          ),
      });

      if (result.examType) {
        void queryClient.invalidateQueries({
          queryKey:
            practiceKeys.activeExam(
              result.examType
            ),
        });
      }

      toast.success(
        result.status === "TIMEOUT"
          ? "Bài thi đã hết giờ"
          : "Đã nộp bài"
      );

      router.push(
        `/practice/result/${examKey}`
      );
    },

    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Nộp bài thất bại"
      );
    },
  });
}

export function useExamResult(
  examId: string
) {
  return useQuery({
    queryKey:
      practiceKeys.result(
        examId
      ),

    queryFn: () =>
      getExamResult(
        examId
      ),

    enabled:
      Boolean(
        examId
      ),

    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

/**
 * Lịch sử thi.
 */
export function useExamHistory(
  page: number,
  size: number
) {
  return useQuery({
    queryKey:
      practiceKeys.history(
        page,
        size
      ),

    queryFn: () =>
      getExamHistory(
        page,
        size
      ),

    placeholderData: (
      previous
    ) =>
      previous,
  });
}

/**
 * Bảng xếp hạng.
 */
export function useLeaderboard(
  examType: string,
  period: string
) {
  return useQuery({
    queryKey:
      practiceKeys.leaderboard(
        examType,
        period
      ),

    queryFn: () =>
      getLeaderboard(
        examType,
        period
      ),

    staleTime:
      30_000,
  });
}