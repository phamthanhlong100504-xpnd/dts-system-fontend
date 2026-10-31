import { mediaApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { readAdminMediaItem, readAdminMediaPage, isMediaId, type AdminMediaFilter, type AdminMediaItem } from "./admin-media-contract";

export function assertMediaActor(actorId: string) {
  const current = useAuthStore.getState();
  if (!current.accessToken || current.user?.id !== actorId) throw new ApiError("Phiên quản trị đã thay đổi.", 401);
  if (!current.user.roles?.some((role) => role === "ROLE_ADMIN" || role === "ADMIN")) throw new ApiError("Bạn không còn quyền truy cập quản trị.", 403);
}
export async function fetchAdminMedia(actorId: string, filter: AdminMediaFilter, signal?: AbortSignal) {
  assertMediaActor(actorId);
  const response = await mediaApi.get<unknown>("", { params: { page: filter.page, size: filter.size, mediaType: filter.mediaType, status: filter.status, visibility: filter.visibility }, signal });
  assertMediaActor(actorId);
  const result = readAdminMediaPage(response);
  if (result.number !== filter.page || result.size !== filter.size) throw new Error("Hệ thống trả sai trang tài nguyên được yêu cầu.");
  return result;
}
export type ReadyMediaCheck = { kind: "known"; item: AdminMediaItem } | { kind: "unconfirmed" };
export async function checkUploadedMedia(actorId: string, mediaId: string, signal?: AbortSignal): Promise<ReadyMediaCheck> {
  if (!isMediaId(mediaId)) throw new Error("Mã tài nguyên không hợp lệ.");
  assertMediaActor(actorId);
  try {
    const data = await mediaApi.get<unknown>(`/${encodeURIComponent(mediaId)}`, { signal });
    assertMediaActor(actorId);
    const item = readAdminMediaItem(data);
    if (item.mediaId !== mediaId) throw new Error("tài nguyên trả về không khớp phiên tải.");
    return { kind: "known", item };
  } catch (error) {
    assertMediaActor(actorId);
    // Current READY-only detail returns 500 for both pending and FAILED.
    // It cannot establish processing failure. Never infer FAILED from that error.
    if (error instanceof ApiError && error.status === 500) return { kind: "unconfirmed" };
    throw error;
  }
}
export async function fetchPublicMediaPreview(actorId: string, media: AdminMediaItem, signal?: AbortSignal): Promise<string> {
  if (media.status !== "READY" || media.visibility !== "PUBLIC") throw new ApiError("tài nguyên này chưa được phép xem trước.", 403);
  assertMediaActor(actorId);
  const data = await mediaApi.get<unknown>(`/${encodeURIComponent(media.mediaId)}`, { signal });
  assertMediaActor(actorId);
  const current = readAdminMediaItem(data);
  if (current.mediaId !== media.mediaId || current.status !== "READY" || current.visibility !== "PUBLIC") throw new ApiError("Trạng thái hoặc quyền xem tài nguyên đã thay đổi.", 403);
  const url = data && typeof data === "object" && "url" in data ? data.url : null;
  if (typeof url !== "string") throw new Error("Chưa lấy được địa chỉ xem tài nguyên.");
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("Địa chỉ xem tài nguyên không hợp lệ.");
  return url;
}
