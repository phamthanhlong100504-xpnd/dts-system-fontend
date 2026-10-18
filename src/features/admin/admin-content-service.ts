import { contentBuilderApi } from "@/lib/api";
import { readContentBuilderCollection } from "./content-builder-pagination";

export interface ContentQuestionOption {
  id?: string;
  label?: string;
  text?: string;
  content?: string;
  isCorrect?: boolean;
  is_correct?: boolean;
  correct?: boolean;
}
interface ContentQuestionRecord {
  id: string;
  content?: string;
  questionText?: string;
  title?: string;
  type?: string;
  status?: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  metadata?: { chapterId?: number | string; isCritical?: boolean; imageUrl?: string; mediaUrl?: string };
  explanations?: { text?: string };
  explanation?: string;
  options?: ContentQuestionOption[];
  mediaFileIds?: string[];
  mediaUrl?: string;
  imageUrl?: string;
}

export interface AdminQuestionItem {
  id: string; // readable short ID
  rawId: string; // the original UUID for API calls
  title: string;
  type: string;
  program: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  isCritical?: boolean;
  chapter?: number;
  options?: ContentQuestionOption[];
  explanation?: string;
  imageUrl?: string;
}

function toAdminQuestion(q: ContentQuestionRecord): AdminQuestionItem {
  return {
    id: q.id ? `#Q-${q.id.substring(0, 6)}` : "#Q-UNKNOWN",
    rawId: q.id ?? "",
    title: q.content || q.questionText || q.title || "Câu hỏi chưa có nội dung",
    type: q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE" ? "Trắc nghiệm" : (q.type ?? "Không xác định"),
    program: q.metadata?.chapterId ? `Chương ${q.metadata.chapterId}` : "Chưa phân chương",
    status: q.status ?? "DRAFT",
    isCritical: q.metadata?.isCritical === true,
    chapter: typeof q.metadata?.chapterId === "number" ? q.metadata.chapterId : undefined,
    explanation: q.explanations?.text || q.explanation,
    options: q.options,
    imageUrl: q.mediaFileIds?.[0] || q.mediaUrl || q.metadata?.mediaUrl || q.metadata?.imageUrl || q.imageUrl,
  };
}

export async function fetchAdminQuestions(): Promise<AdminQuestionItem[]> {
  const questions = await readContentBuilderCollection<ContentQuestionRecord>("/v1/questions");
  if (questions.some((q) => !q.id || !q.status)) throw new Error("Content Builder trả câu hỏi thiếu id/status; không gán trạng thái giả.");
  return questions.map(toAdminQuestion);
}

export async function fetchAdminQuestionDetail(rawId: string): Promise<AdminQuestionItem | null> {
  if (!rawId) return null;
  const question = await contentBuilderApi.get<ContentQuestionRecord>(`/v1/questions/${encodeURIComponent(rawId)}?includeOptions=true`);
  return question ? toAdminQuestion(question) : null;
}

export interface CreateQuestionPayload {
  content: string;
  type?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isCritical?: boolean;
  explanation?: string;
  mediaUrl?: string;
  options?: { content: string; isCorrect: boolean; sortOrder: number }[];
}
function buildQuestionBody(payload: CreateQuestionPayload) {
  return {
    type: payload.type || "SINGLE_CHOICE",
    content: payload.content,
    status: payload.status || "PUBLISHED",
    explanations: payload.explanation ? { text: payload.explanation } : undefined,
    mediaFileIds: payload.mediaUrl ? [payload.mediaUrl] : undefined,
    metadata: { isCritical: payload.isCritical },
    options: payload.options?.map((opt, idx) => ({ content: opt.content, isCorrect: opt.isCorrect, sortOrder: idx + 1 })),
  };
}
export async function createQuestionApi(payload: CreateQuestionPayload) {
  const endpoint = payload.status === "PUBLISHED" ? "/v1/questions/published" : "/v1/questions/draft";
  return contentBuilderApi.post<ContentQuestionRecord>(endpoint, buildQuestionBody(payload));
}
export interface UpdateQuestionPayload extends CreateQuestionPayload { id: string }
export async function updateQuestionApi(payload: UpdateQuestionPayload) {
  return contentBuilderApi.put<ContentQuestionRecord>(`/v1/questions/${encodeURIComponent(payload.id)}`, buildQuestionBody(payload));
}
export async function deleteQuestionApi(id: string) {
  return contentBuilderApi.delete<void>(`/v1/questions/${encodeURIComponent(id)}`);
}
