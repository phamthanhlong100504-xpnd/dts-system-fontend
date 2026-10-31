import { contentBuilderApi, ApiError } from "@/lib/api";
import { readContentBuilderCollection } from "./content-builder-pagination";
import { readContentQuestion } from "./admin-content-service";
import { assertCustomDraft, contentFingerprint, isUuid, record, sourceMetadata, status, text, theoryActor, type TheoryStatus } from "./theory/theory-contract";

export interface ChapterItem { id: string; title: string; status: TheoryStatus; createdAt?: string; description?: string; metadata?: Record<string, unknown> | null; updatedAt?: string }
export interface QuestionBlockItem { id: string; chapterId: string; parentId?: string; questionId?: string; title: string; sortOrder: number; status: string }
export interface ChapterDetail extends ChapterItem { questionBlocks: QuestionBlockItem[] }
function readChapter(value: unknown): ChapterItem {
  const v = record(value); if (!isUuid(v.id)) throw new Error("Chưa xác định được mã chương.");
  const metadata = v.metadata == null ? null : record(v.metadata);
  return {
    id: v.id, title: text(v.title, "tên chương"), status: status(v.status), metadata,
    description: typeof metadata?.description === "string" ? metadata.description : "", createdAt: typeof v.createdAt === "string" ? v.createdAt : undefined, updatedAt: typeof v.updatedAt === "string" ? v.updatedAt : undefined
  };
}
export async function fetchAdminChapters(): Promise<ChapterItem[]> {
  const actor = theoryActor("chapters"); const rows = await readContentBuilderCollection<unknown>("/v1/chapters"); actor.assert();
  return rows.map(readChapter).filter((c) => !sourceMetadata(c.metadata));
}
export async function fetchAdminChapterDetail(id: string): Promise<ChapterDetail | null> {
  if (!id) return null; if (!isUuid(id)) throw new Error("Mã chương không hợp lệ.");
  const actor = theoryActor("chapters"); const raw = record(await contentBuilderApi.get<unknown>(`/v1/chapters/${id}`)); actor.assert();
  const chapter = readChapter(raw); if (chapter.id !== id || sourceMetadata(chapter.metadata)) throw new ApiError("Chương nguồn chuẩn được xem tại khu vực ngân hàng chuẩn.", 409);
  if (!Array.isArray(raw.questionBlocks)) throw new Error("Hệ thống chưa trả danh sách liên kết của chương.");
  const blocks = raw.questionBlocks.map((value) => { const b = record(value); if (!isUuid(b.id) || b.chapterId !== id || !Number.isInteger(b.sortOrder)) throw new Error("Liên kết câu hỏi không hợp lệ."); return { id: b.id, chapterId: id, parentId: isUuid(b.parentId) ? b.parentId : undefined, questionId: isUuid(b.questionId) ? b.questionId : undefined, title: text(b.title, "tên liên kết"), sortOrder: b.sortOrder as number, status: status(b.status) }; });
  return { ...chapter, questionBlocks: blocks };
}
export async function createChapterApi(payload: { title: string; status?: "DRAFT" | "PUBLISHED"; description?: string }) {
  if (payload.status && payload.status !== "DRAFT") throw new ApiError("Công bố chương cần quy trình phát hành chính thức.", 403);
  const actor = theoryActor("chapters", "create"); const result = readChapter(await contentBuilderApi.post<unknown>("/v1/chapters/draft", { title: payload.title, metadata: { description: payload.description ?? "" } })); actor.assert();
  if (result.status !== "DRAFT" || result.title !== payload.title || result.description !== (payload.description ?? "")) throw new Error("Chưa xác nhận chương nháp."); return result;
}
async function draft(id: string, action = "update") {
  const actor = theoryActor("chapters", action); const parent = await fetchAdminChapterDetail(id); actor.assert(); if (!parent) throw new Error("Không tìm thấy chương."); assertCustomDraft(parent); return { actor, parent };
}
export async function updateChapterApi(id: string, payload: { title: string; status: string; description?: string; expectedFingerprint?: string }) {
  const { actor, parent } = await draft(id);
  if (!payload.expectedFingerprint || contentFingerprint(parent) !== payload.expectedFingerprint) throw new ApiError("Chương đã thay đổi. Giữ nội dung đang nhập và mở lại trước khi lưu.", 409);
  if (!["DRAFT", "ARCHIVED"].includes(payload.status)) throw new ApiError("Không đổi trực tiếp trạng thái công bố hoặc khôi phục bản cũ.", 409);
  const result = readChapter(await contentBuilderApi.put<unknown>(`/v1/chapters/${id}`, { title: payload.title, status: payload.status, metadata: { ...parent.metadata, description: payload.description ?? "" } })); actor.assert(); if (result.id !== id || result.status !== payload.status || result.title !== payload.title || result.description !== (payload.description ?? "")) throw new Error("Chưa xác nhận đầy đủ nội dung chương được lưu."); return result;
}
export async function deleteChapterApi(id: string) { const { actor } = await draft(id, "delete"); await contentBuilderApi.delete<void>(`/v1/chapters/${id}`); actor.assert(); }
export async function addQuestionBlockApi(id: string, payload: { questionId: string; title: string; status?: string }) {
  const { actor, parent } = await draft(id);
  if (parent.questionBlocks.some((b) => b.questionId === payload.questionId)) throw new ApiError("Câu hỏi đã có trong chương.", 409);
  const q = readContentQuestion(await contentBuilderApi.get<unknown>(`/v1/questions/${encodeURIComponent(payload.questionId)}?includeOptions=true`)); actor.assert();
  if (q.id !== payload.questionId || q.status !== "PUBLISHED" || sourceMetadata(q.metadata)) throw new ApiError("Chỉ có thể thêm câu hỏi tự biên đã công bố vào chương này.", 409);
  const result = await contentBuilderApi.post(`/v1/chapters/${id}/question-blocks`, { questionId: q.id, title: payload.title, status: "DRAFT" }); actor.assert(); return result;
}
export async function deleteQuestionBlockApi(id: string, blockId: string) {
  const { actor, parent } = await draft(id);
  if (!parent.questionBlocks.some((b) => b.id === blockId) || parent.questionBlocks.some((b) => b.parentId === blockId)) throw new ApiError("Không thể gỡ mục này vì không thuộc chương hoặc vẫn chứa mục con.", 409);
  await contentBuilderApi.delete<void>(`/v1/chapters/${id}/question-blocks/${encodeURIComponent(blockId)}`); actor.assert();
}
export async function reorderQuestionBlocksApi(id: string, payload: { id: string; sortOrder: number }[], expectedFingerprint: string) {
  const { actor, parent } = await draft(id); if (!expectedFingerprint || contentFingerprint(parent) !== expectedFingerprint) throw new ApiError("Cấu trúc đã thay đổi. Tải lại trước khi sắp xếp.", 409); const ids = new Set(payload.map((b) => b.id));
  if (parent.questionBlocks.some((b) => b.parentId) || ids.size !== payload.length || payload.length !== parent.questionBlocks.length || parent.questionBlocks.some((b) => !ids.has(b.id)) || payload.some((b, i) => b.sortOrder !== i)) throw new ApiError("Thứ tự hoặc cấu trúc chương đã thay đổi. Tải lại trước khi sắp xếp.", 409);
  const result = await contentBuilderApi.put(`/v1/chapters/${id}/question-blocks/reorder`, payload); actor.assert(); return result;
}
