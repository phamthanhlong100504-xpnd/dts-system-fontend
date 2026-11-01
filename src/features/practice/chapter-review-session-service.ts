
import { practiceApi } from "@/lib/api";
import type { QuestionOption } from "@/features/practice/practice-service";

export type ChapterReviewSessionStatus = "IN_PROGRESS" | "COMPLETED";

export interface ChapterReviewQuestion {
  questionId: number;
  position: number;
  questionText: string;
  options: QuestionOption[];
  isCritical: boolean;
  imageUrl?: string | null;
  mediaFileId?: string | null;
  bookmarked: boolean;
}

export interface ChapterReviewAnswer {
  questionId: number;
  selectedAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string | null;
  answeredAt: string;
}

export interface ChapterReviewSession {
  reviewSessionId: string;
  licenseClass: string;
  bankVersion: string;
  chapterId: number;
  status: ChapterReviewSessionStatus;
  totalQuestions: number;
  answeredQuestions: number;
  currentPosition: number;
  currentQuestionId: number | null;
  questions: ChapterReviewQuestion[];
  answers: Record<string, ChapterReviewAnswer>;
  startedAt: string;
  completedAt: string | null;
}

export interface ChapterReviewSessionRef {
  chapterId: number;
  sessionId: string;
}

export interface RecordChapterReviewAnswerRequest
  extends ChapterReviewSessionRef {
  questionId: number;
  selectedAnswer: string;
}

export interface SaveChapterReviewCursorRequest
  extends ChapterReviewSessionRef {
  currentQuestionId: number;
}

function reviewSessionPath({
  chapterId,
  sessionId,
}: ChapterReviewSessionRef) {
  return `/v1/learning/chapters/${chapterId}/review-sessions/${encodeURIComponent(
    sessionId
  )}`;
}

export async function startChapterReviewSession({
  chapterId,
  licenseClass,
}: {
  chapterId: number;
  licenseClass: string;
}): Promise<ChapterReviewSession> {
  const started = await practiceApi.post<ChapterReviewSession>(
    `/v1/learning/chapters/${chapterId}/review-sessions`,
    {
      licenseClass: licenseClass.trim().toUpperCase(),
    }
  );

  return getChapterReviewSession({
    chapterId,
    sessionId: started.reviewSessionId,
  });
}

export function getChapterReviewSession(
  ref: ChapterReviewSessionRef
): Promise<ChapterReviewSession> {
  return practiceApi.get<ChapterReviewSession>(
    reviewSessionPath(ref)
  );
}

export async function recordChapterReviewAnswer(
  request: RecordChapterReviewAnswerRequest
): Promise<ChapterReviewSession> {
  await practiceApi.post<unknown>(
    `${reviewSessionPath(request)}/answers`,
    {
      questionId: request.questionId,
      selectedAnswer: request.selectedAnswer.trim().toUpperCase(),
    }
  );

  return getChapterReviewSession(request);
}

export async function saveChapterReviewCursor(
  request: SaveChapterReviewCursorRequest
): Promise<ChapterReviewSession> {
  await practiceApi.put<unknown>(
    `${reviewSessionPath(request)}/cursor`,
    {
      currentQuestionId: request.currentQuestionId,
    }
  );

  return getChapterReviewSession(request);
}

export async function finishChapterReviewSession(
  ref: ChapterReviewSessionRef
): Promise<ChapterReviewSession> {
  await practiceApi.post<unknown>(
    `${reviewSessionPath(ref)}/finish`
  );

  return getChapterReviewSession(ref);
}
