
import axios from "axios";

import { IDENTITY_API_BASE } from "@/lib/api/config";
import type { IdentitySchemas } from "@/lib/api/types";

import {
  getAccessToken,
  getRefreshToken,
  useAuthStore,
  type AuthUser,
} from "@/stores/auth-store";

import { useLicenseStore } from "@/stores/license-store";

/**
 * Refresh access token qua Identity backend.
 *
 * Dùng axios riêng để tránh gọi lại interceptor
 * khi request refresh token bị lỗi.
 *
 * Nhiều request bị 401 cùng lúc sẽ dùng chung
 * một Promise refresh.
 */
let refreshPromise: Promise<boolean> | null = null;

export function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = doRefresh();

  return refreshPromise.finally(() => {
    refreshPromise = null;
  });
}

/**
 * Đồng bộ hạng GPLX vào cache Zustand.
 *
 * Identity là nguồn dữ liệu chính.
 * Chỉ đồng bộ khi response thực sự có trường
 * selectedLicenseClass.
 */
async function syncLicenseFromRefreshedUser(
  user: AuthUser | undefined
): Promise<void> {
  const selectedLicenseClass =
    user?.selectedLicenseClass;

  if (selectedLicenseClass === undefined) {
    return;
  }

  // Tránh dữ liệu localStorage cũ ghi đè lên giá trị mới.
  if (!useLicenseStore.persist.hasHydrated()) {
    await useLicenseStore.persist.rehydrate();
  }

  if (selectedLicenseClass === null) {
    useLicenseStore.getState().clearSelectedLicense();
    return;
  }

  useLicenseStore
    .getState()
    .setSelectedLicense(selectedLicenseClass);
}

async function doRefresh(): Promise<boolean> {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return false;
  }

  try {
    const { data } = await axios.post<
      IdentitySchemas["ApiResponseAuthResponse"]
    >(
      `${IDENTITY_API_BASE}/v1/auth/refresh`,
      { refreshToken },
      {
        headers: {
          Authorization: accessToken
            ? `Bearer ${accessToken}`
            : undefined,
        },
      }
    );

    if (
      data.success === false ||
      !data.data?.accessToken
    ) {
      return false;
    }

    const refreshedAuth = data.data;
    const refreshedUser =
      refreshedAuth.user as AuthUser | undefined;

    // Cập nhật token và user từ Identity backend.
    useAuthStore.getState().setAuth(refreshedAuth);

    // Đồng bộ hạng GPLX từ response mới nhất.
    await syncLicenseFromRefreshedUser(refreshedUser);

    return true;
  } catch {
    return false;
  }
}
