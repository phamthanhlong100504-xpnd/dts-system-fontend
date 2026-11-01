import { contentBuilderApi, ApiError } from "@/lib/api";
import { readContentBuilderCollection } from "./content-builder-pagination";
import { fetchAdminChapterDetail } from "./admin-chapters-service";
import { assertCustomDraft, contentFingerprint, isUuid, record, sourceMetadata, status, text, theoryActor, type TheoryStatus } from "./theory/theory-contract";

export interface ProgramItem { id: string; title: string; code: string; description: string; status: TheoryStatus; createdAt?: string; createdBy?: string; chapterBlocksCount?: number; metadata?: Record<string, unknown> | null }
export interface ChapterBlockItem { id: string; learningProgramId: string; parentId?: string; chapterId?: string; title: string; sortOrder: number; status: string; children?: ChapterBlockItem[] }
export interface ProgramDetail extends ProgramItem { chapterBlocks: ChapterBlockItem[]; updatedAt?: string }
function readProgram(value: unknown): ProgramItem {
  const v = record(value); if (!isUuid(v.id)) throw new Error("Chưa xác định được mã chương trình.");
  const metadata = v.metadata == null ? null : record(v.metadata);
  return { id: v.id, title: text(v.title, "tên chương trình"), code: typeof v.code === "string" ? v.code : "", description: typeof v.description === "string" ? v.description : "", status: status(v.status), metadata, createdBy: typeof v.createdBy === "string" ? v.createdBy : undefined, createdAt: typeof v.createdAt === "string" ? v.createdAt : undefined, chapterBlocksCount: Array.isArray(v.chapterBlocks) ? v.chapterBlocks.length : undefined };
}
export async function fetchAdminPrograms(): Promise<ProgramItem[]> {
  const actor = theoryActor("learning-programs"); const rows = await readContentBuilderCollection<unknown>("/v1/learning-programs"); actor.assert();
  return rows.map(readProgram).filter((p) => !sourceMetadata(p.metadata));
}
export async function fetchAdminProgramDetail(id: string): Promise<ProgramDetail | null> {
  if (!id) return null; if (!isUuid(id)) throw new Error("Mã chương trình không hợp lệ.");
  const actor = theoryActor("learning-programs"); const raw = record(await contentBuilderApi.get<unknown>(`/v1/learning-programs/${id}?includeChapterBlocks=true`)); actor.assert();
  const program = readProgram(raw); if (program.id !== id || sourceMetadata(program.metadata)) throw new ApiError("Không chỉnh chương trình thuộc nguồn chuẩn qua biểu mẫu tự biên.", 409);
  function block(value: unknown): ChapterBlockItem { const b = record(value); if (!isUuid(b.id) || b.learningProgramId !== id || !Number.isInteger(b.sortOrder)) throw new Error("Liên kết chương không hợp lệ."); return { id: b.id, learningProgramId: id, parentId: isUuid(b.parentId) ? b.parentId : undefined, chapterId: isUuid(b.chapterId) ? b.chapterId : undefined, title: text(b.title, "tên liên kết"), sortOrder: b.sortOrder as number, status: status(b.status), children: Array.isArray(b.children) ? b.children.map(block) : [] }; }
  if (!Array.isArray(raw.chapterBlocks)) throw new Error("Hệ thống chưa trả cây chương trình.");
  return { ...program, chapterBlocks: raw.chapterBlocks.map(block), updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined };
}
export async function createProgramApi(payload: { title: string; code: string; description?: string; status?: "DRAFT" | "PUBLISHED" }) {
  if (payload.status && payload.status !== "DRAFT") throw new ApiError("Công bố chương trình cần quy trình phát hành chính thức.", 403);
  const actor = theoryActor("learning-programs", "create"); const result = readProgram(await contentBuilderApi.post<unknown>("/v1/learning-programs/draft", { title: payload.title, code: payload.code, description: payload.description ?? "" })); actor.assert();
  if (result.status !== "DRAFT" || result.title !== payload.title || result.code !== payload.code || result.description !== (payload.description ?? "")) throw new Error("Chưa xác nhận chương trình nháp."); return result;
}
async function draft(id: string, action = "update") { const actor = theoryActor("learning-programs", action); const parent = await fetchAdminProgramDetail(id); actor.assert(); if (!parent) throw new Error("Không tìm thấy chương trình."); assertCustomDraft(parent); if (parent.createdBy !== actor.id) throw new ApiError("Chỉ chủ biên soạn được thay đổi chương trình nháp này.", 403); return { actor, parent }; }
export async function updateProgramApi(id: string, payload: { title: string; code?: string; description?: string; status: TheoryStatus; expectedFingerprint?: string }) {
  const { actor, parent } = await draft(id); if (!payload.expectedFingerprint || contentFingerprint(parent) !== payload.expectedFingerprint) throw new ApiError("Chương trình đã thay đổi. Giữ nội dung đang nhập và mở lại trước khi lưu.", 409); if (!["DRAFT", "ARCHIVED"].includes(payload.status)) throw new ApiError("Không công bố hoặc chuyển bản đã công bố về nháp tại chỗ.", 409);
  const result = readProgram(await contentBuilderApi.put<unknown>(`/v1/learning-programs/${id}`, { title: payload.title, code: payload.code ?? parent.code, description: payload.description ?? "", status: payload.status, metadata: parent.metadata })); actor.assert(); if (result.id !== id || result.status !== payload.status || result.title !== payload.title || result.code !== (payload.code ?? parent.code) || result.description !== (payload.description ?? "")) throw new Error("Chưa xác nhận đầy đủ nội dung chương trình được lưu."); return result;
}
export async function deleteProgramApi(id: string) { const { actor } = await draft(id, "delete"); await contentBuilderApi.delete<void>(`/v1/learning-programs/${id}`); actor.assert(); }
export async function addChapterBlockApi(id: string, payload: { chapterId: string; title: string; status?: string }) {
  const { actor, parent } = await draft(id); if (parent.chapterBlocks.some((b) => b.chapterId === payload.chapterId)) throw new ApiError("Chương đã có trong chương trình.", 409);
  const chapter = await fetchAdminChapterDetail(payload.chapterId); actor.assert(); if (!chapter || !["DRAFT", "PUBLISHED"].includes(chapter.status)) throw new ApiError("Chương được chọn chưa đủ điều kiện sử dụng trong bản nháp.", 409);
  const result = await contentBuilderApi.post(`/v1/learning-programs/${id}/chapter-blocks`, { chapterId: chapter.id, title: payload.title, status: "DRAFT" }); actor.assert(); return result;
}
export async function deleteChapterBlockApi(id: string, blockId: string) {
  const { actor, parent } = await draft(id); const b = parent.chapterBlocks.find((x) => x.id === blockId);
  if (!b || b.children?.length) throw new ApiError("Không thể gỡ mục này vì không thuộc chương trình hoặc vẫn chứa mục con.", 409);
  await contentBuilderApi.delete<void>(`/v1/learning-programs/${id}/chapter-blocks/${encodeURIComponent(blockId)}`); actor.assert();
}
export async function reorderChapterBlocksApi(id: string, payload: { id: string; sortOrder: number }[], expectedFingerprint: string) {
  const { actor, parent } = await draft(id); if (!expectedFingerprint || contentFingerprint(parent) !== expectedFingerprint) throw new ApiError("Cấu trúc đã thay đổi. Tải lại trước khi sắp xếp.", 409); const ids = new Set(payload.map((b) => b.id));
  if (parent.chapterBlocks.some((b) => b.parentId || b.children?.length) || ids.size !== payload.length || payload.length !== parent.chapterBlocks.length || parent.chapterBlocks.some((b) => !ids.has(b.id)) || payload.some((b, i) => b.sortOrder !== i)) throw new ApiError("Thứ tự hoặc cây chương đã thay đổi. Tải lại trước khi sắp xếp.", 409);
  const result = await contentBuilderApi.put(`/v1/learning-programs/${id}/chapter-blocks/reorder`, payload); actor.assert(); return result;
}
