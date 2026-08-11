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
