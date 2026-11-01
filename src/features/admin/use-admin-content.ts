"use client";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminMutation } from "./foundation/use-admin-mutation";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createQuestionApi,
  updateQuestionApi,
  deleteQuestionApi,
  fetchAdminQuestions,
  fetchAdminQuestionDetail,
  CreateQuestionPayload,
  UpdateQuestionPayload,
} from "./admin-content-service";
import {
  fetchAdminPrograms,
  createProgramApi,
  deleteProgramApi,
  updateProgramApi,
  fetchAdminProgramDetail,
  addChapterBlockApi,
  deleteChapterBlockApi,
  reorderChapterBlocksApi,
} from "./admin-programs-service";
import {
  fetchAdminChapters,
  createChapterApi,
  deleteChapterApi,
  updateChapterApi,
  fetchAdminChapterDetail,
  addQuestionBlockApi,
  deleteQuestionBlockApi,
  reorderQuestionBlocksApi,
} from "./admin-chapters-service";
import {
  fetchAdminExams,
  createExamApi,
  updateExamApi,
  changeExamStatusApi,
  deleteExamApi,
  fetchAdminExamVersions,
  createExamVersionApi,
  publishExamVersionApi,
  deleteExamVersionApi,
  archiveExamVersionApi,
  updateExamVersionApi,
  fetchAdminExamStructures,
  createExamStructureApi,
  updateExamStructureApi,
  deleteExamStructureApi,
  fetchAdminExamRules,
  createExamRuleApi,
  updateExamRuleApi,
  deleteExamRuleApi,
  ExamRulePayload,
  fetchAdminExamCriterias,
  createExamCriteriaApi,
  updateExamCriteriaApi,
  deleteExamCriteriaApi,
  ExamCriteriaPayload,
  type OfficialExamVersionPayload,
  type ExamStructureSection,
} from "./admin-examination-service";

/* ==================== QUESTIONS ==================== */
export function useAdminQuestions() {
  const actorId = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ["admin", "questions", actorId],
    queryFn: fetchAdminQuestions,
    staleTime: 30_000,
    enabled: typeof window !== "undefined",
  });
}

export function useAdminQuestionDetail(rawId: string | null) {
  return useQuery({
    queryKey: ["admin", "question", rawId],
    queryFn: () => fetchAdminQuestionDetail(rawId!),
    enabled: !!rawId,
    staleTime: 0, // Always fetch latest to get options
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useAdminMutation("questions", "create", {
    mutationFn: (payload: CreateQuestionPayload) => createQuestionApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useAdminMutation("questions", "update", {
    mutationFn: (payload: UpdateQuestionPayload) => updateQuestionApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useAdminMutation("questions", "delete", {
    mutationFn: (id: string) => deleteQuestionApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
    },
  });
}

/* ==================== PROGRAMS ==================== */
export function useAdminPrograms() {
  const actorId = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ["admin", "programs", actorId],
    queryFn: fetchAdminPrograms,
    staleTime: 30_000,
    enabled: typeof window !== "undefined",
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useAdminMutation("learning-programs", "create", {
    mutationFn: (payload: { title: string; code: string; description?: string; status?: "DRAFT" | "PUBLISHED" }) =>
      createProgramApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useAdminMutation("learning-programs", "delete", {
    mutationFn: (id: string) => deleteProgramApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useAdminMutation("learning-programs", "update", {
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateProgramApi>[1] }) =>
      updateProgramApi(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "program-detail", variables.id] });
    },
  });
}

export function useAdminProgramDetail(programId: string | null) {
  const actorId = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ["admin", "program-detail", programId, actorId],
    queryFn: () => programId ? fetchAdminProgramDetail(programId) : null,
    enabled: !!programId,
  });
}

export function useAddChapterBlock(programId: string) {
  const queryClient = useQueryClient();
  return useAdminMutation("learning-programs", "update", {
    mutationFn: (payload: { chapterId: string; title: string; status?: string }) => addChapterBlockApi(programId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "program-detail", programId] });
    },
  });
}

export function useDeleteChapterBlock(programId: string) {
  const queryClient = useQueryClient();
  return useAdminMutation("learning-programs", "update", {
    mutationFn: (blockId: string) => deleteChapterBlockApi(programId, blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "program-detail", programId] });
    },
  });
}

