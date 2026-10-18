"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getWrongQuestions,
  getWrongQuestionsOverview,
} from "@/features/practice/wrong-questions-service";

export const wrongQuestionsKeys = {
  all: [
    "practice",
    "wrong-questions",
  ] as const,

  overview: (
    licenseClass: string
  ) =>
    [
      ...wrongQuestionsKeys.all,
      "overview",
      licenseClass,
    ] as const,

  list: (
    licenseClass: string
  ) =>
    [
      ...wrongQuestionsKeys.all,
      "list",
      licenseClass,
    ] as const,
};

export function useWrongQuestionsOverview(
  licenseClass?: string
) {
  const normalizedLicense =
    licenseClass
      ?.trim()
      .toUpperCase() ?? "";

  return useQuery({
    queryKey:
      wrongQuestionsKeys.overview(
        normalizedLicense
      ),

    queryFn: () =>
      getWrongQuestionsOverview({
        licenseClass:
          normalizedLicense,
      }),

    enabled:
      Boolean(
        normalizedLicense
      ),

    staleTime:
      60_000,

    refetchOnMount:
      "always",
  });
}

export function useWrongQuestions(
  licenseClass?: string
) {
  const normalizedLicense =
    licenseClass
      ?.trim()
      .toUpperCase() ?? "";

  return useQuery({
    queryKey:
      wrongQuestionsKeys.list(
        normalizedLicense
      ),

    queryFn: () =>
      getWrongQuestions({
        licenseClass:
          normalizedLicense,
      }),

    enabled:
      Boolean(
        normalizedLicense
      ),

    staleTime:
      60_000,

    refetchOnMount:
      "always",
  });
}