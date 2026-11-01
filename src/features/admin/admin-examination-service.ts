import { examinationActor } from "./examination/examination-guard";
import { readExaminationCollection } from "./examination/examination-pagination";
import { requireMutableConfiguration } from "./examination/examination-config-usage";
import { validateExamRule, validateExamCriteria, validateExamStructure } from "./examination/examination-validation";
import { contentFingerprint, isUuid } from "./theory/theory-contract";
import { examinationApi, ApiError } from "@/lib/api";

function configurationBody(value: object): Record<string, unknown> {
  const body = { ...value } as Record<string, unknown>;
  for (const key of ["id", "status", "createdAt", "updatedAt", "createdBy", "updatedBy", "expectedFingerprint"]) delete body[key];
  return body;
}


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
  currentVersionNo?: number; publishedVersionNo?: number;
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
  const actor = examinationActor("exam");
  const parents = await readExaminationCollection<AdminExamResponse>("/v1/exams", actor.assert);
  if (parents.some(p => !isUuid(p.id) || !p.title || !["DRAFT", "PUBLISHED", "HIDDEN", "ARCHIVED"].includes(p.status))) throw new Error("Thông tin kỳ thi chưa đầy đủ. Vui lòng tải lại.");
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
        questionsCount: current?.totalQuestions ?? configuredCount ?? (versions.length === 0 && typeof metadata.questionsCount === "number" ? metadata.questionsCount : 0),
        durationMinutes: current?.durationSeconds != null ? current.durationSeconds / 60 : rule ? rule.durationSeconds / 60 : versions.length === 0 && typeof metadata.durationMinutes === "number" ? metadata.durationMinutes : 0,
        passScore: current?.passingCorrectAnswers ?? grading?.criteria.passScore ?? (versions.length === 0 && typeof metadata.passScore === "number" ? metadata.passScore : 0),
        status: exam.status,
        versionCount: versions.length,
        publishedVersionCount: versions.filter((v) => v.status === "PUBLISHED").length,
        currentVersionNo: current?.versionNo, publishedVersionNo: preferred.find(v => v.status === "PUBLISHED")?.versionNo,
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
  actor.assert(); return joined;
}

export async function createExamApi(payload: {
  name?: string;
  title?: string;
  code?: string;
  status?: "DRAFT" | "PUBLISHED";
  licenseType?: string;
  thumbnailId?: string;
}) {
  const actor = examinationActor("exam", "create");
  const body = {
    title: payload.title || payload.name || "",
    thumbnailId: payload.thumbnailId || null,
    metadata: { licenseClass: payload.licenseType || null, code: payload.code || null },
  };
  const result = await examinationApi.post<AdminExamResponse>("/v1/exams", body); actor.assert();
  if (!isUuid(result.id) || result.status !== "DRAFT") throw new Error("Chưa xác nhận tạo kỳ thi nháp.");
  return result;
}

export async function updateExamApi(id: string, payload: {
  title: string;
  code?: string;
  status: ExamItem["status"];
  licenseType?: string;
  thumbnailId?: string;
}) {
  const actor = examinationActor("exam", "update");
  if (!isUuid(id)) throw new Error("Mã kỳ thi không hợp lệ.");
  const current = await examinationApi.get<AdminExamResponse>(`/v1/exams/${id}`); actor.assert();
  if (current.id !== id) throw new Error("Chưa xác minh được kỳ thi cần sửa.");
  const body = {
    title: payload.title,
    thumbnailId: payload.thumbnailId || null,
    metadata: { ...current.metadata, licenseClass: payload.licenseType || current.metadata?.licenseClass || null, code: payload.code ?? current.metadata?.code },
  };
  const result = await examinationApi.patch<AdminExamResponse>(`/v1/exams/${id}`, body); actor.assert();
  if (result.id !== id) throw new Error("Chưa xác nhận lưu thông tin kỳ thi.");
  return result;
}

export async function changeExamStatusApi(id: string, status: "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED") {
  const actor = examinationActor("exam", "update");
  if (!isUuid(id)) throw new Error("Mã kỳ thi không hợp lệ.");
  const result = await examinationApi.patch<AdminExamResponse>(`/v1/exams/${id}/status`, { status }); actor.assert();
  if (result.id !== id || result.status !== status) throw new Error("Chưa xác nhận đổi trạng thái kỳ thi.");
  return result;
}

export async function deleteExamApi(id: string) {
  const actor = examinationActor("exam", "delete");
  if (!isUuid(id)) throw new Error("Mã kỳ thi không hợp lệ.");
  await examinationApi.delete<void>(`/v1/exams/${id}`); actor.assert();
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
  metadata?: { instructions?: string;[key: string]: unknown };
  manualQuestionIds?: string[]; matrixPolicyId?: string; totalQuestions?: number; durationSeconds?: number; passingCorrectAnswers?: number; criticalQuestionCount?: number; updatedAt?: string;
}

