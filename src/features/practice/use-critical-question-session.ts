"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getCriticalQuestionSession,
  saveCriticalQuestionCursor,
  setCriticalQuestionBookmark,
  startCriticalQuestionSession,
  submitCriticalQuestionAnswer,
} from "@/features/practice/critical-question-session-service";
import type {
  CriticalQuestionSession,
  SaveCriticalQuestionCursorRequest,
  SetCriticalQuestionBookmarkRequest,
  StartCriticalQuestionSessionRequest,
  SubmitCriticalQuestionAnswerRequest,
} from "@/features/practice/critical-session-types";
import { criticalProgressKeys } from "@/features/practice/use-critical-overview";
import { ApiError } from "@/lib/api";

export const criticalQuestionSessionKeys = {
  all: ["practice", "critical-question-session"] as const,
  session: (sessionId: string) => [...criticalQuestionSessionKeys.all, sessionId] as const,
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function useCriticalQuestionSession(sessionId?: string) {
  const normalizedSessionId = sessionId?.trim() ?? "";

  return useQuery({
    queryKey: criticalQuestionSessionKeys.session(normalizedSessionId),
    queryFn: () => getCriticalQuestionSession(normalizedSessionId),
    enabled: Boolean(normalizedSessionId),
    staleTime: 0,
    retry: false,
    refetchOnMount: "always",
  });
}

export function useStartCriticalQuestionSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StartCriticalQuestionSessionRequest) =>
      startCriticalQuestionSession(payload),

    onSuccess: (session) => {
      queryClient.setQueryData(
        criticalQuestionSessionKeys.session(session.sessionId),
        session
      );
    },

    onError: (error) => {
      toast.error(
        errorMessage(error, "Không thể bắt đầu phiên câu điểm liệt")
      );
    },
  });
}

export function useSubmitCriticalQuestionAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitCriticalQuestionAnswerRequest) =>
      submitCriticalQuestionAnswer(payload),

    onSuccess: (response, variables) => {
      const queryKey = criticalQuestionSessionKeys.session(
        variables.sessionId
      );

      queryClient.setQueryData<CriticalQuestionSession>(
        queryKey,
        (current) => {
          if (!current) {
            return current;
          }

          const answerKey = String(response.questionId);

          const question = current.questions.find(
            (item) => item.questionId === response.questionId
          );

          const countedBefore =
            Boolean(question?.learnedBeforeSession) ||
            Boolean(current.answers[answerKey]);

          return {
            ...current,

            answers: {
              ...current.answers,
              [answerKey]: response,
            },

            answeredQuestions: countedBefore
              ? current.answeredQuestions
              : Math.min(
                  current.totalQuestions,
                  current.answeredQuestions + 1
                ),
          };
        }
      );

      void queryClient.invalidateQueries({
        queryKey,
      });

      void queryClient.invalidateQueries({
        queryKey: criticalProgressKeys.overview(
          variables.licenseClass
        ),
      });
    },

    onError: (error) => {
      toast.error(
        errorMessage(error, "Không thể lưu câu trả lời")
      );
    },
  });
}

export function useSaveCriticalQuestionCursor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      sessionId: string;
      payload: SaveCriticalQuestionCursorRequest;
    }) =>
      saveCriticalQuestionCursor(
        sessionId,
        payload
      ),

    onMutate: async (variables) => {
      const queryKey = criticalQuestionSessionKeys.session(
        variables.sessionId
      );

      await queryClient.cancelQueries({
        queryKey,
      });

      const previous =
        queryClient.getQueryData<CriticalQuestionSession>(
          queryKey
        );

      queryClient.setQueryData<CriticalQuestionSession>(
        queryKey,
        (current) => {
          if (!current) {
            return current;
          }

          const question = current.questions.find(
            (item) =>
              item.questionId ===
              variables.payload.questionId
          );

          if (!question) {
            return current;
          }

          return {
            ...current,
            currentQuestionId: question.questionId,
            currentPosition: question.position,
          };
        }
      );

      return {
        previous,
      };
    },

    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          criticalQuestionSessionKeys.session(
            variables.sessionId
          ),
          context.previous
        );
      }

      toast.error(
        errorMessage(error, "Không thể lưu vị trí hiện tại")
      );
    },

    onSuccess: (session) => {
      queryClient.setQueryData(
        criticalQuestionSessionKeys.session(
          session.sessionId
        ),
        session
      );
    },
  });
}

export function useToggleCriticalQuestionBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chapterId,
      questionId,
      payload,
    }: {
      sessionId: string;
      chapterId: number;
      questionId: number;
      payload: SetCriticalQuestionBookmarkRequest;
    }) =>
      setCriticalQuestionBookmark(
        chapterId,
        questionId,
        payload
      ),

    onSuccess: (response, variables) => {
      queryClient.setQueryData<CriticalQuestionSession>(
        criticalQuestionSessionKeys.session(
          variables.sessionId
        ),
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,

            questions: current.questions.map(
              (question) =>
                question.questionId === response.questionId
                  ? {
                      ...question,
                      bookmarked: response.bookmarked,
                    }
                  : question
            ),
          };
        }
      );
    },

    onError: (error) => {
      toast.error(
        errorMessage(error, "Không thể cập nhật đánh dấu")
      );
    },
  });
}