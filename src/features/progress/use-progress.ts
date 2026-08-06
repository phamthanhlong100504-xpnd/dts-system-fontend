"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "./progress-service";

export const progressKeys = {
  dashboard: ["progress", "dashboard"] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: progressKeys.dashboard,
    queryFn: getDashboard,
    staleTime: 30_000,
  });
}