export async function fetchAdminExamVersions(examId: string): Promise<ExamVersionItem[]> {
  if (!examId) return [];
  if (!isUuid(examId)) throw new Error("Mã kỳ thi không hợp lệ.");
  const actor = examinationActor("exam_version");
  const rows = await readExaminationCollection<ExamVersionItem>(`/v1/exams/${examId}/versions`, actor.assert);
  if (rows.some(v => !isUuid(v.id) || v.examId !== examId || !Number.isInteger(v.versionNo) || !["DRAFT", "PUBLISHED", "ARCHIVED"].includes(v.status)) || new Set(rows.map(v => v.id)).size !== rows.length) throw new Error("Thông tin phiên bản đề thi chưa đầy đủ. Vui lòng tải lại.");
  return rows;
}

export async function fetchAdminExamVersion(id: string): Promise<ExamVersionItem> {
  if (!isUuid(id)) throw new Error("Mã phiên bản không hợp lệ.");
  const actor = examinationActor("exam_version");
  const v = await examinationApi.get<ExamVersionItem>(`/v1/exam-versions/${id}`); actor.assert();
  if (v.id !== id || !["DRAFT", "PUBLISHED", "ARCHIVED"].includes(v.status)) throw new Error("Chưa thể xác minh phiên bản đề thi.");
  return v;
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
  if (!payload.title?.trim() || payload.title.length > 255 || payload.examType !== "OFFICIAL" || payload.contentType !== "BANK_VERSION" || ![payload.contentId, payload.examStructureId, payload.examRuleId, payload.examCriteriaId].every(isUuid) || !payload.licenseClass?.trim() || !payload.bankVersion?.trim()) throw new Error("Thông tin bản nháp chưa đầy đủ. Vui lòng kiểm tra lại hạng GPLX, ngân hàng và cấu hình.");
  if (!["AUTO_MATRIX", "MANUAL"].includes(payload.selectionMode) || !Array.isArray(payload.manualQuestionIds) || payload.manualQuestionIds.some(id => !isUuid(id)) || new Set(payload.manualQuestionIds).size !== payload.manualQuestionIds.length || (payload.selectionMode === "AUTO_MATRIX" && payload.manualQuestionIds.length > 0) || (payload.selectionMode === "MANUAL" && payload.manualQuestionIds.length === 0)) throw new Error("Danh sách câu hỏi chưa hợp lệ với cách lập đề đã chọn.");
  if (!Number.isFinite(Date.parse(payload.startedAt)) || !Number.isFinite(Date.parse(payload.endedAt)) || Date.parse(payload.startedAt) >= Date.parse(payload.endedAt)) throw new Error("Thời gian kết thúc cần sau thời gian bắt đầu.");
  const actor = examinationActor("exam_version", "create");
  if (!isUuid(examId)) throw new Error("Mã kỳ thi không hợp lệ.");
  const result = await examinationApi.post<ExamVersionItem>(`/v1/exams/${examId}/versions`, payload); actor.assert();
  if (!isUuid(result.id) || result.examId !== examId || result.status !== "DRAFT") throw new Error("Chưa xác nhận lưu bản nháp đề thi.");
  return result;
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
  expectedFingerprint?: string;
}) {
  const actor = examinationActor("exam_version", "update");
  const current = await fetchAdminExamVersion(versionId); actor.assert();
  if (current.status !== "DRAFT" || !payload.expectedFingerprint || contentFingerprint(current) !== payload.expectedFingerprint) throw new ApiError("Phiên bản đã thay đổi hoặc chỉ được xem. Nội dung đang nhập được giữ lại.", 409);
  const { expectedFingerprint: _comparison, ...body } = payload;
  void _comparison;
  const result = await examinationApi.patch<ExamVersionItem>(`/v1/exam-versions/${versionId}`, { ...body, metadata: { ...current.metadata, ...body.metadata } }); actor.assert();
  if (result.id !== versionId || result.status !== "DRAFT") throw new Error("Chưa xác nhận lưu bản nháp.");
  return result;
}

