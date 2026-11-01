/** Confirmed source policies: dts-media 2bd9930, migrations V3–V6.
 * These are contract limits, not a claim that migrations or new Admin ACLs are deployed.
 */
export type MediaUploadTarget = "QUESTION" | "EXAM" | "TRAFFIC_SIGN" | "SIMULATION_VIDEO" | "SIMULATION_THUMBNAIL";
export const MEDIA_UPLOAD_POLICIES = {
  QUESTION: { label: "Ảnh câu hỏi", maxBytes: 104857600, mimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"], extensions: ["png", "jpg", "jpeg", "gif", "webp"], visibility: "PUBLIC" },
  EXAM: { label: "Ảnh đại diện đề thi", maxBytes: 104857600, mimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"], extensions: ["png", "jpg", "jpeg", "gif", "webp"], visibility: "PUBLIC" },
  TRAFFIC_SIGN: { label: "Ảnh biển báo", maxBytes: 104857600, mimeTypes: ["image/webp"], extensions: ["webp"], visibility: "PUBLIC" },
  SIMULATION_VIDEO: { label: "Video mô phỏng", maxBytes: 2147483648, mimeTypes: ["video/mp4"], extensions: ["mp4"], visibility: "PRIVATE" },
  SIMULATION_THUMBNAIL: { label: "Thumbnail mô phỏng", maxBytes: 20971520, mimeTypes: ["image/webp"], extensions: ["webp"], visibility: "PRIVATE" },
} satisfies Record<MediaUploadTarget, { label: string; maxBytes: number; mimeTypes: string[]; extensions: string[]; visibility: "PUBLIC" | "PRIVATE" }>;

export function validateMediaFile(file: Pick<File, "name" | "size" | "type">, target: MediaUploadTarget): string | null {
  const policy = MEDIA_UPLOAD_POLICIES[target];
  if (!file.name.trim() || !Number.isSafeInteger(file.size) || file.size <= 0) return "Tệp trống hoặc thông tin tệp không hợp lệ.";
  if (file.size > policy.maxBytes) return "Dung lượng tệp vượt giới hạn của loại tài nguyên đã chọn.";
  if (!policy.mimeTypes.includes(file.type) || !policy.extensions.includes(file.name.split(".").pop()?.toLowerCase() ?? "")) return "Định dạng tệp không phù hợp với loại tài nguyên đã chọn.";
  return null;
}
