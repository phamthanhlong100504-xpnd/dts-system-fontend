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
