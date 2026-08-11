import { examinationApi } from "@/lib/api";

export interface ExamItem {
  id: string;
  code: string;
  title: string;
  licenseType: string;
  questionsCount: number;
  durationMinutes: number;
  passScore: number;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchAdminExams(): Promise<ExamItem[]> {
  try {
    const res = await examinationApi.get<any>("/v1/exams?size=100");
    const list = Array.isArray(res) ? res : res?.content || [];
    if (Array.isArray(list) && list.length > 0) {
      return list.map((e: any) => ({
        id: e.id,
        code: e.metadata?.code || `EX-${e.id.substring(0, 4).toUpperCase()}`,
        title: e.title || e.name || "Bộ đề thi sát hạch lý thuyết",
        licenseType: e.metadata?.category || e.metadata?.licenseType || "B2",
        questionsCount: e.metadata?.questionsCount || 35,
        durationMinutes: e.durationMinutes || 22,
        passScore: e.passScore || 32,
        status: e.status || "DRAFT",
        createdAt: e.createdAt,
        updatedAt: e.updatedAt || e.createdAt,
      }));
    }
  } catch {
    // API Fallback
  }

  return [];
}

export async function createExamApi(payload: {
  name?: string;
  title?: string;
  code?: string;
  durationMinutes?: number;
  passScore?: number;
  status?: "DRAFT" | "PUBLISHED";
  licenseType?: string;
}) {
  const body = {
    title: payload.title || payload.name || "Bộ đề thi mới",
    metadata: {
      category: payload.licenseType || "B2",
      code: payload.code || "EX-B2-NEW",
      questionsCount: 35,
    },
  };
  return await examinationApi.post<any>("/v1/exams", body);
}

export async function changeExamStatusApi(id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  return await examinationApi.patch<any>(`/v1/exams/${id}/status`, { status });
}

export async function deleteExamApi(id: string) {
  return await examinationApi.delete<void>(`/v1/exams/${id}`);
}
