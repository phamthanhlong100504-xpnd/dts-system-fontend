import { contentBuilderApi } from "@/lib/api";

export interface ChapterItem {
  id: string;
  title: string;
  status: "PUBLISHED" | "DRAFT";
  createdAt?: string;
  description?: string;
}

export async function fetchAdminChapters(): Promise<ChapterItem[]> {
  try {
    const res = await contentBuilderApi.get<any>("/v1/chapters?size=100");
    const list = Array.isArray(res) ? res : res?.content || [];
    if (Array.isArray(list)) {
      return list.map((c: any) => ({
        id: c.id,
        title: c.title || "Chương chưa đặt tên",
        status: c.status || "PUBLISHED",
        createdAt: c.createdAt,
        description: c.metadata?.description || "Chưa có mô tả",
      }));
    }
  } catch {
    // API fail fallback
  }
  return [];
}

export async function createChapterApi(payload: { title: string; status?: "DRAFT" | "PUBLISHED"; description?: string }) {
  const endpoint = payload.status === "DRAFT" ? "/v1/chapters/draft" : "/v1/chapters/published";
  return await contentBuilderApi.post<any>(endpoint, payload);
}

export async function deleteChapterApi(id: string) {
  return await contentBuilderApi.delete<void>(`/v1/chapters/${id}`);
}

/* ==================== CHAPTER DETAILS & QUESTION BLOCKS ==================== */

export interface QuestionBlockItem {
  id: string;
  chapterId: string;
  parentId?: string;
  questionId?: string;
  title: string;
  sortOrder: number;
  status: string;
}

export interface ChapterDetail {
  id: string;
  title: string;
  description?: string;
  status: string;
  questionBlocks: QuestionBlockItem[];
}

export async function fetchAdminChapterDetail(chapterId: string): Promise<ChapterDetail | null> {
  if (!chapterId) return null;
  try {
    const res = await contentBuilderApi.get<any>(`/v1/chapters/${chapterId}`);
    return {
      id: res.id,
      title: res.title,
      description: res.metadata?.description,
      status: res.status,
      questionBlocks: res.questionBlocks || [],
    };
  } catch {
    return null;
  }
}

export async function addQuestionBlockApi(chapterId: string, payload: { questionId: string; title: string; status?: string }) {
  return await contentBuilderApi.post<any>(`/v1/chapters/${chapterId}/question-blocks`, payload);
}

export async function deleteQuestionBlockApi(chapterId: string, blockId: string) {
  return await contentBuilderApi.delete<void>(`/v1/chapters/${chapterId}/question-blocks/${blockId}`);
}

export async function reorderQuestionBlocksApi(chapterId: string, payload: { id: string; sortOrder: number }[]) {
  return await contentBuilderApi.put<any>(`/v1/chapters/${chapterId}/question-blocks/reorder`, payload);
}
