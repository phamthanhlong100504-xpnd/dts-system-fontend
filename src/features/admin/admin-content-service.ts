import { contentBuilderApi, ApiError } from "@/lib/api";
import { readContentBuilderCollection } from "./content-builder-pagination";
import { assertCustomDraft, contentFingerprint, isUuid, record, sourceMetadata, status, text, theoryActor, validateChoiceDraft, type TheoryStatus } from "./theory/theory-contract";

export interface ContentQuestionOption {
  id?: string; label?: string; text?: string; content?: string; isCorrect?: boolean;
  is_correct?: boolean; correct?: boolean; sortOrder?: number; status?: TheoryStatus; metadata?: Record<string, unknown> | null;
}
export interface ContentQuestionRecord {
  id: string; content: string; type: string; status: TheoryStatus;
  metadata?: Record<string, unknown> | null; explanations?: Record<string, unknown> | null;
  attachments?: Record<string, unknown> | null; references?: Record<string, unknown> | null;
  options?: ContentQuestionOption[]; mediaFileIds?: string[]; createdBy?: string; updatedAt?: string;
}
export interface AdminQuestionItem {
  id: string; rawId: string; title: string; type: string; program: string; status: TheoryStatus;
  isCritical?: boolean; chapter?: number; options?: ContentQuestionOption[]; explanation?: string; imageUrl?: string;
}
export function readContentQuestion(value: unknown): ContentQuestionRecord {
  const q = record(value);
  if (!isUuid(q.id)) throw new Error("Chưa xác định được mã câu hỏi.");
  const metadata = q.metadata == null ? null : record(q.metadata);
  const explanations = q.explanations == null ? null : record(q.explanations);
  if (q.options !== undefined && q.options !== null && !Array.isArray(q.options)) throw new Error("Danh sách đáp án không hợp lệ.");
  const options = Array.isArray(q.options) ? q.options.map((v) => {
    const o = record(v);
    if (!isUuid(o.id) || typeof o.content !== "string" || typeof o.isCorrect !== "boolean" || !Number.isInteger(o.sortOrder)) throw new Error("Thông tin đáp án chưa đầy đủ. Vui lòng tải lại.");
    return { id: o.id, content: o.content, isCorrect: o.isCorrect, sortOrder: o.sortOrder as number, status: status(o.status), metadata: o.metadata == null ? null : record(o.metadata) };
  }).sort((a, b) => a.sortOrder - b.sortOrder) : undefined;
  if (q.mediaFileIds != null && (!Array.isArray(q.mediaFileIds) || q.mediaFileIds.some((id) => !isUuid(id)))) throw new Error("Vui lòng chọn ảnh từ thư viện tài nguyên.");
  return {
    id: q.id, content: text(q.content, "nội dung câu hỏi"), type: text(q.type, "loại câu hỏi"), status: status(q.status), metadata, explanations,
    attachments: q.attachments == null ? null : record(q.attachments), references: q.references == null ? null : record(q.references),
    options, mediaFileIds: (q.mediaFileIds as string[] | null) ?? [], createdBy: typeof q.createdBy === "string" ? q.createdBy : undefined, updatedAt: typeof q.updatedAt === "string" ? q.updatedAt : undefined
  };
}
function toAdminQuestion(q: ContentQuestionRecord): AdminQuestionItem {
  return {
    id: `#Q-${q.id.slice(0, 6)}`, rawId: q.id, title: q.content,
    type: ({ SINGLE_CHOICE: "Một đáp án", MULTIPLE_CHOICE: "Nhiều đáp án", TRUE_FALSE: "Đúng / Sai" } as Record<string, string>)[q.type] ?? q.type,
    program: q.metadata?.chapterId ? `Chương ${q.metadata.chapterId}` : "Chưa phân chương", status: q.status,
    isCritical: q.metadata?.isCritical === true, chapter: typeof q.metadata?.chapterId === "number" ? q.metadata.chapterId : undefined,
    explanation: typeof q.explanations?.text === "string" ? q.explanations.text : undefined, options: q.options, imageUrl: q.mediaFileIds?.[0]
  };
}
export async function fetchAdminQuestions(): Promise<AdminQuestionItem[]> {
  const actor = theoryActor("questions");
  const rows = await readContentBuilderCollection<unknown>("/v1/questions"); actor.assert();
  return rows.map(readContentQuestion).filter((q) => !sourceMetadata(q.metadata)).map(toAdminQuestion);
}
export async function fetchEditableAdminQuestion(id: string, signal?: AbortSignal): Promise<ContentQuestionRecord> {
  if (!isUuid(id)) throw new Error("Mã câu hỏi không hợp lệ.");
  const actor = theoryActor("questions");
  const q = readContentQuestion(await contentBuilderApi.get<unknown>(`/v1/questions/${id}?includeOptions=true`, { signal })); actor.assert();
  if (q.id !== id || sourceMetadata(q.metadata)) throw new ApiError("Ngân hàng chuẩn phải được xem tại khu vực ngân hàng, không dùng biểu mẫu câu hỏi tự biên.", 409);
  if (!q.options) throw new Error("Hệ thống chưa trả danh sách đáp án.");
  return q;
}
export async function fetchAdminQuestionDetail(id: string): Promise<AdminQuestionItem | null> {
  if (!id) return null;
  return toAdminQuestion(await fetchEditableAdminQuestion(id));
}
export interface CreateQuestionPayload {
  content: string; type?: string; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; isCritical?: boolean; explanation?: string; mediaUrl?: string;
  options?: { id?: string; content: string; isCorrect: boolean; sortOrder: number }[];
}
export interface UpdateQuestionPayload extends CreateQuestionPayload { id: string; expectedFingerprint?: string }
export class PartialQuestionSaveError extends ApiError {
  constructor(cause: unknown) { super("Một phần bản nháp có thể đã được lưu. Nội dung đang nhập được giữ lại, kiểm tra bản trên hệ thống trước khi lưu tiếp.", cause instanceof ApiError && typeof cause.status === "number" && [401, 403].includes(cause.status) ? cause.status : 409, "PARTIAL_QUESTION_SAVE"); }
}
function validate(payload: CreateQuestionPayload) {
  const invalid = validateChoiceDraft(payload.type ?? "SINGLE_CHOICE", payload.content, payload.options ?? []);
  if (invalid) throw new Error(invalid);
  if (payload.mediaUrl && !isUuid(payload.mediaUrl)) throw new Error("Vui lòng chọn ảnh từ thư viện tài nguyên.");
  if (payload.status === "PUBLISHED") throw new ApiError("Công bố cần quy trình phê duyệt/phát hành chính thức.", 403);
}
export async function createQuestionApi(payload: CreateQuestionPayload) {
  validate(payload);
  if (payload.status && payload.status !== "DRAFT") throw new Error("Câu hỏi mới cần được lưu ở dạng bản nháp.");
  const actor = theoryActor("questions", "create");
  const data = await contentBuilderApi.post<unknown>("/v1/questions/draft", {
    type: payload.type ?? "SINGLE_CHOICE", content: payload.content, explanations: payload.explanation ? { text: payload.explanation } : {},
    mediaFileIds: payload.mediaUrl ? [payload.mediaUrl] : [], metadata: { isCritical: payload.isCritical === true },
    options: payload.options?.map((o, i) => ({ content: o.content, isCorrect: o.isCorrect, sortOrder: i })),
  }); actor.assert();
  const q = readContentQuestion(data);
  if (q.status !== "DRAFT" || sourceMetadata(q.metadata)) throw new Error("Hệ thống chưa xác nhận câu hỏi nháp độc lập.");
  return q;
}
export async function updateQuestionApi(payload: UpdateQuestionPayload) {
  const actor = theoryActor("questions", "update");
  const current = await fetchEditableAdminQuestion(payload.id); actor.assert();
  if (!payload.expectedFingerprint || contentFingerprint(current) !== payload.expectedFingerprint) throw new ApiError("Bản trên hệ thống đã khác nội dung được mở. Giữ nội dung đang nhập và kiểm tra lại.", 409);
  if (payload.status === "ARCHIVED") {
    if (current.status !== "PUBLISHED") throw new ApiError("Chỉ lưu trữ câu đã công bố qua thao tác này.", 409);
    const result = readContentQuestion(await contentBuilderApi.put<unknown>(`/v1/questions/${current.id}`, { type: current.type, content: current.content, status: "ARCHIVED", metadata: current.metadata, explanations: current.explanations, mediaFileIds: current.mediaFileIds, attachments: current.attachments, references: current.references })); actor.assert();
    if (result.status !== "ARCHIVED") throw new Error("Chưa xác nhận trạng thái lưu trữ.");
    return result;
  }
  validate(payload); assertCustomDraft(current);
  if (current.createdBy !== actor.id) throw new ApiError("Chỉ người tạo câu hỏi được chỉnh sửa đáp án.", 403);
  if (current.options?.some(o => o.status !== "DRAFT")) throw new ApiError("Đáp án đã công bố không được sửa tại chỗ.", 409);
  const mediaFileIds = [...(payload.mediaUrl ? [payload.mediaUrl] : []), ...(current.mediaFileIds ?? []).slice(1)].filter((id, i, all) => all.indexOf(id) === i);
  const desired = payload.options ?? [];
  const previous = current.options ?? [];
  const desiredIds = desired.map((o) => o.id).filter(isUuid);
  if (new Set(desiredIds).size !== desiredIds.length || desiredIds.some((id) => !previous.some((o) => o.id === id))) throw new Error("Đáp án không thuộc câu hỏi đang sửa.");
  let writeAttempted = false;
  const base = `/v1/questions/${current.id}`;
  const send = async <T,>(run: () => Promise<T>) => { actor.assert(); writeAttempted = true; const value = await run(); actor.assert(); return value; };
  try {
    // Clear old correct flags first; SINGLE_CHOICE must never temporarily gain a second correct answer.
    for (const old of previous.filter((o) => o.isCorrect && !desired.some((d) => d.id === o.id && d.isCorrect))) {
      await send(() => contentBuilderApi.put(`${base}/options/${old.id}`, { content: old.content, isCorrect: false, sortOrder: old.sortOrder, status: "DRAFT", metadata: old.metadata }));
    }
    await send(() => contentBuilderApi.put(base, { type: payload.type ?? current.type, content: payload.content, status: "DRAFT", explanations: { ...current.explanations, text: payload.explanation ?? "" }, mediaFileIds, metadata: { ...current.metadata, isCritical: payload.isCritical === true }, attachments: current.attachments, references: current.references }));
    for (const old of previous.filter((o) => !desiredIds.includes(o.id!))) await send(() => contentBuilderApi.delete(`${base}/options/${old.id}`));
    for (let index = 0; index < desired.length; index++) {
      const o = desired[index], old = previous.find((p) => p.id === o.id);
      const body = { content: o.content, isCorrect: o.isCorrect, sortOrder: index, status: "DRAFT", metadata: old?.metadata ?? {} };
      if (old) await send(() => contentBuilderApi.put(`${base}/options/${old.id}`, body));
      else await send(() => contentBuilderApi.post(`${base}/options`, body));
    }
    const saved = await fetchEditableAdminQuestion(current.id); actor.assert();
    const got = saved.options ?? [];
    if (saved.status !== "DRAFT" || saved.content !== payload.content || saved.type !== (payload.type ?? current.type) || saved.mediaFileIds?.join() !== mediaFileIds.join() || saved.explanations?.text !== (payload.explanation ?? "") || saved.metadata?.isCritical !== (payload.isCritical === true) || got.length !== desired.length || desired.some((o, i) => got[i]?.content !== o.content || got[i]?.isCorrect !== o.isCorrect)) throw new Error("Chưa xác nhận toàn bộ thay đổi.");
    return saved;
  } catch (error) { if (writeAttempted) throw new PartialQuestionSaveError(error); throw error; }
}
export async function deleteQuestionApi(id: string) {
  const actor = theoryActor("questions", "delete");
  const q = await fetchEditableAdminQuestion(id); actor.assert(); assertCustomDraft(q);
  await contentBuilderApi.delete<void>(`/v1/questions/${q.id}`); actor.assert();
}
