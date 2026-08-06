/**
 * Envelope chuẩn `ApiResponse<T>` mà cả 3 backend service dùng:
 * { success, message, data, errorCode, traceId, timestamp }
 */

export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
  traceId?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  status?: number;
  errorCode?: string;

  constructor(message: string, status?: number, errorCode?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

/**
 * Bóc phần `data` ra khỏi envelope.
 * Nếu backend báo `success: false` → ném ApiError kèm message.
 */
export function unwrap<T>(envelope: ApiEnvelope<T> | T | null | undefined): T {
  if (envelope && typeof envelope === "object" && "data" in envelope) {
    const env = envelope as ApiEnvelope<T>;
    if (env.success === false) {
      throw new ApiError(env.message ?? "Request failed", undefined, env.errorCode);
    }
    return env.data as T;
  }
  return envelope as T;
}
