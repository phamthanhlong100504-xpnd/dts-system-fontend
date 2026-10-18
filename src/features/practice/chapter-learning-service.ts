import { practiceApi } from "@/lib/api";

export interface ChapterLearnedAnswer {
  questionId: number;
  selectedAnswer: string;
  isCorrect: boolean;
  learnedAt: string;
  lastAnsweredAt: string;
}

export interface RecordChapterAnswerRequest {
  chapterId: number;
  licenseClass: string;
  questionId: number;
  selectedAnswer: string;
}

export interface RecordChapterAnswerResponse {
  questionId: number;
  selectedAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string | null;
  answeredAt: string;
}

export interface SaveChapterCursorRequest {
  chapterId: number;
  licenseClass: string;
  questionId: number;
}

export interface ChapterLearningCursor {
  chapterId: number;
  lastQuestionId?: number | null;
  resumeQuestionId?: number | null;
  lastStudiedAt?: string | null;
}

export interface ChapterBookmarks {
  chapterId: number;
  licenseClass: string;
  questionIds: number[];
}

export interface SetChapterBookmarkRequest {
  chapterId: number;
  questionId: number;
  licenseClass: string;
  bookmarked: boolean;
}

export interface ChapterBookmarkResponse {
  chapterId: number;
  questionId: number;
  licenseClass: string;
  bookmarked: boolean;
}

function normalizeLicense(licenseClass: string) {
  return licenseClass.trim().toUpperCase();
}

export async function getChapterLearnedAnswers({
  chapterId,
  licenseClass,
}: {
  chapterId: number;
  licenseClass: string;
}): Promise<ChapterLearnedAnswer[]> {
  const license = normalizeLicense(licenseClass);

  return practiceApi.get<ChapterLearnedAnswer[]>(
    `/v1/learning/chapters/${chapterId}/answers?licenseClass=${encodeURIComponent(
      license
    )}`
  );
}

export async function recordChapterAnswer({
  chapterId,
  licenseClass,
  questionId,
  selectedAnswer,
}: RecordChapterAnswerRequest): Promise<RecordChapterAnswerResponse> {
  const license = normalizeLicense(licenseClass);

  return practiceApi.post<RecordChapterAnswerResponse>(
    `/v1/learning/chapters/${chapterId}/answers`,
    {
      licenseClass: license,
      questionId,
      selectedAnswer: selectedAnswer.trim().toUpperCase(),
    }
  );
}

export async function saveChapterCursor({
  chapterId,
  licenseClass,
  questionId,
}: SaveChapterCursorRequest): Promise<ChapterLearningCursor> {
  const license = normalizeLicense(licenseClass);

  return practiceApi.put<ChapterLearningCursor>(
    `/v1/learning/chapters/${chapterId}/cursor`,
    {
      licenseClass: license,
      questionId,
    }
  );
}

export async function getChapterBookmarks({
  chapterId,
  licenseClass,
}: {
  chapterId: number;
  licenseClass: string;
}): Promise<ChapterBookmarks> {
  const license = normalizeLicense(licenseClass);

  return practiceApi.get<ChapterBookmarks>(
    `/v1/learning/chapters/${chapterId}/bookmarks?licenseClass=${encodeURIComponent(
      license
    )}`
  );
}

export async function setChapterBookmark({
  chapterId,
  questionId,
  licenseClass,
  bookmarked,
}: SetChapterBookmarkRequest): Promise<ChapterBookmarkResponse> {
  const license = normalizeLicense(licenseClass);

  return practiceApi.put<ChapterBookmarkResponse>(
    `/v1/learning/chapters/${chapterId}/bookmarks/${questionId}`,
    {
      licenseClass: license,
      bookmarked,
    }
  );
}