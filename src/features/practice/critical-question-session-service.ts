import type {
  CriticalQuestionBookmarkResponse,
  CriticalQuestionSession,
  CriticalQuestionSessionAnswer,
  SaveCriticalQuestionCursorRequest,
  SetCriticalQuestionBookmarkRequest,
  StartCriticalQuestionSessionRequest,
  SubmitCriticalQuestionAnswerRequest,
} from "@/features/practice/critical-session-types";
import { practiceApi } from "@/lib/api";

export async function startCriticalQuestionSession(
  payload: StartCriticalQuestionSessionRequest
): Promise<CriticalQuestionSession> {
  return practiceApi.post<CriticalQuestionSession>(
    "/v1/questions/critical/sessions",
    payload
  );
}

export async function getCriticalQuestionSession(
  sessionId: string
): Promise<CriticalQuestionSession> {
  return practiceApi.get<CriticalQuestionSession>(
    `/v1/questions/critical/sessions/${sessionId}`
  );
}

export async function submitCriticalQuestionAnswer(
  payload: SubmitCriticalQuestionAnswerRequest
): Promise<CriticalQuestionSessionAnswer> {
  return practiceApi.post<CriticalQuestionSessionAnswer>(
    "/v1/questions/critical/answers",
    payload
  );
}

export async function saveCriticalQuestionCursor(
  sessionId: string,
  payload: SaveCriticalQuestionCursorRequest
): Promise<CriticalQuestionSession> {
  return practiceApi.put<CriticalQuestionSession>(
    `/v1/questions/critical/sessions/${sessionId}/cursor`,
    payload
  );
}

export async function setCriticalQuestionBookmark(
  chapterId: number,
  questionId: number,
  payload: SetCriticalQuestionBookmarkRequest
): Promise<CriticalQuestionBookmarkResponse> {
  return practiceApi.put<CriticalQuestionBookmarkResponse>(
    `/v1/learning/chapters/${chapterId}/bookmarks/${questionId}`,
    payload
  );
}