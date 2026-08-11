"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  finishExam,
  getCriticalQuestions,
  getExamHistory,
  getExamResult,
  getExamSession,
  getLeaderboard,
  getQuestionStats,
  startExam,
  submitAnswer,
  type SubmitAnswerRequest,
} from "./practice-service";
import { logStudySession } from "@/features/progress/progress-service";
import { progressKeys } from "@/features/progress/use-progress";
import { ApiError } from "@/lib/api";
import { useExamStore } from "@/stores/exam-store";

export const practiceKeys = {
  stats: ["practice", "question-stats"] as const,
  critical: ["practice", "critical"] as const,
  session: (examId: string) => ["practice", "exam-session", examId] as const,
  result: (examId: string) => ["practice", "exam-result", examId] as const,
  history: (page: number, size: number) =>
    ["practice", "exam-history", page, size] as const,
  leaderboard: (examType: string, period: string) =>
    ["practice", "leaderboard", examType, period] as const,
};

export function useQuestionStats() {
  return useQuery({
    queryKey: practiceKeys.stats,
    queryFn: getQuestionStats,
    staleTime: 5 * 60_000,
  });
}

export function useCriticalQuestions() {
  return useQuery({
    queryKey: practiceKeys.critical,
    queryFn: getCriticalQuestions,
    staleTime: 5 * 60_000,
  });
}

/** Bắt đầu bài thi/luyện tập (chỉ gọi API) */
export function useStartExam() {
  return useMutation({ mutationFn: startExam });
}

/** Bắt đầu + lưu session vào store + chuyển sang màn làm bài */
export function useStartExamAndGo() {
  const router = useRouter();
  return useMutation({
    mutationFn: startExam,
    onSuccess: (session) => {
      useExamStore.getState().startSession(session);
      router.push(`/practice/exam/${session.examId}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Không thể bắt đầu bài thi"
      );
    },
  });
}

/** Lấy session exam từ server (dùng khi resume / reconcile) */
export function useExamSession(examId: string) {
  return useQuery({
    queryKey: practiceKeys.session(examId),
    queryFn: () => getExamSession(examId),
    enabled: !!examId,
    retry: false,
    staleTime: 0,
  });
}

/** Nộp đáp án cho 1 câu hỏi */
export function useSubmitAnswer() {
  return useMutation({
    mutationFn: ({
      examId,
      payload,
    }: {
      examId: string;
      payload: SubmitAnswerRequest;
    }) => submitAnswer(examId, payload),
  });
}

/** Nộp bài / kết thúc → xóa session khỏi store + sang màn kết quả */
export function useFinishExam() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: finishExam,
    onSuccess: async (result, examId) => {
      try {
        const examKey = result.examId ?? examId;
        const storageKey = `dts_logged_${examKey}`;
        // Dedup với result page: chỉ log 1 lần/1 bài, dù vào theo nút Kết thúc hay xem kết quả
        if (sessionStorage.getItem(storageKey)) return;
        sessionStorage.setItem(storageKey, "true");

        const startedAt = result.startedAt ? new Date(result.startedAt).getTime() : Date.now();
        const completedAt = result.completedAt ? new Date(result.completedAt).getTime() : Date.now();
        const durationSeconds = Math.max(1, Math.round((completedAt - startedAt) / 1000));

        await logStudySession({
          sessionType: result.mode === "PRACTICE" ? "PRACTICE" : "EXAM",
          examType: result.examType ?? "B2",
          mode: result.mode ?? "EXAM",
          examId: examKey,
          questionsCount: result.totalQuestions ?? 25,
          correctCount: result.correctCount ?? 0,
          wrongCount: result.wrongCount ?? 0,
          durationSeconds,
        });

        queryClient.invalidateQueries({ queryKey: progressKeys.dashboard });
      } catch (err) {
        console.error("Failed to log progress session:", err);
      }

      useExamStore.getState().clear();
      toast.success("Đã nộp bài");
      router.push(`/practice/result/${result.examId ?? examId}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Nộp bài thất bại"
      );
    },
  });
}

/** Kết quả bài thi */
export function useExamResult(examId: string) {
  return useQuery({
    queryKey: practiceKeys.result(examId),
    queryFn: () => getExamResult(examId),
    enabled: !!examId,
    retry: false,
  });
}

/** Lịch sử thi (phân trang) */
export function useExamHistory(page: number, size: number) {
  return useQuery({
    queryKey: practiceKeys.history(page, size),
    queryFn: () => getExamHistory(page, size),
    placeholderData: (prev) => prev,
  });
}

/** Bảng xếp hạng */
export function useLeaderboard(examType: string, period: string) {
  return useQuery({
    queryKey: practiceKeys.leaderboard(examType, period),
    queryFn: () => getLeaderboard(examType, period),
    staleTime: 30_000,
  });
}
