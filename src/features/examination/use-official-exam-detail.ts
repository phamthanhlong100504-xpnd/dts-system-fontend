"use client";

import { useQuery } from "@tanstack/react-query";

import { getOfficialExamDetail } from "@/features/examination/official-exam-detail-service";

export const officialExamDetailKeys = {
  all: ["examination", "official-exam-detail"] as const,

  detail: (
    examId: string,
    licenseClass: string,
    examVersionId?: string
  ) =>
    [
      ...officialExamDetailKeys.all,
      examId,
      licenseClass,
      examVersionId ?? "latest",
    ] as const,
};

export function useOfficialExamDetail(
  examId: string,
  licenseClass: string,
  examVersionId?: string
) {
  const normalizedExamId =
    examId.trim();

  const normalizedLicense =
    licenseClass.trim();

  return useQuery({
    queryKey:
      officialExamDetailKeys.detail(
        normalizedExamId,
        normalizedLicense,
        examVersionId
      ),

    queryFn: () =>
      getOfficialExamDetail(
        normalizedExamId,
        normalizedLicense,
        examVersionId
      ),

    enabled:
      Boolean(normalizedExamId) &&
      Boolean(normalizedLicense),

    staleTime: 30_000,

    refetchOnWindowFocus: true,
  });
}