export async function publishExamVersionApi(versionId: string, expectedFingerprint?: string) {
  const actor = examinationActor("exam_version", "publish");
  const current = await fetchAdminExamVersion(versionId); actor.assert();
  if (!expectedFingerprint || contentFingerprint(current) !== expectedFingerprint) throw new ApiError("Bản nháp đã thay đổi. Vui lòng tải lại và kiểm tra trước khi tiếp tục.", 409);
  if (!["DRAFT"].includes(current.status)) throw new ApiError("Trạng thái phiên bản chưa cho phép thao tác này.", 409);
  const result = await examinationApi.post<ExamVersionItem>(`/v1/exam-versions/${versionId}/publish`); actor.assert();
  if (!isUuid(result.id) || result.examId !== current.examId || result.status !== "PUBLISHED" || result.id !== current.id) throw new Error("Chưa xác nhận hoàn tất thao tác với phiên bản đề thi.");
  return result;
}

export async function cloneExamVersionApi(versionId: string) {
  const actor = examinationActor("exam_version", "clone");
  const current = await fetchAdminExamVersion(versionId); actor.assert();
  if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(current.status)) throw new ApiError("Trạng thái phiên bản chưa cho phép thao tác này.", 409);
  const result = await examinationApi.post<ExamVersionItem>(`/v1/exam-versions/${versionId}/clone`); actor.assert();
  if (!isUuid(result.id) || result.examId !== current.examId || result.status !== "DRAFT" || result.id === current.id) throw new Error("Chưa xác nhận hoàn tất thao tác với phiên bản đề thi.");
  return result;
}

export async function deleteExamVersionApi(versionId: string, expectedFingerprint?: string) {
  const actor = examinationActor("exam_version", "delete"); const current = await fetchAdminExamVersion(versionId); actor.assert();
  if (!expectedFingerprint || contentFingerprint(current) !== expectedFingerprint) throw new ApiError("Bản nháp đã thay đổi. Vui lòng tải lại và kiểm tra trước khi tiếp tục.", 409);
  if (current.status !== "DRAFT") throw new ApiError("Chỉ được xóa bản nháp.", 409);
  await examinationApi.delete<void>(`/v1/exam-versions/${versionId}`); actor.assert();
}

export async function archiveExamVersionApi(versionId: string) {
  const actor = examinationActor("exam_version", "archive");
  const current = await fetchAdminExamVersion(versionId); actor.assert();
  if (!["PUBLISHED"].includes(current.status)) throw new ApiError("Trạng thái phiên bản chưa cho phép thao tác này.", 409);
  const result = await examinationApi.post<ExamVersionItem>(`/v1/exam-versions/${versionId}/archive`); actor.assert();
  if (!isUuid(result.id) || result.examId !== current.examId || result.status !== "ARCHIVED" || result.id !== current.id) throw new Error("Chưa xác nhận hoàn tất thao tác với phiên bản đề thi.");
  return result;
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
  status?: string; updatedAt?: string;
  id: string;
  title: string;
  sections: ExamStructureSection[];
  totalQuestions?: number;
  maxScore?: number;
  metadata?: Record<string, unknown>;
}

export async function fetchAdminExamStructures(): Promise<ExamStructureItem[]> {
  const actor = examinationActor("exam_structure");
  const rows = await readExaminationCollection<ExamStructureItem>("/v1/exam-structures", actor.assert);
  if (rows.some(row => !isUuid(row.id) || !row.title)) throw new Error("Thông tin cấu hình chưa đầy đủ. Vui lòng tải lại.");
  if (rows.some(row => !Array.isArray(row.sections))) throw new Error("Thông tin các phần thi chưa đầy đủ.");
  return rows;
}

export async function createExamStructureApi(payload: { title: string; sections: ExamStructureSection[]; metadata?: Record<string, unknown> }) {
  const invalid = validateExamStructure(payload.title, payload.sections); if (invalid) throw new Error(invalid);
  const actor = examinationActor("exam_structure", "create");
  const result = await examinationApi.post<ExamStructureItem>("/v1/exam-structures", configurationBody(payload)); actor.assert();
  if (!isUuid(result.id) || result.status !== "DRAFT") throw new Error("Chưa xác nhận tạo cấu hình mới.");
  return result;
}

/* ==================== EXAM RULES ==================== */

export async function fetchAdminExamRules(): Promise<Array<ExamRulePayload & { id: string }>> {
  const actor = examinationActor("exam_rule");
  const rows = await readExaminationCollection<ExamRulePayload & { id: string }>("/v1/exam-rules", actor.assert);
  if (rows.some(row => !isUuid(row.id) || !row.title)) throw new Error("Thông tin cấu hình chưa đầy đủ. Vui lòng tải lại.");
  return rows;
}

