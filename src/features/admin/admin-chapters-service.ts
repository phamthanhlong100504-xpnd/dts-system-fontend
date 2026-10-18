import { contentBuilderApi } from "@/lib/api";
import { readContentBuilderCollection } from "./content-builder-pagination";

interface ChapterRecord {
  id: string;
  title: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  createdAt?: string;
  metadata?: { description?: string };
  questionBlocks?: QuestionBlockItem[];
}

export interface ChapterItem {
  id: string;
  title: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  createdAt?: string;
  description?: string;
}

export async function fetchAdminChapters(): Promise<ChapterItem[]> {
  try {
    const list = await readContentBuilderCollection<ChapterRecord>("/v1/chapters");
    if (Array.isArray(list)) {
      return list.map((c: ChapterRecord) => ({
        id: c.id,
        title: c.title || "Chương chưa đặt tên",
        status: c.status || "PUBLISHED",
        createdAt: c.createdAt,
        description: c.metadata?.description || "Chưa có mô tả",
      }));
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error("Không tải được dữ liệu Content Builder.");
  }
  return [];
}

export async function createChapterApi(payload: { title: string; status?: "DRAFT" | "PUBLISHED"; description?: string }) {
  const endpoint = payload.status === "DRAFT" ? "/v1/chapters/draft" : "/v1/chapters/published";
  return await contentBuilderApi.post<ChapterRecord>(endpoint, payload);
}

export async function deleteChapterApi(id: string) {
  return await contentBuilderApi.delete<void>(`/v1/chapters/${id}`);
}

export async function updateChapterApi(id: string, payload: { title: string; status: string; description?: string }) {
  const body = {
    title: payload.title,
    status: payload.status,
    metadata: { description: payload.description }
  };
  return await contentBuilderApi.put<ChapterRecord>(`/v1/chapters/${id}`, body);
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
    const res = await contentBuilderApi.get<ChapterRecord>(`/v1/chapters/${chapterId}`);
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
  return await contentBuilderApi.post<ChapterRecord>(`/v1/chapters/${chapterId}/question-blocks`, payload);
}

export async function deleteQuestionBlockApi(chapterId: string, blockId: string) {
  return await contentBuilderApi.delete<void>(`/v1/chapters/${chapterId}/question-blocks/${blockId}`);
}

export async function reorderQuestionBlocksApi(chapterId: string, payload: { id: string; sortOrder: number }[]) {
  return await contentBuilderApi.put<ChapterRecord>(`/v1/chapters/${chapterId}/question-blocks/reorder`, payload);
}
