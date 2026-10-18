"use client";

import { useQuery } from "@tanstack/react-query";

import { getExamConfig } from "@/features/practice/practice-service";

export const examConfigKeys = {
  all: ["practice", "exam-config"] as const,

  detail: (examType: string) =>
    [...examConfigKeys.all, examType] as const,
};

export function useExamConfig(examType?: string) {
  const normalizedExamType =
    examType?.trim().toUpperCase() ?? "";

  return useQuery({
    queryKey: examConfigKeys.detail(normalizedExamType),

    queryFn: () =>
      getExamConfig(normalizedExamType),

    enabled: Boolean(normalizedExamType),

    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });
}