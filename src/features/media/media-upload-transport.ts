import { mediaApi, ApiError } from "@/lib/api";
import type { InitializeUploadPayload, InitializeUploadResponse } from "./media-service";

export interface MediaUploadReceipt {
  mediaId: string;
  sessionId: string;
  confirmation: "accepted" | "unknown";
}
export type MediaUploadPhase = "initializing" | "transferring" | "confirming";
export class MediaTransferError extends Error {
  constructor(public readonly phase: MediaUploadPhase, public readonly receipt?: Pick<MediaUploadReceipt, "mediaId" | "sessionId">) {
    super("Không thể hoàn tất bước truyền tệp. Bạn có thể bắt đầu phiên tải mới; tệp cũ không bị ghi đè.");
    this.name = "MediaTransferError";
  }
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function readInitialization(value: InitializeUploadResponse): InitializeUploadResponse {
  if (!value || !uuid.test(value.sessionId) || !uuid.test(value.mediaId) || !Number.isFinite(Date.parse(value.expiredAt))) throw new Error("Phiên tải lên không hợp lệ.");
  const url = new URL(value.presignedUrl);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || Date.parse(value.expiredAt) <= Date.now()) throw new Error("Phiên tải lên đã hết hạn hoặc không hợp lệ.");
  return value;
}

/** Raw storage transport: never uses the authenticated API client, credentials or JWT. */
export function putMediaFile(url: string, file: File, signal: AbortSignal, onProgress?: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException("Aborted", "AbortError")); return; }
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const finish = (error?: Error) => {
      signal.removeEventListener("abort", abort);
      if (error) reject(error); else resolve();
    };
    xhr.open("PUT", url);
    xhr.withCredentials = false;
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => { if (event.lengthComputable && event.total > 0) onProgress?.(Math.min(100, Math.round(event.loaded * 100 / event.total))); };
    xhr.onload = () => finish(xhr.status >= 200 && xhr.status < 300 ? undefined : new MediaTransferError("transferring"));
    xhr.onerror = () => finish(new MediaTransferError("transferring"));
    xhr.onabort = () => finish(new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    xhr.send(file);
  });
}

/** One initialize, one PUT, one confirm. A lost confirm response is not retried. */
export async function transferMediaFile(file: File, payload: InitializeUploadPayload, options: {
  signal: AbortSignal;
  authorize: () => void;
  onPhase?: (phase: MediaUploadPhase) => void;
  onProgress?: (percent: number) => void;
  onInitialized?: (ids: Pick<MediaUploadReceipt, "sessionId" | "mediaId">) => void;
}): Promise<MediaUploadReceipt> {
  options.authorize();
  options.onPhase?.("initializing");
  const init = readInitialization(await mediaApi.post<InitializeUploadResponse>("/uploads/initialize", payload, { signal: options.signal }));
  options.onInitialized?.({ sessionId: init.sessionId, mediaId: init.mediaId });
  options.signal.throwIfAborted();
  options.authorize();
  options.onPhase?.("transferring");
  try { await putMediaFile(init.presignedUrl, file, options.signal, options.onProgress); }
  catch (error) {
    if (options.signal.aborted) throw error;
    throw new MediaTransferError("transferring", { mediaId: init.mediaId, sessionId: init.sessionId });
  }
  options.authorize();
  options.signal.throwIfAborted();
  options.onPhase?.("confirming");
  try {
    const response = await mediaApi.post<{ sessionId: string; mediaId: string }>(`/uploads/${encodeURIComponent(init.sessionId)}/confirm`, {}, { signal: options.signal });
    if (response?.sessionId !== init.sessionId || response?.mediaId !== init.mediaId) return { sessionId: init.sessionId, mediaId: init.mediaId, confirmation: "unknown" };
    return { sessionId: init.sessionId, mediaId: init.mediaId, confirmation: "accepted" };
  } catch (error) {
    options.signal.throwIfAborted();
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) throw error;
    // The server may already have accepted confirmation. Preserve IDs; GET only next.
    return { sessionId: init.sessionId, mediaId: init.mediaId, confirmation: "unknown" };
  }
}
