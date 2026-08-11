import { contentBuilderApi } from "@/lib/api";

export interface AdminQuestionItem {
  id: string;      // hiển thị: "#Q-xxxxxx"
  rawId: string;   // UUID thật để gọi API
  title: string;
  type: string;
  program: string;
  status: "PUBLISHED" | "DRAFT";
  isCritical?: boolean;
  chapter?: number;
  options?: any[];
  explanation?: string;
}

export async function fetchAdminQuestions(): Promise<AdminQuestionItem[]> {
  try {
    const res = await contentBuilderApi.get<any>("/v1/questions?size=100");
    const list = Array.isArray(res) ? res : res?.content || [];
    if (Array.isArray(list) && list.length > 0) {
      return list.map((q: any) => ({
        id: q.id ? `#Q-${q.id.substring(0, 6)}` : "#Q-DRAFT",
        rawId: q.id || "",
        title: q.content || q.questionText || q.title || "Câu hỏi chưa có nội dung",
        type: q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE" ? "Trắc nghiệm" : "Tự luận",
        program: q.metadata?.chapterId ? `Chương ${q.metadata.chapterId}` : "Bộ đề GPLX",
        status: q.status || "PUBLISHED",
        isCritical: Boolean(q.metadata?.isCritical),
        chapter: q.metadata?.chapterId,
        explanation: q.explanations?.text,
        options: q.options,
      }));
    }
  } catch {
    // content-builder API yêu cầu JWT token hợp lệ → rơi xuống dữ liệu mẫu
  }

  return [];
}

/* ==================== CREATE ==================== */
export interface CreateQuestionPayload {
  content: string;
  type?: string;
  status?: "DRAFT" | "PUBLISHED";
  isCritical?: boolean;
  chapterId?: number;
  explanation?: string;
  options?: { content: string; isCorrect: boolean; sortOrder: number }[];
}

function buildQuestionBody(payload: CreateQuestionPayload) {
  return {
    type: payload.type || "SINGLE_CHOICE",
    content: payload.content,
    status: payload.status || "PUBLISHED",
    explanations: payload.explanation ? { text: payload.explanation } : undefined,
    metadata: {
      isCritical: payload.isCritical,
      chapterId: payload.chapterId || 1,
    },
    options: payload.options?.map((opt, idx) => ({
      content: opt.content,
      isCorrect: opt.isCorrect,
      sortOrder: idx + 1,
    })),
  };
}

export async function createQuestionApi(payload: CreateQuestionPayload) {
  const endpoint =
    payload.status === "PUBLISHED" ? "/v1/questions/published" : "/v1/questions/draft";
  return await contentBuilderApi.post<any>(endpoint, buildQuestionBody(payload));
}

/* ==================== UPDATE ==================== */
export interface UpdateQuestionPayload extends CreateQuestionPayload {
  id: string; // UUID
}

export async function updateQuestionApi(payload: UpdateQuestionPayload) {
  return await contentBuilderApi.put<any>(
    `/v1/questions/${payload.id}`,
    buildQuestionBody(payload)
  );
}

/* ==================== DELETE ==================== */
export async function deleteQuestionApi(id: string) {
  return await contentBuilderApi.delete<void>(`/v1/questions/${id}`);
}
