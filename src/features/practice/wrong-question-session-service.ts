import { practiceApi } from "@/lib/api";

import type {
  FinishWrongQuestionSessionResponse,
  SaveWrongQuestionCursorRequest,
  SetWrongQuestionBookmarkRequest,
  StartWrongQuestionSessionRequest,
  StartWrongQuestionSessionResponse,
  SubmitWrongQuestionAnswerRequest,
  SubmitWrongQuestionAnswerResponse,
  WrongQuestionReviewSession,
} from "@/features/practice/wrong-question-session-types";

export async function startWrongQuestionSession(
  payload: StartWrongQuestionSessionRequest
): Promise<StartWrongQuestionSessionResponse> {
  return practiceApi.post<StartWrongQuestionSessionResponse>(
    "/v1/wrong-questions/sessions",
    payload
  );
}

export async function getWrongQuestionSession(
  sessionId: string
): Promise<WrongQuestionReviewSession> {
  return practiceApi.get<WrongQuestionReviewSession>(
    `/v1/wrong-questions/sessions/${sessionId}`
  );
}

export async function submitWrongQuestionAnswer(
  sessionId: string,
  payload: SubmitWrongQuestionAnswerRequest
): Promise<SubmitWrongQuestionAnswerResponse> {
  return practiceApi.post<SubmitWrongQuestionAnswerResponse>(
    `/v1/wrong-questions/sessions/${sessionId}/answers`,
    payload
  );
}

export async function saveWrongQuestionCursor(
  sessionId: string,
  payload: SaveWrongQuestionCursorRequest
): Promise<WrongQuestionReviewSession> {
  return practiceApi.put<WrongQuestionReviewSession>(
    `/v1/wrong-questions/sessions/${sessionId}/cursor`,
    payload
  );
}

export async function finishWrongQuestionSession(
  sessionId: string
): Promise<FinishWrongQuestionSessionResponse> {
  return practiceApi.post<FinishWrongQuestionSessionResponse>(
    `/v1/wrong-questions/sessions/${sessionId}/finish`
  );
}

export async function setWrongQuestionBookmark(
  chapterId: number,
  questionId: number,
  payload: SetWrongQuestionBookmarkRequest
): Promise<unknown> {
  return practiceApi.put<unknown>(
    `/v1/learning/chapters/${chapterId}/bookmarks/${questionId}`,
    payload
  );
}