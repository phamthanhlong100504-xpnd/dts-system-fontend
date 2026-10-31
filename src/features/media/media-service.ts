import { mediaApi } from "@/lib/api";
import type { MediaUploadTarget } from "./media-upload-policy";
import { getAccessToken, useAuthStore } from "@/stores/auth-store";

export { transferMediaFile, MediaTransferError } from "./media-upload-transport";
export type { MediaUploadReceipt, MediaUploadPhase } from "./media-upload-transport";

export class MediaProcessingPendingError extends Error {
  constructor(public readonly mediaId: string) {
    super("Media chưa được xác nhận sẵn sàng. Kiểm tra lại sau; chưa có kết luận xử lý thất bại.");
    this.name = "MediaProcessingPendingError";
  }
}

export interface InitializeUploadPayload {
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  visibility: "PRIVATE" | "PUBLIC";
  targetType: "USER" | "SYSTEM" | MediaUploadTarget;
}

export interface InitializeUploadResponse {
  sessionId: string;
  mediaId: string;
  presignedUrl: string;
  objectKey: string;
  expiredAt: string;
}

export interface MediaDetailResponse {
  mediaId: string;
  originalFilename: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  mediaType: string;
  visibility: string;
  status: string;
  url: string;
  createdAt: string;
}

/**
 * Uploads a file directly to the media service using the 4-step process.
 * 1. Initialize session -> gets presigned URL
 * 2. Upload to MinIO directly using the presigned URL
 * 3. Confirm upload
 * 4. Fetch the final URL (with polling for READY status)
 */
export async function uploadFileToMediaService(
  file: File,
  targetType: InitializeUploadPayload["targetType"] = "QUESTION",
  visibility: "PRIVATE" | "PUBLIC" = "PUBLIC"
): Promise<MediaDetailResponse> {
  getAccessToken();
  const uploaderId = useAuthStore.getState().user?.id;
  const assertUploader = () => {
    const current = useAuthStore.getState();
    if (!uploaderId || current.user?.id !== uploaderId || !current.accessToken) throw new Error("Phiên tải lên đã thay đổi. Vui lòng đăng nhập lại.");
  };
  assertUploader();
  // Step 1: Initialize
  const initPayload: InitializeUploadPayload = {
    fileName: file.name,
    sizeBytes: file.size,
    mimeType: file.type,
    visibility,
    targetType,
  };
  
  const initRes = await mediaApi.post<InitializeUploadResponse>(
    "/uploads/initialize",
    initPayload,
    { headers: { "Content-Type": "application/json" } }
  );

  if (!initRes || !initRes.presignedUrl) {
    throw new Error("Failed to initialize upload session");
  }
  assertUploader();

  // Step 2: Direct Upload to MinIO
  const uploadRes = await fetch(initRes.presignedUrl, {
    method: "PUT",
    credentials: "omit",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("Failed to upload file to storage");
  }
  assertUploader();

  // Step 3: Confirm Upload
  try {
    await mediaApi.post(
      `/uploads/${initRes.sessionId}/confirm`,
      {},
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && (error.status === 401 || error.status === 403)) throw error;
    assertUploader();
    throw new MediaProcessingPendingError(initRes.mediaId);
  }

  // Step 4: Poll for READY status
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    // Wait for the worker to process the upload (1 second)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    assertUploader();
    
    try {
      const mediaRes = await mediaApi.get<MediaDetailResponse>(
        `/${initRes.mediaId}`
      );
      assertUploader();
      if (mediaRes && mediaRes.mediaId === initRes.mediaId && mediaRes.status === "READY") {
        return mediaRes;
      }
    } catch (err) {
      if (err && typeof err === "object" && "status" in err && (err.status === 401 || err.status === 403)) throw err;
    }
  }

  throw new MediaProcessingPendingError(initRes.mediaId);
}
