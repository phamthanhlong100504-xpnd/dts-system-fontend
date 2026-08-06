import axios from "axios";
import { getAccessToken, getRefreshToken, useAuthStore } from "@/stores/auth-store";
import { IDENTITY_API_BASE } from "@/lib/api/config";
import type { IdentitySchemas } from "@/lib/api/types";

/**
 * Refresh access token qua `POST /api/identity/v1/auth/refresh`.
 * Dùng axios trần (không qua interceptor) để tránh đệ quy khi refresh thất bại.
 * Nhiều request cùng 401 → chỉ gọi refresh MỘT lần, các request còn lại chờ cùng promise.
 */
let refreshPromise: Promise<boolean> | null = null;

export function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefresh();
  return refreshPromise.finally(() => {
    refreshPromise = null;
  });
}

async function doRefresh(): Promise<boolean> {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const { data } = await axios.post<IdentitySchemas["ApiResponseAuthResponse"]>(
      `${IDENTITY_API_BASE}/v1/auth/refresh`,
      { refreshToken },
      { headers: { Authorization: accessToken ? `Bearer ${accessToken}` : undefined } }
    );

    if (data.success === false || !data.data?.accessToken) {
      return false;
    }
    useAuthStore.getState().setAuth(data.data);
    return true;
  } catch {
    return false;
  }
}
