import { examinationApi } from "@/lib/api";

type PageContent<T> = { content: T[]; number?: number; size?: number; totalElements?: number; totalPages?: number };

/** JSON direct từ Examination, không unwrap .data. */
export interface AdminExamResponse {
  id: string;
  title: string;
  thumbnailId?: string | null;
  status: ExamItem["status"];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamItem {
  id: string;
  code: string;
  title: string;
  licenseType: string;
  questionsCount: number;
  durationMinutes: number;
  passScore: number;
  status: "PUBLISHED" | "DRAFT" | "HIDDEN" | "ARCHIVED";
  versionCount: number;
  publishedVersionCount: number;
  versionStatus?: ExamVersionItem["status"];
  examVersionId?: string;
  examType?: string;
  bankVersion?: string;
  selectionMode?: "AUTO_MATRIX" | "MANUAL";
  createdAt?: string;
  updatedAt?: string;
  thumbnailId?: string;
}

/**
 * Examination's /exams endpoint is an Exam *shell*. The license, matrix,
 * rule and criteria of OFFICIAL are properties of its ExamVersion.
 * Join only genuine Examination responses; never invent exam specifications.
 * Limit concurrent version requests so existing admin screens remain usable.
 */
export async function fetchAdminExams(): Promise<ExamItem[]> {
  const first = await examinationApi.get<PageContent<AdminExamResponse>>("/v1/exams?page=0&size=100");
  if (!first || !Array.isArray(first.content)) throw new Error("Phản hồi danh sách kỳ thi không hợp lệ.");
  const parents: AdminExamResponse[] = [...first.content];
  const pages = first.totalPages ?? 1;
  for (let page = 1; page < pages; page++) {
    const more = await examinationApi.get<PageContent<AdminExamResponse>>(`/v1/exams?page=${page}&size=100`);
    if (!more || !Array.isArray(more.content)) throw new Error("Không đọc đủ trang kỳ thi từ Examination.");
    parents.push(...more.content);
  }

  const [structures, rules, criteria] = await Promise.all([
    fetchAdminExamStructures(), fetchAdminExamRules(), fetchAdminExamCriterias(),
  ]);
  const structureById = new Map(structures.map((item) => [item.id, item]));
  const ruleById = new Map(rules.map((item) => [item.id, item]));
  const criteriaById = new Map(criteria.filter((item) => item.id).map((item) => [item.id!, item]));
  const joined: ExamItem[] = [];
  for (let offset = 0; offset < parents.length; offset += 5) {
    const batch = parents.slice(offset, offset + 5);
    const mapped = await Promise.all(batch.map(async (exam): Promise<ExamItem> => {
      const versions = await fetchAdminExamVersions(exam.id);
      const preferred = [...versions].sort((a, b) => b.versionNo - a.versionNo);
      const current = preferred.find((v) => v.status === "PUBLISHED") ?? preferred[0];
      const structure = current?.examStructureId ? structureById.get(current.examStructureId) : undefined;
      const rule = current?.examRuleId ? ruleById.get(current.examRuleId) : undefined;
      const grading = current?.examCriteriaId ? criteriaById.get(current.examCriteriaId) : undefined;
      const metadata = exam.metadata ?? {};
      const configuredCount = structure?.totalQuestions ?? structure?.sections.reduce((sum, section) => sum + section.questionCount, 0);
      const legacyLicense = typeof metadata.licenseClass === "string" ? metadata.licenseClass : typeof metadata.category === "string" ? metadata.category : "";
      return {
        id: exam.id,
        title: exam.title,
        code: typeof metadata.code === "string" && metadata.code ? metadata.code : "—",
        licenseType: current?.licenseClass || legacyLicense || "—",
        questionsCount: configuredCount ?? (versions.length === 0 && typeof metadata.questionsCount === "number" ? metadata.questionsCount : 0),
        durationMinutes: rule ? rule.durationSeconds / 60 : versions.length === 0 && typeof metadata.durationMinutes === "number" ? metadata.durationMinutes : 0,
        passScore: grading?.criteria.passScore ?? (versions.length === 0 && typeof metadata.passScore === "number" ? metadata.passScore : 0),
        status: exam.status,
        versionCount: versions.length,
        publishedVersionCount: versions.filter((v) => v.status === "PUBLISHED").length,
        versionStatus: current?.status,
        examVersionId: current?.id,
        examType: current?.examType,
        bankVersion: current?.bankVersion,
        selectionMode: current?.selectionMode,
        thumbnailId: exam.thumbnailId ?? undefined,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
      };
    }));
    joined.push(...mapped);
  }
  return joined;
}

export async function createExamApi(payload: {
  name?: string;
  title?: string;
  code?: string;
  status?: "DRAFT" | "PUBLISHED";
  licenseType?: string;
  thumbnailId?: string;
}) {
  const body = {
    title: payload.title || payload.name || "",
    thumbnailId: payload.thumbnailId || null,
    metadata: { licenseClass: payload.licenseType || null, code: payload.code || null },
  };
  return await examinationApi.post<AdminExamResponse>("/v1/exams", body);
}

export async function updateExamApi(id: string, payload: {
  title: string;
  code?: string;
  status: ExamItem["status"];
  licenseType?: string;
  thumbnailId?: string;
}) {
  const body = {
    title: payload.title,
    thumbnailId: payload.thumbnailId || null,
    metadata: { licenseClass: payload.licenseType || null, code: payload.code },
  };
  return await examinationApi.patch<AdminExamResponse>(`/v1/exams/${id}`, body);
}

export async function changeExamStatusApi(id: string, status: "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED") {
  return await examinationApi.patch<AdminExamResponse>(`/v1/exams/${id}/status`, { status });
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
  startedAt?: string;
  endedAt?: string;
  licenseClass?: string;
  bankVersion?: string;
  selectionMode?: "AUTO_MATRIX" | "MANUAL";
  metadata?: {instructions?: string};
}

export async function fetchAdminExamVersions(examId: string): Promise<ExamVersionItem[]> {
  if (!examId) return [];
  const res = await examinationApi.get<PageContent<ExamVersionItem>>(`/v1/exams/${examId}/versions?size=100`);
  if (!res || !Array.isArray(res.content)) throw new Error("Phản hồi danh sách phiên bản đề không hợp lệ.");
  return res.content;
}

export interface OfficialExamVersionPayload {
  title: string;
  examType: "OFFICIAL";
  examStructureId: string;
  examRuleId: string;
  examCriteriaId: string;
  contentType: "BANK_VERSION";
  contentId: string;
  licenseClass: string;
  bankVersion: string;
  selectionMode: "AUTO_MATRIX" | "MANUAL";
  manualQuestionIds: string[];
  startedAt: string;
  endedAt: string;
  metadata?: { instructions?: string };
}

export async function createExamVersionApi(examId: string, payload: OfficialExamVersionPayload) {
  return examinationApi.post<ExamVersionItem>(`/v1/exams/${examId}/versions`, payload);
}

/** Backend permits updating draft version's mutable fields; identity of the bank and examType is immutable. */
export async function updateExamVersionApi(versionId: string, payload: {
  title?: string;
  examStructureId?: string;
  examRuleId?: string;
  examCriteriaId?: string;
  startedAt?: string;
  endedAt?: string;
  metadata?: { instructions?: string };
}) {
  return examinationApi.patch<ExamVersionItem>(`/v1/exam-versions/${versionId}`, payload);
}

export async function publishExamVersionApi(versionId: string) {
  return await examinationApi.post<ExamVersionItem>(`/v1/exam-versions/${versionId}/publish`);
}

export async function cloneExamVersionApi(versionId: string) { return examinationApi.post<ExamVersionItem>(`/v1/exam-versions/${versionId}/clone`); }

export async function deleteExamVersionApi(versionId: string) {
  return await examinationApi.delete<void>(`/v1/exam-versions/${versionId}`);
}

export async function archiveExamVersionApi(versionId: string) {
  return await examinationApi.post<ExamVersionItem>(`/v1/exam-versions/${versionId}/archive`);
}

/* ==================== EXAM STRUCTURES (Ma trận đề thi) ==================== */

export interface ExamStructureSection {
  code: string;
  title: string;
  questionCount: number;
  score: number;
  order: number;
  chapterIds?: string[];
  criticalQuestionCount?: number;
}

export interface ExamStructureItem {
  id: string;
  title: string;
  sections: ExamStructureSection[];
  totalQuestions?: number;
  maxScore?: number;
  metadata?: Record<string, unknown>;
}

export async function fetchAdminExamStructures(): Promise<ExamStructureItem[]> {
  const res = await examinationApi.get<PageContent<ExamStructureItem>>("/v1/exam-structures?size=100");
  if (!res || !Array.isArray(res.content)) throw new Error("Phản hồi danh sách cấu trúc đề thi không hợp lệ.");
  return res.content;
}

export async function createExamStructureApi(payload: {
  title: string;
  sections: ExamStructureSection[];
  metadata?: Record<string, unknown>;
}) {
  return await examinationApi.post<ExamStructureItem>("/v1/exam-structures", payload);
}

/* ==================== EXAM RULES ==================== */

export async function fetchAdminExamRules(): Promise<Array<ExamRulePayload & {id: string}>> {
  const res = await examinationApi.get<{items: Array<ExamRulePayload & {id: string}>}>("/v1/exam-rules?page=0&size=100");
  if (!res || !Array.isArray(res.items)) throw new Error("Phản hồi danh sách quy chế thi không hợp lệ.");
  return res.items;
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
  return await examinationApi.post<ExamRulePayload & { id: string }>("/v1/exam-rules", payload);
}

export async function updateExamRuleApi(ruleId: string, payload: ExamRulePayload) {
  return await examinationApi.patch<ExamRulePayload & { id: string }>(`/v1/exam-rules/${ruleId}`, payload);
}

export async function deleteExamRuleApi(ruleId: string) {
  return await examinationApi.delete<void>(`/v1/exam-rules/${ruleId}`);
}

export async function updateExamStructureApi(structureId: string, payload: {
  title: string;
  sections: ExamStructureSection[];
  metadata?: Record<string, unknown>;
}) {
  return await examinationApi.patch<ExamStructureItem>(`/v1/exam-structures/${structureId}`, payload);
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
  metadata?: Record<string, unknown>;
  status?: string;
}

export async function fetchAdminExamCriterias(): Promise<ExamCriteriaPayload[]> {
  const res = await examinationApi.get<{items: ExamCriteriaPayload[]}>("/v1/exam-criterias?page=0&size=100");
  if (!res || !Array.isArray(res.items)) throw new Error("Phản hồi danh sách tiêu chí chấm thi không hợp lệ.");
  return res.items;
}

export async function createExamCriteriaApi(payload: ExamCriteriaPayload) {
  return await examinationApi.post<ExamCriteriaPayload>("/v1/exam-criterias", payload);
}

export async function updateExamCriteriaApi(criteriaId: string, payload: ExamCriteriaPayload) {
  return await examinationApi.patch<ExamCriteriaPayload>(`/v1/exam-criterias/${criteriaId}`, payload);
}

export async function deleteExamCriteriaApi(criteriaId: string) {
  return await examinationApi.delete<void>(`/v1/exam-criterias/${criteriaId}`);
}
