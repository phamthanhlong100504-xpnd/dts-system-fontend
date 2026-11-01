"use client";

import { useQuery } from "@tanstack/react-query";

import { getChapterLearningOverview } from "@/features/practice/chapter-overview-service";

export const chapterOverviewKeys = {
  all: [
    "practice",
    "chapter-overview",
  ] as const,

  byLicense: (
    licenseClass: string
  ) =>
    [
      ...chapterOverviewKeys.all,
      licenseClass,
    ] as const,
};

export function useChapterLearningOverview(
  licenseClass?: string
) {
  const normalizedLicense =
    licenseClass
      ?.trim()
      .toUpperCase() ??
    "";

  return useQuery({
    queryKey:
      chapterOverviewKeys.byLicense(
        normalizedLicense
      ),

    queryFn: () =>
      getChapterLearningOverview(
        normalizedLicense
      ),

    enabled:
      Boolean(
        normalizedLicense
      ),

    staleTime:
      30_000,

    refetchOnMount:
      "always",
  });
}