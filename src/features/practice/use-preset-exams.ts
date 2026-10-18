"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  getPresetExamSets,
  startPresetExam,
} from "@/features/practice/preset-exam-service";
import type { StartPresetExamRequest } from "@/features/practice/preset-exam-types";
import { practiceKeys } from "@/features/practice/use-practice";
import { ApiError } from "@/lib/api";

export const presetExamKeys = {
  all: ["practice", "preset-exams"] as const,

  list: (licenseClass: string) =>
    [
      ...presetExamKeys.all,
      "list",
      licenseClass,
    ] as const,
};

export function usePresetExamSets(
  licenseClass?: string
) {
  const normalizedLicense =
    licenseClass?.trim().toUpperCase() ?? "";

  return useQuery({
    queryKey:
      presetExamKeys.list(
        normalizedLicense
      ),

    queryFn: () =>
      getPresetExamSets({
        licenseClass:
          normalizedLicense,
      }),

    enabled:
      Boolean(
        normalizedLicense
      ),

    staleTime: 5 * 60_000,
    refetchOnMount: "always",
  });
}

export function useStartPresetExam() {
  const router =
    useRouter();

  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload: StartPresetExamRequest
    ) =>
      startPresetExam(
        payload
      ),

    onSuccess: (session) => {
      if (!session.examId) {
        toast.error(
          "Backend không trả về mã phiên làm bài."
        );

        return;
      }
      queryClient.setQueryData(
        practiceKeys.session(
          session.examId
        ),
        session
      );

      void queryClient.invalidateQueries({
        queryKey:
          presetExamKeys.all,
      });

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
          : "Không thể bắt đầu bộ đề."
      );
    },
  });
}