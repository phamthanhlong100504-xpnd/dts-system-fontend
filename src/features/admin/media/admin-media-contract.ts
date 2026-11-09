/** BE Admin 02 wire contract: AdminMediaService.AdminMediaItem / Page<AdminMediaItem>.
 * No URL is retained in metadata. `referenceCount=null` means NOT VERIFIED, not zero.
 */
export type MediaStatus = "UPLOADING" | "READY" | "FAILED";
export type MediaKind = "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "ARCHIVE" | "OTHER";
export interface AdminMediaItem {
  mediaId: string;
  originalFilename: string;
  extension: string; // derived locally from the original filename (not supplied by admin DTO)
  mimeType: string;
  sizeBytes: number;
  mediaType: string;
  targetType: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  status: MediaStatus;
  createdAt: string;
  createdBy: string | null;
  referenceCount: number | null;
  canRetire: boolean;
  reasonCode: string | null;
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
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Dữ liệu Media không đúng hợp đồng backend.");
  return value as Record<string, unknown>;
};
const nullableString = (value: unknown, name: string) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new Error(`Trường ${name} không hợp lệ.`);
  return value;
};
const finiteDate = (s: string) => Number.isFinite(Date.parse(s));
export function readAdminMediaItem(value: unknown): AdminMediaItem {
  const v = object(value);
  for (const key of ["mediaId", "originalFilename", "mimeType", "mediaType", "visibility", "status", "createdAt"]) {
    if (typeof v[key] !== "string") throw new Error("Thông tin tài nguyên chưa đầy đủ.");
  }
  if (!isMediaId(v.mediaId as string) || !(v.originalFilename as string).trim() ||
      !Number.isSafeInteger(v.sizeBytes) || (v.sizeBytes as number) <= 0 ||
      !["PUBLIC", "PRIVATE"].includes(v.visibility as string) ||
      !Object.hasOwn(MEDIA_STATUS_LABELS, v.status as string) ||
      !finiteDate(v.createdAt as string)) throw new Error("Metadata Media chưa hợp lệ.");
  // The BE02 Admin DTO does not have an extension field. Never demand one from the server.
  const filename = v.originalFilename as string;
  const extension = filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "";
  const referenceCount = v.referenceCount == null ? null : v.referenceCount;
  if (referenceCount !== null && (!Number.isSafeInteger(referenceCount) || (referenceCount as number) < 0))
    throw new Error("Số tham chiếu không hợp lệ.");
  if (typeof v.canRetire !== "boolean") throw new Error("Thiếu xác nhận điều kiện ngừng sử dụng.");
  return {
    mediaId: v.mediaId as string, originalFilename: filename, extension,
    mimeType: v.mimeType as string, sizeBytes: v.sizeBytes as number,
    mediaType: v.mediaType as string, targetType: nullableString(v.targetType, "targetType"),
    visibility: v.visibility as AdminMediaItem["visibility"], status: v.status as MediaStatus,
    createdAt: v.createdAt as string, createdBy: nullableString(v.createdBy, "createdBy"),
    referenceCount: referenceCount as number | null,
    canRetire: v.canRetire as boolean, reasonCode: nullableString(v.reasonCode, "reasonCode"),
  };
}
export function readAdminMediaPage(value: unknown): AdminMediaPage {
  const v = object(value);
  if (!Array.isArray(v.content)) throw new Error("Danh sách tài nguyên không hợp lệ.");
  for (const key of ["number", "size", "totalElements", "totalPages"]) if (!Number.isSafeInteger(v[key]) || (v[key] as number) < 0) throw new Error("Phân trang tài nguyên không hợp lệ.");
  const number = v.number as number, size = v.size as number, totalElements = v.totalElements as number, totalPages = v.totalPages as number;
  if (size < 1 || v.content.length > size || v.content.length > totalElements || totalPages !== Math.ceil(totalElements / size) ||
      (totalElements > 0 && number >= totalPages)) throw new Error("Phân trang tài nguyên không khớp dữ liệu.");
  return { content: v.content.map(readAdminMediaItem), number, size, totalElements, totalPages };
}
export function formatMediaBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} GiB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MiB`;
  return `${Math.max(1, Math.ceil(bytes / 1024)).toLocaleString("vi-VN")} KiB`;
}
