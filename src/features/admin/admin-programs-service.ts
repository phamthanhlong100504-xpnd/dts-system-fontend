import { contentBuilderApi } from "@/lib/api";
import { readContentBuilderCollection } from "./content-builder-pagination";

interface ProgramRecord {
  id: string;
  title: string;
  code: string;
  description?: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  createdAt?: string;
  metadata?: { description?: string };
  chapterBlocks?: ChapterBlockItem[];
}

export interface ProgramItem {
  id: string;
  title: string;
  code: string;
  description: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  createdAt?: string;
  chapterBlocksCount?: number;
}

export async function fetchAdminPrograms(): Promise<ProgramItem[]> {
  try {
    const list = await readContentBuilderCollection<ProgramRecord>("/v1/learning-programs");
    if (Array.isArray(list)) {
      return list.map((p: ProgramRecord) => ({
        id: p.id,
        title: p.title || p.code || "Chương trình chưa đặt tên",
        code: p.code || "N/A",
        description: p.description || "Chưa có mô tả",
        status: p.status || "PUBLISHED",
        createdAt: p.createdAt,
        chapterBlocksCount: Array.isArray(p.chapterBlocks) ? p.chapterBlocks.length : 0,
      }));
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error("Không tải được dữ liệu Content Builder.");
  }
  return [];
}

export async function createProgramApi(payload: { title: string; code: string; description?: string; status?: "DRAFT" | "PUBLISHED" }) {
  const endpoint = payload.status === "DRAFT" ? "/v1/learning-programs/draft" : "/v1/learning-programs/published";
  return await contentBuilderApi.post<ProgramRecord>(endpoint, payload);
}

export async function deleteProgramApi(id: string) {
  return await contentBuilderApi.delete<void>(`/v1/learning-programs/${id}`);
}

export async function updateProgramApi(id: string, payload: { title: string; code?: string; description?: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) {
  return await contentBuilderApi.put<ProgramRecord>(`/v1/learning-programs/${id}`, payload);
}

/* ==================== LEARNING PROGRAM DETAILS & CHAPTER BLOCKS ==================== */

export interface ChapterBlockItem {
  id: string;
  learningProgramId: string;
  parentId?: string;
  chapterId?: string;
  title: string;
  sortOrder: number;
  status: string;
}

export interface ProgramDetail {
  id: string;
  title: string;
  code: string;
  description?: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  chapterBlocks: ChapterBlockItem[];
}

export async function fetchAdminProgramDetail(programId: string): Promise<ProgramDetail | null> {
  if (!programId) return null;
  try {
    const res = await contentBuilderApi.get<ProgramRecord>(`/v1/learning-programs/${programId}?includeChapterBlocks=true`);
    return {
      id: res.id,
      title: res.title,
      code: res.code,
      description: res.metadata?.description,
      status: res.status,
      chapterBlocks: res.chapterBlocks || [],
    };
  } catch {
    return null;
  }
}

export async function addChapterBlockApi(programId: string, payload: { chapterId: string; title: string; status?: string }) {
  return await contentBuilderApi.post<ProgramRecord>(`/v1/learning-programs/${programId}/chapter-blocks`, payload);
}

export async function deleteChapterBlockApi(programId: string, blockId: string) {
  return await contentBuilderApi.delete<void>(`/v1/learning-programs/${programId}/chapter-blocks/${blockId}`);
}

export async function reorderChapterBlocksApi(programId: string, payload: { id: string; sortOrder: number }[]) {
  return await contentBuilderApi.put<ProgramRecord>(`/v1/learning-programs/${programId}/chapter-blocks/reorder`, payload);
}

