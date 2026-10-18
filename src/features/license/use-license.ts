
"use client";

import { useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getLicenseByCode,
  getLicensesByGroup,
  mapLicenseCatalogToOptions,
  type LicenseOption,
} from "@/config/license";

import { ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useLicenseStore } from "@/stores/license-store";

import {
  getLicenseCatalog,
  updateCurrentLicense,
  type UpdateLicenseRequest,
} from "./license-service";

/**
 * Query keys cho danh mục GPLX.
 */
export const licenseCatalogKeys = {
  all: ["license", "catalog"] as const,
};

/**
 * Lấy 15 hạng GPLX từ Practice backend.
 */
export function useLicenseCatalog() {
  return useQuery({
    queryKey: licenseCatalogKeys.all,
    queryFn: getLicenseCatalog,
    staleTime: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
}

export function useLicenseByCode(
  licenseCode?: string | null
) {
  const catalog = useLicenseCatalog();

  const options = useMemo<LicenseOption[] | null>(() => {
    if (!catalog.data) {
      return null;
    }

    try {
      if (
        !Array.isArray(catalog.data) ||
        catalog.data.length !== 15
      ) {
        return null;
      }

      const mapped = mapLicenseCatalogToOptions(
        catalog.data
      );

      // Không chấp nhận hạng GPLX trùng mã.
      if (
        new Set(mapped.map((item) => item.code)).size !== 15
      ) {
        return null;
      }

      // Kiểm tra đúng cơ cấu 3 nhóm GPLX.
      if (
        getLicensesByGroup("motorcycle", mapped).length !== 3 ||
        getLicensesByGroup("car", mapped).length !== 6 ||
        getLicensesByGroup("trailer", mapped).length !== 6
      ) {
        return null;
      }

      // Kiểm tra các trường quan trọng từ backend.
      const invalid = mapped.some(
        (item) =>
          !item.code ||
          !item.description ||
          !item.title ||
          !Number.isFinite(item.totalStudyQuestions) ||
          !Number.isFinite(item.criticalStudyQuestions) ||
          !Number.isFinite(item.exam.totalQuestions) ||
          !Number.isFinite(item.exam.durationMinutes) ||
          !Number.isFinite(item.exam.passingScore) ||
          !Number.isFinite(item.exam.criticalQuestionCount) ||
          typeof item.bankCountsMatch !== "boolean" ||
          typeof item.examAvailable !== "boolean"
      );

      return invalid ? null : mapped;
    } catch {
      return null;
    }
  }, [catalog.data]);

  const normalizedCode =
    licenseCode?.trim().toUpperCase() ?? "";

  const isCatalogReady =
    catalog.isSuccess && options !== null;

  const license = isCatalogReady
    ? getLicenseByCode(normalizedCode, options)
    : undefined;

  const isError =
    catalog.isError ||
    (catalog.isSuccess && options === null);

  return {
    license,
    isLoading: catalog.isPending,
    isError,
    isCatalogReady,
    refetch: catalog.refetch,
  };
}

export function useUpdateCurrentLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateLicenseRequest) =>
      updateCurrentLicense(payload),

    onSuccess: (data) => {
      const licenseClass = data.licenseClass;

      useLicenseStore
        .getState()
        .setSelectedLicense(licenseClass);

      const currentUser = useAuthStore.getState().user;

      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          selectedLicenseClass: licenseClass,
        });
      }

      queryClient.invalidateQueries({
        queryKey: ["auth", "me"],
      });

      toast.success(`Đã chuyển sang hạng ${licenseClass}`);
    },

    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Không thể cập nhật hạng GPLX"
      );
    },
  });
}
