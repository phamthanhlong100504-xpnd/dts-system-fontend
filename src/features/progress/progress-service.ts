import { progressApi } from "@/lib/api";
import type { ProgressSchemas } from "@/lib/api";

export async function getDashboard() {
  return progressApi.get<ProgressSchemas["DashboardResponse"]>(
    "/v1/progress/dashboard"
  );
}

export interface LogStudySessionPayload {
  sessionType: "EXAM" | "PRACTICE";
  examType?: string;
  mode?: "EXAM" | "PRACTICE";
  examId?: string;
  questionsCount: number;
  correctCount: number;
  wrongCount: number;
  durationSeconds: number;
}

export async function logStudySession(payload: LogStudySessionPayload) {
  return progressApi.post<unknown>("/v1/progress/sessions", payload);
}

export interface UpdateChapterProgressPayload {
  chapterId: number;
  chapterName: string;
  questionsTotal: number;
  questionsCount: number;
  correctCount: number;
  wrongCount?: number;
}

export async function updateChapterProgress(
  payload: UpdateChapterProgressPayload
) {
  return progressApi.patch<unknown>("/v1/progress/chapters", payload);
}

export async function getStreaks() {
  return progressApi.get<unknown>("/v1/progress/streaks");
}

export async function getRecent(limit = 10) {
  return progressApi.get<unknown>(`/v1/progress/recent?limit=${limit}`);
}
