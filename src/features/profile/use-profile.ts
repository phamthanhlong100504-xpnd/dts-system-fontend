"use client";

import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getMyProfileRoles,
  getProfile,
  requestChangeEmailVerification,
  verifyChangedEmail,
  type Profile,
} from "@/features/profile/profile-service";

import {
  useChangePassword,
  useLogout,
  useUpdateProfile,
} from "@/features/auth/use-auth";

import { useAuthStore } from "@/stores/auth-store";
import { useLicenseStore } from "@/stores/license-store";

export const profileQueryKeys = {
  me: ["auth", "me"] as const,

  roles: (userId: string) =>
    ["profile", "roles", userId] as const,
};

export function useProfile() {
  const storeUser = useAuthStore(
    (state) => state.user
  );

  const profileQuery = useQuery({
    queryKey: profileQueryKeys.me,
    queryFn: getProfile,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const profile = profileQuery.data;

  useEffect(() => {
    if (!profile) return;

    const current = useAuthStore.getState().user;

    if (
      !current ||
      (profile.id && current.id && current.id !== profile.id)
    ) {
      return;
    }

    const selectedLicenseClass =
      profile.selectedLicenseClass;

    // Chỉ đồng bộ license-store từ response Identity.
    if (selectedLicenseClass !== undefined) {
      const licenseState = useLicenseStore.getState();

      if (selectedLicenseClass === null) {
        if (licenseState.selectedLicense !== null) {
          licenseState.clearSelectedLicense();
        }
      } else if (
        licenseState.selectedLicense !== selectedLicenseClass
      ) {
        licenseState.setSelectedLicense(
          selectedLicenseClass
        );
      }
    }

    const unchanged =
      current.username === profile.username &&
      current.fullName === profile.fullName &&
      current.email === profile.email &&
      (
        selectedLicenseClass === undefined ||
        current.selectedLicenseClass === selectedLicenseClass
      );

    if (unchanged) return;

    useAuthStore.getState().setUser({
      ...current,

      username:
        profile.username ?? current.username,

      fullName:
        profile.fullName ?? current.fullName,

      email:
        profile.email ?? current.email,

      selectedLicenseClass:
        selectedLicenseClass === undefined
          ? current.selectedLicenseClass
          : selectedLicenseClass,
    });
  }, [profile]);

  const rolesQuery = useQuery({
    queryKey: profileQueryKeys.roles(
      String(profile?.id ?? "")
    ),

    queryFn: getMyProfileRoles,

    enabled: Boolean(profile?.id),

    staleTime: 0,
    refetchOnMount: "always",
  });

  return {
    profile,
    storeUser,
    rolesQuery,

    isLoading: profileQuery.isPending,
    isError: profileQuery.isError,
    error: profileQuery.error,

    refetch: profileQuery.refetch,
  };
}

export function useProfileEmailVerification() {
  const queryClient = useQueryClient();

  const sendCode = useMutation({
    mutationFn: requestChangeEmailVerification,

    onSuccess: () => {
      toast.success(
        "Đã gửi mã xác minh đến email của bạn"
      );
    },

    onError: () => {
      toast.error(
        "Không gửi được mã xác minh. Vui lòng thử lại."
      );
    },
  });

  const confirmCode = useMutation({
    mutationFn: ({
      email,
      code,
    }: {
      email: string;
      code: string;
    }) => verifyChangedEmail(email, code),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: profileQueryKeys.me,
      });

      toast.success("Xác minh email thành công");
    },

    onError: () => {
      toast.error(
        "Mã xác minh không hợp lệ hoặc đã hết hạn"
      );
    },
  });

  return {
    sendCode,
    confirmCode,
  };
}

export function useProfileActions() {
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const logout = useLogout();

  return {
    updateProfile,
    changePassword,
    logout,

    isUpdatingProfile:
      updateProfile.isPending,

    isChangingPassword:
      changePassword.isPending,

    isLoggingOut:
      logout.isPending,
  };
}

export type { Profile };