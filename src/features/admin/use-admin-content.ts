"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createQuestionApi,
  updateQuestionApi,
  deleteQuestionApi,
  fetchAdminQuestions,
  CreateQuestionPayload,
  UpdateQuestionPayload,
} from "./admin-content-service";
import {
  fetchAdminPrograms,
  createProgramApi,
  deleteProgramApi,
} from "./admin-programs-service";
import {
  fetchAdminChapters,
  createChapterApi,
  deleteChapterApi,
} from "./admin-chapters-service";
import {
  fetchAdminExams,
  createExamApi,
  changeExamStatusApi,
  deleteExamApi,
} from "./admin-examination-service";

/* ==================== QUESTIONS ==================== */
export function useAdminQuestions() {
  return useQuery({
    queryKey: ["admin", "questions"],
    queryFn: fetchAdminQuestions,
    staleTime: 30_000,
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

/* ==================== CHAPTERS ==================== */
export function useAdminChapters() {
  return useQuery({
    queryKey: ["admin", "chapters"],
    queryFn: fetchAdminChapters,
    staleTime: 30_000,
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

export function useDeleteChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteChapterApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "chapters"] });
    },
  });
}

/* ==================== EXAMS ==================== */
export function useAdminExams() {
  return useQuery({
    queryKey: ["admin", "exams"],
    queryFn: fetchAdminExams,
    staleTime: 30_000,
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name?: string; title?: string; code?: string; durationMinutes?: number; passScore?: number; status?: "DRAFT" | "PUBLISHED" }) =>
      createExamApi(payload),
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
