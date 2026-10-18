import type {
  ChapterLearningOverview,
  ChapterLearningStatus,
} from "@/features/practice/chapter-overview-types";
import { CHAPTER_META } from "@/features/practice/practice-service";
import { practiceApi } from "@/lib/api";

interface ChapterLearningOverviewApiResponse {
  licenseClass: string;
  bankVersion: string;

  totalQuestions: number;
  learnedQuestions: number;
  completionPercent: number;

  chapters: Array<{
    chapterId: number;
    totalQuestions: number;
    learnedQuestions: number;
    completionPercent: number;
    status: ChapterLearningStatus;
    lastQuestionId?: number | null;
    resumeQuestionId?: number | null;
    lastStudiedAt?: string | null;
  }>;
}

export async function getChapterLearningOverview(
  licenseClass: string
): Promise<ChapterLearningOverview> {
  const normalizedLicense =
    licenseClass
      .trim()
      .toUpperCase();

  if (!normalizedLicense) {
    return {
      licenseClass: "",
      bankVersion: "",
      totalQuestions: 0,
      learnedQuestions: 0,
      completionPercent: 0,
      chapters: [],
    };
  }

  const data =
    await practiceApi.get<ChapterLearningOverviewApiResponse>(
      `/v1/learning/chapters?licenseClass=${encodeURIComponent(
        normalizedLicense
      )}`
    );

  return {
    licenseClass:
      data.licenseClass,

    bankVersion:
      data.bankVersion,

    totalQuestions:
      data.totalQuestions,

    learnedQuestions:
      data.learnedQuestions,

    completionPercent:
      data.completionPercent,


    chapters:
      (data.chapters ?? [])
        .filter(
          (chapter) =>
            chapter.totalQuestions > 0
        )
        .map((chapter) => {
          const meta =
            CHAPTER_META[
              String(
                chapter.chapterId
              )
            ];

          return {
            chapterId:
              chapter.chapterId,

            order:
              chapter.chapterId,

            title:
              meta?.name ??
              `Chương ${chapter.chapterId}`,

            licenseClass:
              data.licenseClass,

            totalQuestions:
              chapter.totalQuestions,

            learnedQuestions:
              chapter.learnedQuestions,

            completionPercent:
              chapter.completionPercent,

            status:
              chapter.status,

            lastQuestionId:
              chapter.lastQuestionId,

            resumeQuestionId:
              chapter.resumeQuestionId,

            lastStudiedAt:
              chapter.lastStudiedAt,
          };
        }),
  };
}