export function useReorderChapterBlocks(programId: string) {
  const queryClient = useQueryClient();
  return useAdminMutation("learning-programs", "update", {
    mutationFn: (payload: { items: { id: string; sortOrder: number }[]; expectedFingerprint: string }) => reorderChapterBlocksApi(programId, payload.items, payload.expectedFingerprint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "program-detail", programId] });
    },
  });
}

/* ==================== CHAPTERS ==================== */
export function useAdminChapters() {
  const actorId = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ["admin", "chapters", actorId],
    queryFn: fetchAdminChapters,
    staleTime: 30_000,
    enabled: typeof window !== "undefined",
  });
}

export function useCreateChapter() {
  const queryClient = useQueryClient();
  return useAdminMutation("chapters", "create", {
    mutationFn: (payload: { title: string; status?: "DRAFT" | "PUBLISHED"; description?: string }) =>
      createChapterApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chapters"] });
    },
  });
}

export function useUpdateChapter(id: string) {
  const queryClient = useQueryClient();
  return useAdminMutation("chapters", "update", {
    mutationFn: (payload: Parameters<typeof updateChapterApi>[1]) =>
      updateChapterApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chapters"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "chapter-detail", id] });
    },
  });
}

export function useDeleteChapter() {
  const queryClient = useQueryClient();
  return useAdminMutation("chapters", "delete", {
    mutationFn: (id: string) => deleteChapterApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chapters"] });
    },
  });
}

export function useAdminChapterDetail(chapterId: string | null) {
  const actorId = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ["admin", "chapter-detail", chapterId, actorId],
    queryFn: () => chapterId ? fetchAdminChapterDetail(chapterId) : null,
    enabled: !!chapterId,
  });
}

/* ==================== EXAMS ==================== */
export function useAdminExams() {
  const actorId = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ["admin", "exams", actorId],
    queryFn: fetchAdminExams,
    staleTime: 30_000,
    enabled: typeof window !== "undefined",
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useAdminMutation("exam", "create", {
    mutationFn: (payload: Parameters<typeof createExamApi>[0]) =>
      createExamApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams"] });
    },
  });
}

export function useUpdateExam() {
  const queryClient = useQueryClient();
  return useAdminMutation("exam", "update", {
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateExamApi>[1] }) =>
      updateExamApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams"] });
    },
  });
}

export function useChangeExamStatus() {
  const queryClient = useQueryClient();
  return useAdminMutation("exam", "update", {
    mutationFn: ({ id, status }: { id: string; status: "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED" }) =>
      changeExamStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams"] });
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();
  return useAdminMutation("exam", "delete", {
    mutationFn: (id: string) => deleteExamApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams"] });
    },
  });
}

/* ==================== CHAPTER QUESTION BLOCKS ==================== */

export function useAddQuestionBlock(chapterId: string) {
  const queryClient = useQueryClient();
  return useAdminMutation("chapters", "update", {
    mutationFn: (payload: { questionId: string; title: string; status?: string }) => addQuestionBlockApi(chapterId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chapter-detail", chapterId] });
    },
  });
}

export function useDeleteQuestionBlock(chapterId: string) {
  const queryClient = useQueryClient();
  return useAdminMutation("chapters", "update", {
    mutationFn: (blockId: string) => deleteQuestionBlockApi(chapterId, blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chapter-detail", chapterId] });
    },
  });
}

export function useReorderQuestionBlocks(chapterId: string) {
  const queryClient = useQueryClient();
  return useAdminMutation("chapters", "update", {
    mutationFn: (payload: { items: { id: string; sortOrder: number }[]; expectedFingerprint: string }) => reorderQuestionBlocksApi(chapterId, payload.items, payload.expectedFingerprint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chapter-detail", chapterId] });
    },
  });
}

/* ==================== EXAM VERSIONS ==================== */
export function useAdminExamVersions(examId: string) {
  const actorId = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ["admin", "exams", examId, "versions", actorId],
    queryFn: () => fetchAdminExamVersions(examId),
    enabled: !!examId,
  });
}

export function useCreateExamVersion(examId: string) {
  const queryClient = useQueryClient();
  return useAdminMutation("exam_version", "create", {
    mutationFn: (payload: OfficialExamVersionPayload) =>
      createExamVersionApi(examId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams", examId, "versions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-config-usage"] });
    },
  });
}

