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
        durationMinutes: e.metadata?.durationMinutes || e.durationMinutes || 22,
        passScore: e.metadata?.passScore || e.passScore || 32,
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
      durationMinutes: payload.durationMinutes || 22,
      passScore: payload.passScore || 32,
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

/* ==================== EXAM VERSIONS ==================== */

export interface ExamVersionItem {
  id: string;
  examId: string;
  versionNo: number;
  title: string;
  examType: string;
  contentType: string;
  contentId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
}

export async function fetchAdminExamVersions(examId: string): Promise<ExamVersionItem[]> {
  if (!examId) return [];
  try {
    const res = await examinationApi.get<any>(`/v1/exams/${examId}/versions?size=100`);
    return Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function createExamVersionApi(examId: string, payload: {
  title: string;
  examType: string;
  contentType: string;
  contentId: string;
  examStructureId: string;
  examRuleId: string;
}) {
  return await examinationApi.post<any>(`/v1/exams/${examId}/versions`, payload);
}

export async function publishExamVersionApi(versionId: string) {
  return await examinationApi.post<any>(`/v1/exam-versions/${versionId}/publish`);
}

export async function deleteExamVersionApi(versionId: string) {
  return await examinationApi.delete<void>(`/v1/exam-versions/${versionId}`);
}

export async function archiveExamVersionApi(versionId: string) {
  return await examinationApi.post<any>(`/v1/exam-versions/${versionId}/archive`);
}

/* ==================== EXAM STRUCTURES (Ma trận đề thi) ==================== */

export interface ExamStructureSection {
  code: string;
  title: string;
  questionCount: number;
  score: number;
  order: number;
}

export async function fetchAdminExamStructures() {
  try {
    const res = await examinationApi.get<any>("/v1/exam-structures?size=100");
    return Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function createExamStructureApi(payload: {
  title: string;
  sections: ExamStructureSection[];
  metadata?: Record<string, unknown>;
}) {
  return await examinationApi.post<any>("/v1/exam-structures", payload);
}

/* ==================== EXAM RULES ==================== */

export async function fetchAdminExamRules() {
  try {
    const res = await examinationApi.get<any>("/v1/exam-rules?size=100");
    // Depending on PageResponse format, might be res.content or res.data
    return Array.isArray(res?.content) ? res.content : Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function createExamRuleApi(payload: {
  title: string;
  code: string;
  description?: string;
  status?: string;
}) {
  return await examinationApi.post<any>("/v1/exam-rules", payload);
}

export async function updateExamRuleApi(ruleId: string, payload: {
  title: string;
  code: string;
  description?: string;
  status?: string;
}) {
  return await examinationApi.patch<any>(`/v1/exam-rules/${ruleId}`, payload);
}

export async function deleteExamRuleApi(ruleId: string) {
  return await examinationApi.delete<void>(`/v1/exam-rules/${ruleId}`);
}

export async function updateExamStructureApi(structureId: string, payload: {
  title: string;
  sections: ExamStructureSection[];
  metadata?: Record<string, unknown>;
}) {
  return await examinationApi.patch<any>(`/v1/exam-structures/${structureId}`, payload);
}

export async function deleteExamStructureApi(structureId: string) {
  return await examinationApi.delete<void>(`/v1/exam-structures/${structureId}`);
}
