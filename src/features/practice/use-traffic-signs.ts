"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getTrafficSignById,
  getTrafficSigns,
} from "@/features/practice/traffic-sign-service";
import type {
  TrafficSignCategory,
  TrafficSignListParams,
} from "@/features/practice/traffic-sign-types";

export const trafficSignKeys = {
  all: ["practice", "traffic-signs"] as const,
  list: ({ category, search, page = 0, size = 20 }: TrafficSignListParams) =>
    [
      ...trafficSignKeys.all,
      "list",
      category ?? "ALL",
      search?.trim() ?? "",
      page,
      size,
    ] as const,
  detail: (id: string) => [...trafficSignKeys.all, "detail", id] as const,
};

export function useTrafficSigns({
  category,
  search,
  page = 0,
  size = 20,
}: {
  category?: TrafficSignCategory;
  search?: string;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: trafficSignKeys.list({ category, search, page, size }),
    queryFn: () => getTrafficSigns({ category, search, page, size }),
    staleTime: 60_000,
  });
}

export function useTrafficSignDetail(id: string | null) {
  return useQuery({
    queryKey: trafficSignKeys.detail(id ?? ""),
    queryFn: () => getTrafficSignById(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}