export function useUpdateExamVersion(examId: string) {
  const queryClient = useQueryClient();
  return useAdminMutation("exam_version", "update", {
    mutationFn: ({ versionId, payload }: { versionId: string; payload: Parameters<typeof updateExamVersionApi>[1] }) =>
      updateExamVersionApi(versionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams", examId, "versions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-config-usage"] });
    },
  });
}

export function usePublishExamVersion(examId: string) {
  const queryClient = useQueryClient();
  return useAdminMutation("exam_version", "publish", {
    mutationFn: (input: { versionId: string; expectedFingerprint: string }) => publishExamVersionApi(input.versionId, input.expectedFingerprint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams", examId, "versions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-config-usage"] });
    },
  });
}

export function useDeleteExamVersion(examId: string) {
  const queryClient = useQueryClient();
  return useAdminMutation("exam_version", "delete", {
    mutationFn: (input: { versionId: string; expectedFingerprint: string }) => deleteExamVersionApi(input.versionId, input.expectedFingerprint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams", examId, "versions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-config-usage"] });
    },
  });
}

export function useArchiveExamVersion(examId: string) {
  const queryClient = useQueryClient();
  return useAdminMutation("exam_version", "archive", {
    mutationFn: (versionId: string) => archiveExamVersionApi(versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams", examId, "versions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-config-usage"] });
    },
  });
}

/* ==================== EXAM STRUCTURES & RULES ==================== */
export function useAdminExamStructures() {
  const actorId = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ["admin", "exam-structures", actorId],
    queryFn: fetchAdminExamStructures,
    staleTime: 30_000,
    enabled: typeof window !== "undefined",
  });
}

export function useAdminExamRules() {
  const actorId = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ["admin", "exam-rules", actorId],
    queryFn: fetchAdminExamRules,
    staleTime: 30_000,
    enabled: typeof window !== "undefined",
  });
}

export function useCreateExamRule() {
  const queryClient = useQueryClient();
  return useAdminMutation("exam_rule", "create", {
    mutationFn: (payload: ExamRulePayload) =>
      createExamRuleApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-rules"] });
    },
  });
}

export function useUpdateExamRule() {
  const queryClient = useQueryClient();
  return useAdminMutation("exam_rule", "update", {
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateExamRuleApi>[1] }) =>
      updateExamRuleApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-rules"] });
    },
  });
}

export function useDeleteExamRule() {
  const queryClient = useQueryClient();
  return useAdminMutation("exam_rule", "delete", {
    mutationFn: deleteExamRuleApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-rules"] });
    },
  });
}

/* ==================== EXAM CRITERIA ==================== */
export function useAdminExamCriterias() {
  const actorId = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ["admin", "exam-criterias", actorId],
    queryFn: fetchAdminExamCriterias,
  });
}

export function useCreateExamCriteria() {
  const queryClient = useQueryClient();
  return useAdminMutation("exam_criteria", "create", {
    mutationFn: createExamCriteriaApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-criterias"] });
    },
  });
}

export function useUpdateExamCriteria() {
  const queryClient = useQueryClient();
  return useAdminMutation("exam_criteria", "update", {
    mutationFn: ({ id, payload }: { id: string; payload: ExamCriteriaPayload }) =>
      updateExamCriteriaApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-criterias"] });
    },
  });
}

export function useDeleteExamCriteria() {
  const queryClient = useQueryClient();
  return useAdminMutation("exam_criteria", "delete", {
    mutationFn: deleteExamCriteriaApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-criterias"] });
    },
  });
}

export function useCreateExamStructure() {
  const queryClient = useQueryClient();
  return useAdminMutation("exam_structure", "create", {
    mutationFn: (payload: { title: string; sections: ExamStructureSection[]; metadata?: Record<string, unknown> }) =>
      createExamStructureApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-structures"] });
    },
  });
}

export function useUpdateExamStructure() {
  const queryClient = useQueryClient();
  return useAdminMutation("exam_structure", "update", {
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateExamStructureApi>[1] }) =>
      updateExamStructureApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-structures"] });
    },
  });
}

export function useDeleteExamStructure() {
  const queryClient = useQueryClient();
  return useAdminMutation("exam_structure", "delete", {
    mutationFn: (id: string) => deleteExamStructureApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-structures"] });
    },
  });
}
