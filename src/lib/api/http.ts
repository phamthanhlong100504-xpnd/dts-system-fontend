import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError, ApiEnvelope, unwrap } from "./envelope";
import { refreshAccessToken } from "@/lib/auth/auth-refresh";
import { getAccessToken, useAuthStore } from "@/stores/auth-store";

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/** Các endpoint KHÔNG được tự refresh khi 401 (tránh đệ quy vô hạn) */
const NO_REFRESH_PATHS = ["/v1/auth/refresh", "/v1/auth/login", "/v1/auth/logout"];

export interface ApiClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

/**
 * Tạo axios client cho một service:
 * 1. Tự đính kèm `Authorization: Bearer <token>` từ auth store.
 * 2. Unwrap envelope `ApiResponse` → trả thẳng payload cho component.
 * 3. Khi 401 → tự refresh token (queue), rồi replay request. Refresh fail → logout.
 */
export function createApiClient(baseURL: string): ApiClient {
  const instance = axios.create({ baseURL, timeout: 30_000 });

  instance.interceptors.request.use((config) => {
    // getAccessToken tự hydrate store nếu chưa (chống race request trước Providers)
    const token = getAccessToken();
    if (token) {
      if (config.headers && typeof config.headers.set === "function") {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      response.data = unwrap(response.data as ApiEnvelope<unknown>);
      return response;
    },
    async (error: AxiosError) => {
      const config = error.config as RetriableConfig | undefined;
      const url = config?.url ?? "";
      const status = error.response?.status;

      const shouldRefresh =
        status === 401 &&
        !config?._retried &&
        !NO_REFRESH_PATHS.some((p) => url.includes(p));

      if (shouldRefresh) {
        config!._retried = true;
        
        // Kiểm tra xem token đã được refresh bởi 1 request khác trong lúc request này đang gọi hay chưa
        const requestToken = config?.headers?.Authorization?.toString().replace("Bearer ", "");
        const currentToken = useAuthStore.getState().accessToken;
        
        if (requestToken && currentToken && requestToken !== currentToken) {
          // Token đã được refresh -> dùng luôn token mới để retry
          if (config && config.headers) {
            if (typeof config.headers.set === "function") {
              config.headers.set("Authorization", `Bearer ${currentToken}`);
            } else {
              config.headers.Authorization = `Bearer ${currentToken}`;
            }
            return instance.request(config);
          }
        }
        
        // Nếu chưa refresh, tiến hành refresh
        const ok = await refreshAccessToken();
        if (ok && config) {
          const newToken = useAuthStore.getState().accessToken;
          if (newToken) {
            if (config.headers && typeof config.headers.set === "function") {
              config.headers.set("Authorization", `Bearer ${newToken}`);
            } else {
              config.headers.Authorization = `Bearer ${newToken}`;
            }
          }
          return instance.request(config);
        }
        useAuthStore.getState().logout();
      }

      throw new ApiError(extractErrorMessage(error), status);
    }
  );

  return {
    get: <T>(url: string, config?: AxiosRequestConfig) =>
      instance.get<unknown>(url, config).then((r) => r.data as T),
    post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      instance.post<unknown>(url, data, config).then((r) => r.data as T),
    put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      instance.put<unknown>(url, data, config).then((r) => r.data as T),
    patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      instance.patch<unknown>(url, data, config).then((r) => r.data as T),
    delete: <T>(url: string, config?: AxiosRequestConfig) =>
      instance.delete<unknown>(url, config).then((r) => r.data as T),
  };
}

function extractErrorMessage(error: AxiosError): string {
  const env = error.response?.data as ApiEnvelope<unknown> | undefined;
  if (env && typeof env === "object" && typeof env.message === "string") {
    return env.message;
  }
  if (error.code === "ECONNABORTED") return "Request timeout";
  return error.message || "Unexpected error";
}
