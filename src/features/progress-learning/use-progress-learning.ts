
"use client";

import { useQuery } from "@tanstack/react-query";

import { getLearningProgressOverview } from "@/features/progress-learning/progress-learning-service";

export const learningProgressKeys = {
  all: ["progress", "learning-overview"] as const,

  overview: (licenseClass: string) =>
    [
      ...learningProgressKeys.all,
      licenseClass,
    ] as const,
};

export function useLearningProgressOverview(
  licenseClass: string
) {
  const normalizedLicense = licenseClass
    .trim()
    .toUpperCase();

  return useQuery({
    queryKey: learningProgressKeys.overview(
      normalizedLicense
    ),

    queryFn: () =>
      getLearningProgressOverview(
        normalizedLicense
      ),

    enabled: Boolean(normalizedLicense),

    staleTime: 30_000,

    refetchOnMount: "always",

    refetchOnWindowFocus: true,

    retry: 1,
  });
}
