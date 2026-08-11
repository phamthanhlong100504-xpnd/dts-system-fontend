import { contentBuilderApi } from "@/lib/api";

export interface ProgramItem {
  id: string;
  title: string;
  code: string;
  description: string;
  status: "PUBLISHED" | "DRAFT";
  createdAt?: string;
  chapterBlocksCount?: number;
}

export async function fetchAdminPrograms(): Promise<ProgramItem[]> {
  try {
    const res = await contentBuilderApi.get<any>("/v1/learning-programs?size=100");
    const list = Array.isArray(res) ? res : res?.content || [];
    if (Array.isArray(list)) {
      return list.map((p: any) => ({
        id: p.id,
        title: p.title || p.code || "Chương trình chưa đặt tên",
        code: p.code || "N/A",
        description: p.description || "Chưa có mô tả",
        status: p.status || "PUBLISHED",
        createdAt: p.createdAt,
        chapterBlocksCount: Array.isArray(p.chapterBlocks) ? p.chapterBlocks.length : 0,
      }));
    }
  } catch {
    // API fail fallback
  }
  return [];
}

export async function createProgramApi(payload: { title: string; code: string; description?: string; status?: "DRAFT" | "PUBLISHED" }) {
  const endpoint = payload.status === "DRAFT" ? "/v1/learning-programs/draft" : "/v1/learning-programs/published";
  return await contentBuilderApi.post<any>(endpoint, payload);
}

export async function deleteProgramApi(id: string) {
  return await contentBuilderApi.delete<void>(`/v1/learning-programs/${id}`);
}
