"use client";

import { useQuery } from "@tanstack/react-query";

import { getCriticalProgressOverview } from "@/features/practice/critical-progress-service";

export const criticalProgressKeys = {
  all: ["practice", "critical-progress"] as const,

  overview: (licenseClass: string) =>
    [...criticalProgressKeys.all, "overview", licenseClass] as const,
};

export function useCriticalOverview(
  licenseClass?: string
) {
  const normalizedLicense =
    licenseClass?.trim().toUpperCase() ?? "";

  const overviewQuery = useQuery({
    queryKey: criticalProgressKeys.overview(normalizedLicense),
    queryFn: () =>
      getCriticalProgressOverview(normalizedLicense),
    enabled: Boolean(normalizedLicense),
    staleTime: 0,
    retry: false,
    refetchOnMount: "always",
  });

  return {
    overview: overviewQuery.data,
    isLoading: overviewQuery.isLoading,
    isFetching: overviewQuery.isFetching,
    isError: overviewQuery.isError,
    error: overviewQuery.error,
    refetch: overviewQuery.refetch,
  };
}