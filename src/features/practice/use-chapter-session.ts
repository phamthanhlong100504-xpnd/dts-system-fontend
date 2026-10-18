"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getChapterBookmarks,
  getChapterLearnedAnswers,
  recordChapterAnswer,
  saveChapterCursor,
  setChapterBookmark,
  type ChapterBookmarks,
  type ChapterLearnedAnswer,
} from "@/features/practice/chapter-learning-service";
import { getQuestionsByChapter } from "@/features/practice/practice-service";
import { chapterOverviewKeys } from "@/features/practice/use-chapter-overview";

export const chapterSessionKeys = {
  all: [
    "practice",
    "chapter-session",
  ] as const,

  questions: (
    licenseClass: string,
    chapterId: number
  ) =>
    [
      ...chapterSessionKeys.all,
      "questions",
      licenseClass,
      chapterId,
    ] as const,

  learnedAnswers: (
    licenseClass: string,
    chapterId: number
  ) =>
    [
      ...chapterSessionKeys.all,
      "learned-answers",
      licenseClass,
      chapterId,
    ] as const,

  bookmarks: (
    licenseClass: string,
    chapterId: number
  ) =>
    [
      ...chapterSessionKeys.all,
      "bookmarks",
      licenseClass,
      chapterId,
    ] as const,
};

function normalizeLicense(
  licenseClass?: string
) {
  return (
    licenseClass
      ?.trim()
      .toUpperCase() ?? ""
  );
}

export function useChapterSessionQuestions(
  chapterId?: number,
  licenseClass?: string
) {
  const normalizedLicense =
    normalizeLicense(licenseClass);

  return useQuery({
    queryKey:
      chapterSessionKeys.questions(
        normalizedLicense,
        chapterId ?? 0
      ),

    queryFn: () =>
      getQuestionsByChapter(
        chapterId!,
        normalizedLicense
      ),

    enabled: Boolean(
      chapterId &&
        chapterId > 0 &&
        normalizedLicense
    ),

    staleTime: 5 * 60_000,
  });
}

export function useChapterLearnedAnswers(
  chapterId?: number,
  licenseClass?: string
) {
  const normalizedLicense =
    normalizeLicense(licenseClass);

  return useQuery({
    queryKey:
      chapterSessionKeys.learnedAnswers(
        normalizedLicense,
        chapterId ?? 0
      ),

    queryFn: () =>
      getChapterLearnedAnswers({
        chapterId: chapterId!,
        licenseClass:
          normalizedLicense,
      }),

    enabled: Boolean(
      chapterId &&
        chapterId > 0 &&
        normalizedLicense
    ),

    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useChapterBookmarks(
  chapterId?: number,
  licenseClass?: string
) {
  const normalizedLicense =
    normalizeLicense(licenseClass);

  return useQuery({
    queryKey:
      chapterSessionKeys.bookmarks(
        normalizedLicense,
        chapterId ?? 0
      ),

    queryFn: () =>
      getChapterBookmarks({
        chapterId: chapterId!,
        licenseClass:
          normalizedLicense,
      }),

    enabled: Boolean(
      chapterId &&
        chapterId > 0 &&
        normalizedLicense
    ),

    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useRecordChapterAnswer() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn:
      recordChapterAnswer,

    onSuccess: (
      response,
      variables
    ) => {
      const license =
        normalizeLicense(
          variables.licenseClass
        );

      const answersKey =
        chapterSessionKeys.learnedAnswers(
          license,
          variables.chapterId
        );

      queryClient.setQueryData<
        ChapterLearnedAnswer[]
      >(
        answersKey,
        (current = []) => {
          const existing =
            current.find(
              (answer) =>
                answer.questionId ===
                response.questionId
            );

          if (!existing) {
            return [
              ...current,
              {
                questionId:
                  response.questionId,

                selectedAnswer:
                  response.selectedAnswer,

                isCorrect:
                  response.isCorrect,

                learnedAt:
                  response.answeredAt,

                lastAnsweredAt:
                  response.answeredAt,
              },
            ];
          }

          return current.map(
            (answer) =>
              answer.questionId ===
              response.questionId
                ? {
                    ...answer,

                    selectedAnswer:
                      response.selectedAnswer,

                    isCorrect:
                      response.isCorrect,

                    lastAnsweredAt:
                      response.answeredAt,
                  }
                : answer
          );
        }
      );

      void queryClient.invalidateQueries({
        queryKey: answersKey,
      });

      void queryClient.invalidateQueries({
        queryKey:
          chapterOverviewKeys.byLicense(
            license
          ),
      });
    },

    onError: () => {
      toast.error(
        "Không thể lưu câu trả lời. Vui lòng thử lại."
      );
    },
  });
}

export function useSaveChapterCursor() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn:
      saveChapterCursor,

    onSuccess: (
      _cursor,
      variables
    ) => {
      const license =
        normalizeLicense(
          variables.licenseClass
        );

      void queryClient.invalidateQueries({
        queryKey:
          chapterOverviewKeys.byLicense(
            license
          ),
      });
    },

    onError: () => {
      toast.error(
        "Không thể lưu vị trí hiện tại."
      );
    },
  });
}

export function useSetChapterBookmark() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn:
      setChapterBookmark,

    onSuccess: (
      response,
      variables
    ) => {
      const license =
        normalizeLicense(
          variables.licenseClass
        );

      const queryKey =
        chapterSessionKeys.bookmarks(
          license,
          variables.chapterId
        );

      queryClient.setQueryData<
        ChapterBookmarks
      >(
        queryKey,
        (current) => {
          const ids =
            new Set(
              current?.questionIds ??
                []
            );

          if (
            response.bookmarked
          ) {
            ids.add(
              response.questionId
            );
          } else {
            ids.delete(
              response.questionId
            );
          }

          return {
            chapterId:
              response.chapterId,

            licenseClass:
              response.licenseClass,

            questionIds:
              Array.from(ids).sort(
                (a, b) => a - b
              ),
          };
        }
      );

      void queryClient.invalidateQueries({
        queryKey,
      });
    },

    onError: () => {
      toast.error(
        "Không thể cập nhật đánh dấu câu hỏi. Vui lòng thử lại."
      );
    },
  });
}