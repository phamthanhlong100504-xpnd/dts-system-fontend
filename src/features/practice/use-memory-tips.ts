"use client";

import { useQuery } from "@tanstack/react-query";

import { getMemoryTips } from "@/features/practice/memory-tip-service";

export const memoryTipKeys = {
  all: [
    "practice",
    "memory-tips",
  ] as const,
};

export function useMemoryTips() {
  return useQuery({
    queryKey: memoryTipKeys.all,
    queryFn: getMemoryTips,
    staleTime: 60_000,
  });
}