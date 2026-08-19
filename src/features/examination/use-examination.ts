"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getAvailableExams,
  getExamPaper,
  getExamResult,
  getExamSession,
  saveAnswer,
  startExamSession,
  submitExam,
  type StartExamSessionRequest,
  type SubmitAnswerPayload,
} from "./examination-service";
import { ApiError } from "@/lib/api";

export const examinationKeys = {
  availableExams: ["examination", "available-exams"] as const,
  session: (sessionId: string) => ["examination", "session", sessionId] as const,
  paper: (sessionId: string) => ["examination", "paper", sessionId] as const,
  result: (sessionId: string) => ["examination", "result", sessionId] as const,
};

export function useAvailableExams() {
  return useQuery({
    queryKey: examinationKeys.availableExams,
    queryFn: getAvailableExams,
  });
}

export function useStartExamSessionAndGo() {
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: StartExamSessionRequest) => startExamSession(payload),
    onSuccess: (session) => {
      // Navigate to the run page with the newly created session ID
      router.push(`/examination/${session.examId}/run?sessionId=${session.id}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Không thể bắt đầu bài thi"
      );
    },
  });
}

export function useExamSessionInfo(sessionId: string) {
  return useQuery({
    queryKey: examinationKeys.session(sessionId),
    queryFn: () => getExamSession(sessionId),
    enabled: !!sessionId,
    retry: false,
  });
}

export function useExamPaper(sessionId: string) {
  return useQuery({
    queryKey: examinationKeys.paper(sessionId),
    queryFn: () => getExamPaper(sessionId),
    enabled: !!sessionId,
    retry: false,
    staleTime: Infinity, // Exam paper shouldn't change
  });
}

export function useSaveAnswer() {
  return useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      sessionId: string;
      payload: SubmitAnswerPayload;
    }) => saveAnswer(sessionId, payload),
  });
}

export function useSubmitExam() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitExam,
    onSuccess: (result, sessionId) => {
      toast.success("Đã nộp bài thi thành công!");
      // Navigate to result page
      router.push(`/examination/result/${sessionId}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Nộp bài thất bại"
      );
    },
  });
}

export function useExamResultData(sessionId: string) {
  return useQuery({
    queryKey: examinationKeys.result(sessionId),
    queryFn: () => getExamResult(sessionId),
    enabled: !!sessionId,
    retry: false,
  });
}
