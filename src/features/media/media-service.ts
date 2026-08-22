import { mediaApi } from "@/lib/api";

export interface InitializeUploadPayload {
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  visibility: "PRIVATE" | "PUBLIC";
  targetType: "USER" | "QUESTION" | "EXAM" | "SYSTEM";
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
  targetType: "USER" | "QUESTION" | "EXAM" | "SYSTEM" = "QUESTION",
  visibility: "PRIVATE" | "PUBLIC" = "PUBLIC"
): Promise<MediaDetailResponse> {
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

  // Step 2: Direct Upload to MinIO
  const uploadRes = await fetch(initRes.presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("Failed to upload file to storage");
  }

  // Step 3: Confirm Upload
  await mediaApi.post(
    `/uploads/${initRes.sessionId}/confirm`,
    {},
    { headers: { "Content-Type": "application/json" } }
  );

  // Step 4: Poll for READY status
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    // Wait for the worker to process the upload (1 second)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    try {
      const mediaRes = await mediaApi.get<MediaDetailResponse>(
        `/${initRes.mediaId}`
      );
      if (mediaRes && mediaRes.status === "READY") {
        return mediaRes;
      }
    } catch (err) {
      console.warn("Polling media status failed, retrying...", err);
    }
  }

  throw new Error("Media processing timed out");
}
