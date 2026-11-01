"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  finishWrongQuestionSession,
  getWrongQuestionSession,
  saveWrongQuestionCursor,
  setWrongQuestionBookmark,
  startWrongQuestionSession,
  submitWrongQuestionAnswer,
} from "@/features/practice/wrong-question-session-service";
import type {
  StartWrongQuestionSessionRequest,
  SubmitWrongQuestionAnswerRequest,
  WrongQuestionReviewSession,
} from "@/features/practice/wrong-question-session-types";
import { wrongQuestionsKeys } from "@/features/practice/use-wrong-questions";
import { ApiError } from "@/lib/api";

export const wrongQuestionSessionKeys = {
  all: ["practice", "wrong-question-session"] as const,

  session: (sessionId: string) =>
    [
      ...wrongQuestionSessionKeys.all,
      sessionId,
    ] as const,
};

function errorMessage(
  error: unknown,
  fallback: string
) {
  return error instanceof ApiError
    ? error.message
    : fallback;
}

export function useWrongQuestionSession(
  sessionId?: string
) {
  const normalizedSessionId =
    sessionId?.trim() ?? "";

  return useQuery({
    queryKey:
      wrongQuestionSessionKeys.session(
        normalizedSessionId
      ),

    queryFn: () =>
      getWrongQuestionSession(
        normalizedSessionId
      ),

    enabled: Boolean(normalizedSessionId),

    staleTime: 0,
    retry: false,
    refetchOnMount: "always",
  });
}

export function useStartWrongQuestionSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: StartWrongQuestionSessionRequest
    ) =>
      startWrongQuestionSession(
        payload
      ),

    onSuccess: (session) => {
      queryClient.setQueryData(
        wrongQuestionSessionKeys.session(
          session.sessionId
        ),
        session
      );
    },

    onError: (error) => {
      toast.error(
        errorMessage(
          error,
          "Không thể bắt đầu phiên ôn câu sai"
        )
      );
    },
  });
}

export function useSubmitWrongQuestionAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      sessionId: string;
      payload: SubmitWrongQuestionAnswerRequest;
    }) =>
      submitWrongQuestionAnswer(
        sessionId,
        payload
      ),

    onSuccess: (
      response,
      variables
    ) => {
      const queryKey =
        wrongQuestionSessionKeys.session(
          variables.sessionId
        );

      queryClient.setQueryData<WrongQuestionReviewSession>(
        queryKey,
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,

            answers: {
              ...current.answers,

              [String(
                response.questionId
              )]: {
                questionId:
                  response.questionId,

                selectedAnswer:
                  response.selectedAnswer,

                isCorrect:
                  response.isCorrect,

                answeredAt:
                  response.answeredAt,
              },
            },
          };
        }
      );

      void queryClient.invalidateQueries({
        queryKey,
      });

      void queryClient.invalidateQueries({
        queryKey:
          wrongQuestionsKeys.all,
      });
    },

    onError: (error) => {
      toast.error(
        errorMessage(
          error,
          "Không thể lưu câu trả lời"
        )
      );
    },
  });
}

export function useSaveWrongQuestionCursor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      questionId,
    }: {
      sessionId: string;
      questionId: number;
    }) =>
      saveWrongQuestionCursor(
        sessionId,
        {
          questionId,
        }
      ),

    onMutate: async (
      variables
    ) => {
      const queryKey =
        wrongQuestionSessionKeys.session(
          variables.sessionId
        );

      await queryClient.cancelQueries({
        queryKey,
      });

      const previous =
        queryClient.getQueryData<WrongQuestionReviewSession>(
          queryKey
        );

      queryClient.setQueryData<WrongQuestionReviewSession>(
        queryKey,
        (current) => {
          if (!current) {
            return current;
          }

          const question =
            current.questions.find(
              (item) =>
                item.questionId ===
                variables.questionId
            );

          if (!question) {
            return current;
          }

          return {
            ...current,

            currentQuestionId:
              question.questionId,

            currentPosition:
              question.position,
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
          wrongQuestionSessionKeys.session(
            variables.sessionId
          ),
          context.previous
        );
      }

      toast.error(
        errorMessage(
          error,
          "Không thể lưu vị trí hiện tại"
        )
      );
    },

    onSuccess: (
      session,
      variables
    ) => {

      queryClient.setQueryData(
        wrongQuestionSessionKeys.session(
          variables.sessionId
        ),
        session
      );
    },
  });
}

export function useFinishWrongQuestionSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      sessionId: string
    ) =>
      finishWrongQuestionSession(
        sessionId
      ),

    onSuccess: (session) => {

      queryClient.setQueryData(
        wrongQuestionSessionKeys.session(
          session.sessionId
        ),
        session
      );

      void queryClient.invalidateQueries({
        queryKey:
          wrongQuestionsKeys.all,
      });
    },

    onError: (error) => {
      toast.error(
        errorMessage(
          error,
          "Không thể hoàn thành phiên ôn tập"
        )
      );
    },
  });
}

export function useToggleWrongQuestionBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      licenseClass,
      chapterId,
      questionId,
      bookmarked,
    }: {
      sessionId: string;
      licenseClass: string;
      chapterId: number;
      questionId: number;
      bookmarked: boolean;
    }) =>
      setWrongQuestionBookmark(
        chapterId,
        questionId,
        {
          licenseClass,
          bookmarked,
        }
      ),

    onSuccess: (
      _response,
      variables
    ) => {

      void queryClient.invalidateQueries({
        queryKey:
          wrongQuestionSessionKeys.session(
            variables.sessionId
          ),
      });
    },

    onError: (error) => {
      toast.error(
        errorMessage(
          error,
          "Không thể cập nhật đánh dấu"
        )
      );
    },
  });
}