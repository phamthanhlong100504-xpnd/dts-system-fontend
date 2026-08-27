import { examinationApi } from "@/lib/api";
import { toast } from "sonner";

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
  status?: "DRAFT" | "PUBLISHED";
  licenseType?: string;
}) {
  const body = {
    title: payload.title || payload.name || "Bộ đề thi mới",
    metadata: {
      category: payload.licenseType || "B2",
      code: payload.code || "EX-B2-NEW",
    },
  };
  return await examinationApi.post<any>("/v1/exams", body);
}

export async function updateExamApi(id: string, payload: {
  title?: string;
  code?: string;
  licenseType?: string;
}) {
  const body = {
    title: payload.title,
    metadata: {
      category: payload.licenseType,
      code: payload.code,
    },
  };
  return await examinationApi.patch<any>(`/v1/exams/${id}`, body);
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
  examStructureId?: string;
  examRuleId?: string;
  examCriteriaId?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
}

export async function fetchAdminExamVersions(examId: string): Promise<ExamVersionItem[]> {
  if (!examId) return [];
  try {
    const res = await examinationApi.get<any>(`/v1/exams/${examId}/versions?size=100`);
    return Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : [];
  } catch (error) {
    console.error("FETCH EXAMS ERROR:", error);
    throw error;
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

export async function updateExamVersionApi(versionId: string, payload: {
  title?: string;
  examType?: string;
  contentType?: string;
  contentId?: string;
  examStructureId?: string;
  examRuleId?: string;
}) {
  return await examinationApi.patch<any>(`/v1/exam-versions/${versionId}`, payload);
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
  } catch (error) {
    console.error("FETCH EXAMS ERROR:", error);
    throw error;
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
    let res = await examinationApi.get<any>("/v1/exam-rules?size=100");
    console.log("FETCH RULES RAW RESPONSE:", res);
    
    // If backend returns a string, try parsing it
    if (typeof res === "string") {
      try {
        res = JSON.parse(res);
      } catch (e) {
        console.warn("Could not parse string response:", e);
      }
    }
    
    if (Array.isArray(res)) return res;
    if (res?.content && Array.isArray(res.content)) return res.content;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.data?.content && Array.isArray(res.data.content)) return res.data.content;
    if (res?.items && Array.isArray(res.items)) return res.items;

    // Aggressive fallback: find any array property in the object
    if (res && typeof res === "object") {
      for (const key of Object.keys(res)) {
        if (Array.isArray(res[key])) {
          console.warn("Found array in unexpected property:", key);
          return res[key];
        }
      }
    }

    console.warn("FETCH RULES: Could not find array in response", res);
    return [];
  } catch (error) {
    console.error("FETCH RULES ERROR:", error);
    if (typeof window !== "undefined") {
      toast.error("Lỗi khi tải Quy chế thi");
    }
    throw error;
  }
}

export interface ExamRulePayload {
  title: string;
  allowRetry: boolean;
  maxRetry: number;
  retryIntervalSeconds: number;
  durationSeconds: number;
  gracePeriodSeconds: number;
  autoSubmit: boolean;
  navigationMode: "FREE" | "SEQUENTIAL";
  allowSkip: boolean;
  reviewMode: "NONE" | "CURRENT_SECTION" | "ALL";
  allowPause: boolean;
  maxPauseCount: number;
  maxPauseDurationSeconds: number;
  allowResume: boolean;
  resumeTimeoutSeconds: number;
  shuffleSections: boolean;
  shuffleQuestionsWithinSection: boolean;
  shuffleQuestionsAcrossSections: boolean;
  shuffleOptions: boolean;
  resultReleaseMode: "IMMEDIATE" | "AFTER_SUBMIT" | "AFTER_EXAM_END" | "MANUAL";
  showAnswerAfterSubmit: boolean;
  showExplanationAfterSubmit: boolean;
  showQuestionScoreAfterSubmit: boolean;
  requireFullscreen: boolean;
  preventTabSwitch: boolean;
  maxTabSwitchCount: number;
  timeZone?: string;
  metadata?: Record<string, unknown>;
}

export async function createExamRuleApi(payload: ExamRulePayload) {
  return await examinationApi.post<any>("/v1/exam-rules", payload);
}

export async function updateExamRuleApi(ruleId: string, payload: ExamRulePayload) {
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

/* ==================== EXAM CRITERIA ==================== */

export interface MandatoryRule {
  type: "MUST_CORRECT" | "MUST_ATTEMPT" | "AT_LEAST_ONE" | "MAX_WRONG";
  questionIds: string[];
}

export interface SectionRule {
  sectionId: string;
  minScore: number;
}

export interface Penalty {
  type: "UNANSWERED" | "WRONG_ANSWER";
  deduct: number;
}

export interface RoundingRule {
  mode: string;
  precision: number;
}

export interface ExamCriteriaLogic {
  passScore: number;
  totalScore: number;
  gradingMethod: "SUM" | "WEIGHTED" | "PERCENTAGE" | "BEST_OF" | "AVERAGE";
  rounding?: RoundingRule;
  mandatoryRules?: MandatoryRule[];
  sectionRules?: SectionRule[];
  penalties?: Penalty[];
}

export interface ExamCriteriaPayload {
  id?: string;
  title: string;
  criteria: ExamCriteriaLogic;
  metadata?: Record<string, any>;
  status?: string;
}

export async function fetchAdminExamCriterias(): Promise<ExamCriteriaPayload[]> {
  try {
    const res = await examinationApi.get<any>("/v1/exam-criterias?size=100");
    if (Array.isArray(res)) return res;
    if (res?.content && Array.isArray(res.content)) return res.content;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.data?.content && Array.isArray(res.data.content)) return res.data.content;
    if (res?.items && Array.isArray(res.items)) return res.items;
    
    if (res && typeof res === "object") {
      for (const key of Object.keys(res)) {
        if (Array.isArray(res[key])) return res[key];
      }
    }
    return [];
  } catch (error) {
    console.error("Error fetching admin exam criterias", error);
    return [];
  }
}

export async function createExamCriteriaApi(payload: ExamCriteriaPayload) {
  return await examinationApi.post<any>("/v1/exam-criterias", payload);
}

export async function updateExamCriteriaApi(criteriaId: string, payload: ExamCriteriaPayload) {
  return await examinationApi.patch<any>(`/v1/exam-criterias/${criteriaId}`, payload);
}

export async function deleteExamCriteriaApi(criteriaId: string) {
  return await examinationApi.delete<void>(`/v1/exam-criterias/${criteriaId}`);
}