export interface ExamRulePayload {
  status?: string; updatedAt?: string; expectedFingerprint?: string;
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
  const invalid = validateExamRule(payload); if (invalid) throw new Error(invalid);
  const actor = examinationActor("exam_rule", "create");
  const result = await examinationApi.post<ExamRulePayload & { id: string }>("/v1/exam-rules", configurationBody(payload));
  actor.assert(); if (!isUuid(result.id) || result.status !== "ACTIVE") throw new Error("Chưa xác nhận tạo cấu hình mới."); return result;
}

export async function updateExamRuleApi(ruleId: string, payload: ExamRulePayload) {
  const invalid = validateExamRule(payload); if (invalid) throw new Error(invalid);
  const { current, actor } = await requireMutableConfiguration("rule", ruleId, "update", payload.expectedFingerprint);
  const { expectedFingerprint: _comparison, ...body } = payload; void _comparison;
  const result = await examinationApi.patch<ExamRulePayload & { id: string }>(`/v1/exam-rules/${ruleId}`, configurationBody({ ...body, metadata: { ...(current.metadata as Record<string, unknown>), ...body.metadata } }));
  actor.assert(); if (result.id !== ruleId || result.status !== "ACTIVE") throw new Error("Chưa xác nhận lưu cấu hình."); return result;
}

export async function deleteExamRuleApi(ruleId: string) {
  const { actor } = await requireMutableConfiguration("rule", ruleId, "delete");
  await examinationApi.delete<void>(`/v1/exam-rules/${ruleId}`);
  actor.assert();
}

export async function updateExamStructureApi(structureId: string, payload: { title: string; sections: ExamStructureSection[]; metadata?: Record<string, unknown>; expectedFingerprint?: string }) {
  const invalid = validateExamStructure(payload.title, payload.sections); if (invalid) throw new Error(invalid);
  const { current, actor } = await requireMutableConfiguration("structure", structureId, "update", payload.expectedFingerprint);
  const result = await examinationApi.patch<ExamStructureItem>(`/v1/exam-structures/${structureId}`, configurationBody({ ...payload, metadata: { ...(current.metadata as Record<string, unknown>), ...payload.metadata } })); actor.assert();
  if (result.id !== structureId || result.status !== current.status) throw new Error("Chưa xác nhận lưu cấu hình.");
  return result;
}

export async function deleteExamStructureApi(structureId: string) {
  const { actor } = await requireMutableConfiguration("structure", structureId, "delete");
  await examinationApi.delete<void>(`/v1/exam-structures/${structureId}`);
  actor.assert();
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
  expectedFingerprint?: string;
  id?: string;
  title: string;
  criteria: ExamCriteriaLogic;
  metadata?: Record<string, unknown>;
  status?: string;
}

export async function fetchAdminExamCriterias(): Promise<ExamCriteriaPayload[]> {
  const actor = examinationActor("exam_criteria");
  const rows = await readExaminationCollection<ExamCriteriaPayload>("/v1/exam-criterias", actor.assert);
  if (rows.some(row => !isUuid(row.id) || !row.title)) throw new Error("Thông tin cấu hình chưa đầy đủ. Vui lòng tải lại.");
  if (rows.some(row => !row.criteria || typeof row.criteria !== "object")) throw new Error("Thông tin tiêu chí chấm chưa đầy đủ.");
  return rows;
}

export async function createExamCriteriaApi(payload: ExamCriteriaPayload) {
  const invalid = validateExamCriteria(payload); if (invalid) throw new Error(invalid);
  const actor = examinationActor("exam_criteria", "create");
  const result = await examinationApi.post<ExamCriteriaPayload>("/v1/exam-criterias", configurationBody(payload));
  actor.assert(); if (!isUuid(result.id) || result.status !== "ACTIVE") throw new Error("Chưa xác nhận tạo cấu hình mới."); return result;
}

export async function updateExamCriteriaApi(criteriaId: string, payload: ExamCriteriaPayload) {
  const invalid = validateExamCriteria(payload); if (invalid) throw new Error(invalid);
  const { current, actor } = await requireMutableConfiguration("criteria", criteriaId, "update", payload.expectedFingerprint);
  const { expectedFingerprint: _comparison, ...body } = payload; void _comparison;
  const result = await examinationApi.patch<ExamCriteriaPayload>(`/v1/exam-criterias/${criteriaId}`, configurationBody({ ...body, metadata: { ...(current.metadata as Record<string, unknown>), ...body.metadata } }));
  actor.assert(); if (result.id !== criteriaId || result.status !== "ACTIVE") throw new Error("Chưa xác nhận lưu cấu hình."); return result;
}

export async function deleteExamCriteriaApi(criteriaId: string) {
  const { actor } = await requireMutableConfiguration("criteria", criteriaId, "delete");
  await examinationApi.delete<void>(`/v1/exam-criterias/${criteriaId}`);
  actor.assert();
}
