
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  finishChapterReviewSession,
  recordChapterReviewAnswer,
  saveChapterReviewCursor,
  startChapterReviewSession,
  type ChapterReviewSession,
} from "@/features/practice/chapter-review-session-service";

export const chapterReviewKeys = {
  active: (licenseClass: string, chapterId: number) =>
    [
      "practice",
      "chapter-review",
      licenseClass,
      chapterId,
    ] as const,
};

export function useActiveChapterReviewSession(
  chapterId: number,
  licenseClass: string,
  enabled: boolean
) {
  const license = licenseClass.trim().toUpperCase();

  return useQuery({
    queryKey: chapterReviewKeys.active(
      license,
      chapterId
    ),
    queryFn: () =>
      startChapterReviewSession({
        chapterId,
        licenseClass: license,
      }),
    enabled:
      enabled &&
      chapterId > 0 &&
      Boolean(license),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

function useReviewUpdate(
  licenseClass: string,
  chapterId: number
) {
  const queryClient = useQueryClient();

  const queryKey = chapterReviewKeys.active(
    licenseClass.trim().toUpperCase(),
    chapterId
  );

  return (session: ChapterReviewSession) => {
    queryClient.setQueryData<ChapterReviewSession>(
      queryKey,
      session
    );
  };
}

export function useRecordChapterReviewAnswer(
  licenseClass: string,
  chapterId: number
) {
  const update = useReviewUpdate(
    licenseClass,
    chapterId
  );

  return useMutation({
    mutationFn: recordChapterReviewAnswer,
    onSuccess: update,
    onError: () => {
      toast.error(
        "Không thể lưu đáp án ôn lại. Vui lòng thử lại."
      );
    },
  });
}

export function useSaveChapterReviewCursor(
  licenseClass: string,
  chapterId: number
) {
  const update = useReviewUpdate(
    licenseClass,
    chapterId
  );

  return useMutation({
    mutationFn: saveChapterReviewCursor,
    onSuccess: update,
    onError: () => {
      toast.error(
        "Không thể lưu vị trí ôn lại. Vui lòng thử lại."
      );
    },
  });
}

export function useFinishChapterReviewSession(
  licenseClass: string,
  chapterId: number
) {
  const update = useReviewUpdate(
    licenseClass,
    chapterId
  );

  return useMutation({
    mutationFn: finishChapterReviewSession,
    onSuccess: update,
    onError: () => {
      toast.error(
        "Không thể hoàn tất lượt ôn. Vui lòng thử lại."
      );
    },
  });
}
