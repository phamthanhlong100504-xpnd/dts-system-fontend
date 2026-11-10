import { mediaApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { readAdminMediaItem, readAdminMediaPage, isMediaId, type AdminMediaFilter, type AdminMediaItem } from "./admin-media-contract";

/** Actor continuity on the client. The BE02 MediaJwtVerifier + MediaAccess enforce the actual ACL. */
export function assertMediaActor(actorId: string) {
  const current = useAuthStore.getState();
  if (!current.accessToken || !current.user?.id || current.user.id !== actorId)
    throw new ApiError("Phiên quản trị đã thay đổi.", 401);
}
export async function fetchAdminMedia(actorId: string, filter: AdminMediaFilter, signal?: AbortSignal) {
  assertMediaActor(actorId);
  // BE02 endpoints are at /api/v1/media/admin, NOT the legacy /api/v1/media list.
  const response = await mediaApi.get<unknown>("/admin", { params: {
    page: filter.page, size: filter.size, mediaType: filter.mediaType,
    status: filter.status, visibility: filter.visibility,
  }, signal });
  assertMediaActor(actorId);
  const result = readAdminMediaPage(response);
  if (result.number !== filter.page || result.size !== filter.size)
    throw new Error("Hệ thống trả sai trang tài nguyên được yêu cầu.");
  return result;
}
export type ReadyMediaCheck = { kind: "known"; item: AdminMediaItem };
export async function checkUploadedMedia(actorId: string, mediaId: string, signal?: AbortSignal): Promise<ReadyMediaCheck> {
  if (!isMediaId(mediaId)) throw new Error("Mã tài nguyên không hợp lệ.");
  assertMediaActor(actorId);
  // Unlike the legacy READY-only /{mediaId}, this endpoint reports UPLOADING and FAILED.
  const data = await mediaApi.get<unknown>(`/admin/${encodeURIComponent(mediaId)}`, { signal });
  assertMediaActor(actorId);
  const item = readAdminMediaItem(data);
  if (item.mediaId !== mediaId) throw new Error("Tài nguyên trả về không khớp phiên tải.");
  return { kind: "known", item };
}
export async function fetchAdminMediaPreview(actorId: string, media: AdminMediaItem, signal?: AbortSignal): Promise<string> {
  if (media.status !== "READY") throw new ApiError("Tài nguyên chưa sẵn sàng để xem trước.", 409);
  assertMediaActor(actorId);
  const response = await mediaApi.get<unknown>(`/admin/${encodeURIComponent(media.mediaId)}/preview`, { signal });
  assertMediaActor(actorId);
  if (!response || typeof response !== "object" || Array.isArray(response)) throw new Error("Không nhận được chứng thực xem Media.");
  const data = response as Record<string,unknown>;
  if (data.mediaId !== media.mediaId || data.status !== "READY" || data.visibility !== media.visibility)
    throw new Error("Bản xem trước không khớp trạng thái Media.");
  if (typeof data.url !== "string") throw new Error("Chưa lấy được URL xem Media.");
  const parsed = new URL(data.url);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password)
    throw new Error("Địa chỉ xem Media không hợp lệ.");
  return data.url;
}
// Preserve the existing caller's name; route it through BE02's secured preview endpoint.
export const fetchPublicMediaPreview = fetchAdminMediaPreview;
