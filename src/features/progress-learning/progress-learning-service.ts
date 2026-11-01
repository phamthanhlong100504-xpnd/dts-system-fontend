
import { progressApi } from "@/lib/api";

import type {
  LearningChapterProgress,
  LearningChapterProgressApi,
  LearningProgressOverview,
  LearningProgressOverviewApi,
  LearningProgressStatus,
} from "@/features/progress-learning/progress-learning-types";

export async function getLearningProgressOverview(
  licenseClass: string
): Promise<LearningProgressOverview> {
  const normalizedLicense = licenseClass
    .trim()
    .toUpperCase();

  if (!normalizedLicense) {
    throw new Error("licenseClass is required");
  }

  const response =
    await progressApi.get<LearningProgressOverviewApi>(
      `/v1/progress/learning-overview?licenseClass=${encodeURIComponent(
        normalizedLicense
      )}`
    );

  return mapLearningProgressOverview(
    response,
    normalizedLicense
  );
}

function mapLearningProgressOverview(
  response: LearningProgressOverviewApi,
  requestedLicenseClass: string
): LearningProgressOverview {
  if (
    !response ||
    !response.overall ||
    !response.review ||
    !response.critical ||
    !Array.isArray(response.chapters)
  ) {
    throw new Error(
      "Invalid learning progress overview response"
    );
  }

  const licenseClass = requireString(
    response.licenseClass,
    "licenseClass"
  ).toUpperCase();

  if (licenseClass !== requestedLicenseClass) {
    throw new Error(
      `Learning progress license mismatch: expected ${requestedLicenseClass}, received ${licenseClass}`
    );
  }

  const bankVersion = requireString(
    response.bankVersion,
    "bankVersion"
  );

  const totalQuestions = requireCount(
    response.overall.totalQuestions,
    "overall.totalQuestions"
  );

  const studiedQuestions = requireCount(
    response.overall.learnedQuestions,
    "overall.learnedQuestions"
  );

  const progressPercent = requirePercent(
    response.overall.completionPercent,
    "overall.completionPercent"
  );

  requireStatus(
    response.overall.status,
    "overall.status"
  );

  if (studiedQuestions > totalQuestions) {
    throw new Error(
      "overall.learnedQuestions exceeds totalQuestions"
    );
  }

  const needReviewCount = requireCount(
    response.review.needReviewCount,
    "review.needReviewCount"
  );

  const criticalTotalQuestions = requireCount(
    response.critical.totalQuestions,
    "critical.totalQuestions"
  );

  const criticalStudiedQuestions = requireCount(
    response.critical.criticalStudiedQuestions,
    "critical.criticalStudiedQuestions"
  );

  requirePercent(
    response.critical.completionPercent,
    "critical.completionPercent"
  );

  requireStatus(
    response.critical.status,
    "critical.status"
  );

  if (
    criticalStudiedQuestions >
    criticalTotalQuestions
  ) {
    throw new Error(
      "critical.criticalStudiedQuestions exceeds totalQuestions"
    );
  }

  const chapters = response.chapters.map(
    (chapter, index) =>
      mapChapterProgress(chapter, index)
  );

  const chapterIds = chapters.map(
    (chapter) => chapter.chapterId
  );

  if (
    new Set(chapterIds).size !==
    chapterIds.length
  ) {
    throw new Error(
      "Duplicate chapterId in learning progress overview"
    );
  }

  return {
    licenseClass,
    bankVersion,

    overall: {
      studiedQuestions,
      totalQuestions,
      progressPercent,
      remainingQuestions:
        totalQuestions - studiedQuestions,
    },

    review: {
      needReviewCount,
    },

    critical: {
      studiedQuestions:
        criticalStudiedQuestions,
      totalQuestions:
        criticalTotalQuestions,
    },

    chapters,
  };
}

function mapChapterProgress(
  chapter: LearningChapterProgressApi,
  index: number
): LearningChapterProgress {
  const prefix = `chapters[${index}]`;

  const chapterId = requirePositiveInteger(
    chapter.chapterId,
    `${prefix}.chapterId`
  );

  const chapterName = requireString(
    chapter.chapterName,
    `${prefix}.chapterName`
  );

  const totalQuestions = requireCount(
    chapter.totalQuestions,
    `${prefix}.totalQuestions`
  );

  const studiedQuestions = requireCount(
    chapter.learnedQuestions,
    `${prefix}.learnedQuestions`
  );

  const progressPercent = requirePercent(
    chapter.completionPercent,
    `${prefix}.completionPercent`
  );

  const status = requireStatus(
    chapter.status,
    `${prefix}.status`
  );

  requireCount(
    chapter.needReviewCount,
    `${prefix}.needReviewCount`
  );

  requireCount(
    chapter.criticalStudiedQuestions,
    `${prefix}.criticalStudiedQuestions`
  );

  if (studiedQuestions > totalQuestions) {
    throw new Error(
      `${prefix}.learnedQuestions exceeds totalQuestions`
    );
  }

  return {
    chapterId,
    chapterName,
    totalQuestions,
    studiedQuestions,
    progressPercent,
    status,
  };
}

function requireString(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `Missing or invalid field: ${fieldName}`
    );
  }

  return value.trim();
}

function requireCount(
  value: unknown,
  fieldName: string
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `Missing or invalid count: ${fieldName}`
    );
  }

  return value;
}

function requirePositiveInteger(
  value: unknown,
  fieldName: string
): number {
  const number = requireCount(
    value,
    fieldName
  );

  if (number === 0) {
    throw new Error(
      `Invalid positive integer: ${fieldName}`
    );
  }

  return number;
}

function requirePercent(
  value: unknown,
  fieldName: string
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(
      `Missing or invalid percentage: ${fieldName}`
    );
  }

  return value;
}

function requireStatus(
  value: unknown,
  fieldName: string
): LearningProgressStatus {
  const status = requireString(
    value,
    fieldName
  ).toUpperCase();

  if (
    status === "NOT_STARTED" ||
    status === "IN_PROGRESS" ||
    status === "COMPLETED"
  ) {
    return status;
  }

  throw new Error(
    `Invalid progress status: ${fieldName}=${status}`
  );
}
