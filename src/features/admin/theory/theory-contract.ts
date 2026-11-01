import { ApiError } from "@/lib/api";
import { getAccessToken, useAuthStore } from "@/stores/auth-store";

export type TheoryStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "HIDDEN";
export const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Chưa thể đọc nội dung. Vui lòng tải lại.");
  return value as Record<string, unknown>;
}
export function text(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Nội dung thiếu ${label}.`);
  return value;
}
export function status(value: unknown): TheoryStatus {
  if (!["DRAFT", "PUBLISHED", "ARCHIVED", "HIDDEN"].includes(value as string)) throw new Error("Hệ thống chưa cung cấp trạng thái nội dung hợp lệ.");
  return value as TheoryStatus;
}
export function sourceMetadata(metadata: Record<string, unknown> | null | undefined): boolean {
  return Boolean(metadata && ["bankVersion", "sourceQuestionId", "sourceChapterId"].some((key) => metadata[key] !== undefined && metadata[key] !== null));
}
export function assertCustomDraft(item: { status: string; metadata?: Record<string, unknown> | null }) {
  if (sourceMetadata(item.metadata)) throw new ApiError("Nội dung nguồn chuẩn chỉ được thay đổi qua phiên bản ngân hàng.", 409);
  if (item.status !== "DRAFT") throw new ApiError("Chỉ được chỉnh nội dung trong bản nháp. Bản đã công bố được giữ nguyên.", 409);
}
export function theoryActor(resource: string, action = "read") {
  getAccessToken();
  const actor = useAuthStore.getState().user?.id;
  const assert = () => {
    const now = useAuthStore.getState();
    if (!actor || !now.accessToken || now.user?.id !== actor) throw new ApiError("Phiên quản trị đã thay đổi.", 401);
    if (!now.user.roles?.some((r) => r === "ROLE_ADMIN" || r === "ADMIN")) throw new ApiError("Không có quyền quản trị.", 403);
    // These two current controllers explicitly use ROLE_ADMIN for reads / draft creation.
    if (["traffic-signs", "memory-tips"].includes(resource) && ["read", "create"].includes(action)) return;
    const permissions = (now.user.permissions ?? []).map((p) => p.replace(/^PERM_/, ""));
    if (!permissions.includes(`${resource}:${action}`)) throw new ApiError("Bạn không có quyền thao tác nội dung này.", 403);
  };
  assert();
  return { id: actor!, assert };
}
/** Opaque comparison only: not a backend revision and not an atomic concurrency guarantee. */
export function contentFingerprint(value: unknown): string {
  const stable = (v: unknown): unknown => Array.isArray(v) ? v.map(stable) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, stable(x)])) : v;
  return JSON.stringify(stable(value));
}
export function validateChoiceDraft(type: string, content: string, options: { content: string; isCorrect: boolean }[]): string | null {
  if (!content.trim() || content.length > 50000) return "Nội dung câu hỏi phải có từ 1 đến 50.000 ký tự.";
  if (!["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"].includes(type)) return "Loại câu hỏi này hiện chỉ hỗ trợ xem.";
  if (options.length > 50 || options.some((o) => !o.content.trim() || o.content.length > 10000 || typeof o.isCorrect !== "boolean")) return "Đáp án phải có nội dung, tối đa 50 đáp án và 10.000 ký tự mỗi đáp án.";
  const correct = options.filter((o) => o.isCorrect).length;
  if (type !== "MULTIPLE_CHOICE" && correct > 1) return "Loại câu hỏi này chỉ được chọn tối đa một đáp án đúng khi lưu nháp.";
  if (type === "TRUE_FALSE" && options.length > 2) return "Câu đúng/sai chỉ được có tối đa hai đáp án trong bản nháp.";
  return null;
}
