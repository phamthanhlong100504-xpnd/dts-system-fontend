"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "./admin-examination-service";

/* ==================== QUESTIONS ==================== */
export function useAdminQuestions() {
  return useQuery({
    queryKey: ["admin", "questions"],
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
  return useMutation({
    mutationFn: (payload: CreateQuestionPayload) => createQuestionApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateQuestionPayload) => updateQuestionApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteQuestionApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "questions"] });
    },
  });
}

/* ==================== PROGRAMS ==================== */
export function useAdminPrograms() {
  return useQuery({
    queryKey: ["admin", "programs"],
    queryFn: fetchAdminPrograms,
    staleTime: 30_000,
    enabled: typeof window !== "undefined",
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; code: string; description?: string; status?: "DRAFT" | "PUBLISHED" }) =>
      createProgramApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProgramApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { title: string; code?: string; description?: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" } }) => 
      updateProgramApi(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "program-detail", variables.id] });
    },
  });
}

export function useAdminProgramDetail(programId: string | null) {
  return useQuery({
    queryKey: ["admin", "program-detail", programId],
    queryFn: () => programId ? fetchAdminProgramDetail(programId) : null,
    enabled: !!programId,
  });
}

export function useAddChapterBlock(programId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { chapterId: string; title: string; status?: string }) => addChapterBlockApi(programId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "program-detail", programId] });
    },
  });
}

export function useDeleteChapterBlock(programId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockId: string) => deleteChapterBlockApi(programId, blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "program-detail", programId] });
    },
  });
}

export function useReorderChapterBlocks(programId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; sortOrder: number }[]) => reorderChapterBlocksApi(programId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "program-detail", programId] });
    },
  });
}

/* ==================== CHAPTERS ==================== */
export function useAdminChapters() {
  return useQuery({
    queryKey: ["admin", "chapters"],
    queryFn: fetchAdminChapters,
    staleTime: 30_000,
    enabled: typeof window !== "undefined",
  });
}

export function useCreateChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; status?: "DRAFT" | "PUBLISHED"; description?: string }) =>
      createChapterApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chapters"] });
    },
  });
}

export function useUpdateChapter(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; status: string; description?: string }) =>
      updateChapterApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chapters"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "chapters", id] });
    },
  });
}

export function useDeleteChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteChapterApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chapters"] });
    },
  });
}

export function useAdminChapterDetail(chapterId: string | null) {
  return useQuery({
    queryKey: ["admin", "chapter-detail", chapterId],
    queryFn: () => chapterId ? fetchAdminChapterDetail(chapterId) : null,
    enabled: !!chapterId,
  });
}

/* ==================== EXAMS ==================== */
export function useAdminExams() {
  return useQuery({
    queryKey: ["admin", "exams"],
    queryFn: fetchAdminExams,
    staleTime: 30_000,
    enabled: typeof window !== "undefined",
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name?: string; title?: string; code?: string; durationMinutes?: number; passScore?: number; status?: "DRAFT" | "PUBLISHED"; licenseType?: string; questionsCount?: number; }) =>
      createExamApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams"] });
    },
  });
}

export function useUpdateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { title?: string; code?: string; durationMinutes?: number; passScore?: number; licenseType?: string; questionsCount?: number; } }) =>
      updateExamApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams"] });
    },
  });
}

export function useChangeExamStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) =>
      changeExamStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams"] });
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExamApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams"] });
    },
  });
}

/* ==================== CHAPTER QUESTION BLOCKS ==================== */

export function useAddQuestionBlock(chapterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { questionId: string; title: string; status?: string }) => addQuestionBlockApi(chapterId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chapter-detail", chapterId] });
    },
  });
}

export function useDeleteQuestionBlock(chapterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockId: string) => deleteQuestionBlockApi(chapterId, blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chapter-detail", chapterId] });
    },
  });
}

export function useReorderQuestionBlocks(chapterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; sortOrder: number }[]) => reorderQuestionBlocksApi(chapterId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chapter-detail", chapterId] });
    },
  });
}

/* ==================== EXAM VERSIONS ==================== */
export function useAdminExamVersions(examId: string) {
  return useQuery({
    queryKey: ["admin", "exams", examId, "versions"],
    queryFn: () => fetchAdminExamVersions(examId),
    enabled: !!examId,
  });
}

export function useCreateExamVersion(examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; examType: string; contentType: string; contentId: string; examStructureId: string; examRuleId: string; examCriteriaId?: string; }) =>
      createExamVersionApi(examId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams", examId, "versions"] });
    },
  });
}

export function useUpdateExamVersion(examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ versionId, payload }: { versionId: string; payload: any }) =>
      updateExamVersionApi(versionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams", examId, "versions"] });
    },
  });
}

export function usePublishExamVersion(examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => publishExamVersionApi(versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams", examId, "versions"] });
    },
  });
}

export function useDeleteExamVersion(examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => deleteExamVersionApi(versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams", examId, "versions"] });
    },
  });
}

export function useArchiveExamVersion(examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => archiveExamVersionApi(versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exams", examId, "versions"] });
    },
  });
}

/* ==================== EXAM STRUCTURES & RULES ==================== */
export function useAdminExamStructures() {
  return useQuery({
    queryKey: ["admin", "exam-structures"],
    queryFn: fetchAdminExamStructures,
    staleTime: 30_000,
    enabled: typeof window !== "undefined",
  });
}

export function useAdminExamRules() {
  return useQuery({
    queryKey: ["admin", "exam-rules"],
    queryFn: fetchAdminExamRules,
    staleTime: 30_000,
    enabled: typeof window !== "undefined",
  });
}

export function useCreateExamRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExamRulePayload) =>
      createExamRuleApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-rules"] });
    },
  });
}

export function useUpdateExamRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ExamRulePayload }) =>
      updateExamRuleApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-rules"] });
    },
  });
}

export function useDeleteExamRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExamRuleApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-rules"] });
    },
  });
}

/* ==================== EXAM CRITERIA ==================== */
export function useAdminExamCriterias() {
  return useQuery({
    queryKey: ["admin", "exam-criterias"],
    queryFn: fetchAdminExamCriterias,
  });
}

export function useCreateExamCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExamCriteriaApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-criterias"] });
    },
  });
}

export function useUpdateExamCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ExamCriteriaPayload }) =>
      updateExamCriteriaApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-criterias"] });
    },
  });
}

export function useDeleteExamCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExamCriteriaApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-criterias"] });
    },
  });
}

export function useCreateExamStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; sections: any[]; metadata?: any }) =>
      createExamStructureApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-structures"] });
    },
  });
}

export function useUpdateExamStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { title: string; sections: any[]; metadata?: any } }) =>
      updateExamStructureApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-structures"] });
    },
  });
}

export function useDeleteExamStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExamStructureApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "exam-structures"] });
    },
  });
}
