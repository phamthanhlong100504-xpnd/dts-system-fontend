/** DTO fields verified from MediaResponse.java / MediaController.java at 2bd9930.
 * This service has no checked-in OpenAPI. Never add proposed Admin fields here.
 * URLs are discarded before metadata enters a query cache.
 */
export type MediaStatus = "UPLOADING" | "READY" | "FAILED";
export type MediaKind = "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "ARCHIVE" | "OTHER";
export interface AdminMediaItem {
  mediaId: string;
  originalFilename: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  mediaType: string;
  visibility: "PUBLIC" | "PRIVATE";
  status: MediaStatus;
  createdAt: string;
}
export interface AdminMediaPage {
  content: AdminMediaItem[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface AdminMediaFilter { page: number; size: number; mediaType?: MediaKind; status?: MediaStatus; visibility?: "PUBLIC" | "PRIVATE" }
export const MEDIA_KINDS: { value: MediaKind; label: string }[] = [
  { value: "IMAGE", label: "Hình ảnh" }, { value: "VIDEO", label: "Video" },
  { value: "AUDIO", label: "Âm thanh" }, { value: "DOCUMENT", label: "Tài liệu" },
  { value: "ARCHIVE", label: "Tệp nén" }, { value: "OTHER", label: "Khác" },
];
export const MEDIA_STATUS_LABELS: Record<MediaStatus, string> = { UPLOADING: "Chưa sẵn sàng", READY: "Sẵn sàng", FAILED: "Xử lý thất bại" };
export const isMediaId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Chưa thể đọc thông tin tài nguyên. Vui lòng tải lại.");
  return value as Record<string, unknown>;
};
export function readAdminMediaItem(value: unknown): AdminMediaItem {
  const v = object(value);
  for (const key of ["mediaId", "originalFilename", "extension", "mimeType", "mediaType", "visibility", "status", "createdAt"]) if (typeof v[key] !== "string") throw new Error("Thông tin tài nguyên chưa đầy đủ.");
  if (!isMediaId(v.mediaId as string) || !Number.isSafeInteger(v.sizeBytes) || (v.sizeBytes as number) <= 0 || !["PUBLIC", "PRIVATE"].includes(v.visibility as string) || !Object.hasOwn(MEDIA_STATUS_LABELS, v.status as string) || !Number.isFinite(Date.parse(v.createdAt as string))) throw new Error("Thông tin hoặc trạng thái tài nguyên không hợp lệ.");
  return { mediaId: v.mediaId as string, originalFilename: v.originalFilename as string, extension: v.extension as string, mimeType: v.mimeType as string, sizeBytes: v.sizeBytes as number, mediaType: v.mediaType as string, visibility: v.visibility as AdminMediaItem["visibility"], status: v.status as MediaStatus, createdAt: v.createdAt as string };
}
export function readAdminMediaPage(value: unknown): AdminMediaPage {
  const v = object(value);
  if (!Array.isArray(v.content)) throw new Error("Danh sách tài nguyên không hợp lệ.");
  for (const key of ["number", "size", "totalElements", "totalPages"]) if (!Number.isSafeInteger(v[key]) || (v[key] as number) < 0) throw new Error("Phân trang tài nguyên không hợp lệ.");
  const number = v.number as number, size = v.size as number, totalElements = v.totalElements as number, totalPages = v.totalPages as number;
  if (size < 1 || v.content.length > size || v.content.length > totalElements || totalPages !== Math.ceil(totalElements / size)) throw new Error("Phân trang tài nguyên không khớp dữ liệu.");
  return { content: v.content.map(readAdminMediaItem), number, size, totalElements, totalPages };
}
export function formatMediaBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} GiB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MiB`;
  return `${Math.max(1, Math.ceil(bytes / 1024)).toLocaleString("vi-VN")} KiB`;
}
