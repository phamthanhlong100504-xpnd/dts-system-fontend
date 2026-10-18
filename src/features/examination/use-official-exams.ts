"use client";

import { useQuery } from "@tanstack/react-query";

import { getOfficialExams } from "@/features/examination/official-exam-service";
import type {
  OfficialExamListParams,
  OfficialExamTab,
} from "@/features/examination/official-exam-types";

export const officialExamKeys = {
  all: ["examination", "official-exams"] as const,

  list: (
    licenseClass: string,
    tab: OfficialExamTab
  ) =>
    [
      ...officialExamKeys.all,
      "list",
      licenseClass,
      tab,
    ] as const,
};

export function useOfficialExams(
  params: OfficialExamListParams
) {
  const licenseClass =
    params.licenseClass.trim();

  return useQuery({
    queryKey: officialExamKeys.list(
      licenseClass,
      params.tab
    ),

    queryFn: () =>
      getOfficialExams({
        licenseClass,
        tab: params.tab,
      }),

    enabled: Boolean(licenseClass),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}