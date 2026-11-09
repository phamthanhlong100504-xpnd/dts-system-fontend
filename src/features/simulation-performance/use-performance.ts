"use client";
import { useQuery } from "@tanstack/react-query";
import { useLicenseByCode } from "@/features/license/use-license";
import { useAuthStore } from "@/stores/auth-store";
import { ApiError } from "@/lib/api";
import {
  resolvePerformanceMode,
  type PerformanceSnapshot,
} from "./performance-contract";
import type { PerformanceScope } from "./performance-source";

export function usePerformanceContext(licenseClass: string) {
  const catalog = useLicenseByCode(licenseClass);
  const userId = useAuthStore((s) => s.user?.id ?? "");
  let mode: "LEGACY_THEORY" | "COMBINED" | null = null,
    error: string | null = null;
  if (catalog.license) {
    try {
      mode = resolvePerformanceMode(catalog.license);
    } catch (e) {
      error = e instanceof Error ? e.message : "Chính sách chưa sẵn sàng.";
    }
  }
  if (catalog.isError || (!catalog.isLoading && !catalog.license))
    error = "Không tải được chính sách của hạng GPLX. Vui lòng thử lại.";
  const scope: PerformanceScope = {
    userId,
    licenseClass,
    policyVersion: catalog.license?.performancePolicyVersion ?? "",
    bankVersion: catalog.license?.simulationBankVersion,
  };
  return { ...catalog, mode, error, scope };
}
export const performanceKeys = {
  read: (s: PerformanceScope, kind: string, params: readonly unknown[]) =>
    [
      "simulation-performance",
      s.userId,
      s.licenseClass,
      s.policyVersion,
      s.bankVersion ?? "latest",
      kind,
      ...params,
    ] as const,
};
export function usePerformanceRead<T extends PerformanceSnapshot>(
  s: PerformanceScope,
  kind: string,
  params: readonly unknown[],
  load: (signal: AbortSignal) => Promise<T>,
) {
  return useQuery({
    queryKey: performanceKeys.read(s, kind, params),
    queryFn: ({ signal }) => load(signal),
    enabled: !!s.userId && !!s.policyVersion,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: (count, e) => e instanceof ApiError && e.status === 503 && count < 1,
    retryDelay: 1000,
    refetchInterval: (q) =>
      q.state.error
        ? false
        : q.state.data && q.state.data.dataStatus !== "READY"
          ? 5000
          : false,
  });
}
