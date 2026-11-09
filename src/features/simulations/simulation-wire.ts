import { z } from "zod";

const count = z.number().int().nonnegative();
const duration = z.number().int().positive();
const id = z.string().uuid();
const bank = z.string().min(1);
const url = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//i.test(value));
const expiry = z.string().datetime({ offset: true });
export const wireScope = z.object({
  userId: z.string().min(1),
  licenseClass: z.string().min(1),
  bankVersion: bank,
});
const chapter = z.object({
  chapterId: z.number().int().min(1).max(6),
  chapterNumber: duration,
  chapterName: z.string().min(1),
  totalScenarios: count,
  practicedScenarios: count,
  completionPercent: z.number().min(0).max(100),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
});
export const wireOverview = z.object({
  scope: wireScope,
  totalScenarios: count,
  practicedScenarios: count,
  completionPercent: z.number().min(0).max(100),
  chapters: z.array(chapter),
});
const item = z.object({
  scenarioId: id,
  scenarioNumber: duration,
  title: z.string().min(1),
  chapterId: duration,
  durationMs: duration,
  thumbnailUrl: url,
  thumbnailExpiresAt: expiry,
  isPracticed: z.boolean(),
  bestScore: count.nullable(),
  maxScore: duration,
  isBookmarked: z.boolean(),
  completedAttemptCount: count,
});
export const wireCursor = z.object({
  scenarioId: id.nullable(),
  sourceAttemptId: id.nullable(),
  revision: count,
});
export const wireChapter = z.object({
  scope: wireScope,
  chapter,
  items: z.array(item).max(12),
  filterCounts: z.object({
    ALL: count,
    UNPRACTICED: count,
    PRACTICED: count,
    BOOKMARKED: count,
  }),
  page: count,
  size: z.number().int().min(1).max(12),
  totalPages: count,
  filteredCount: count,
  startScenarioId: id,
  cursor: wireCursor,
});
const hint = z.object({ hazardSign: z.string(), recognitionTip: z.string() });
const policy = z.object({
  allowPause: z.boolean(),
  allowSeek: z.boolean(),
  allowFullscreen: z.boolean(),
  allowHintsWhilePlaying: z.boolean(),
  heartbeatIntervalMs: duration,
  maxHeartbeatGapMs: duration,
});
export const wireResult = z.object({
  attemptId: id,
  scenarioId: id,
  status: z.literal("COMPLETED"),
  score: count,
  maxScore: duration,
  responseRecorded: z.boolean(),
  firstResponseMs: count.nullable(),
  videoDurationMs: duration,
  bankVersion: bank,
  scoringVersion: bank,
  scoringSegments: z.array(
    z.object({
      startMs: count,
      endMs: duration,
      score: count,
      endInclusive: z.boolean(),
    }),
  ),
  hazardSign: z.string(),
  recognitionTip: z.string(),
});
export const wireAttempt = z.object({
  attemptId: id,
  scenarioId: id,
  bankVersion: bank,
  scoringVersion: bank,
  status: z.enum([
    "CREATED",
    "PLAYING",
    "INTERRUPTED",
    "COMPLETED",
    "CANCELLED",
  ]),
  playbackEventId: id,
  videoDurationMs: duration,
  resumeAtMs: count,
  responseRecorded: z.boolean(),
  firstResponseMs: count.nullable(),
  requiresResume: z.boolean(),
  createdAt: expiry,
  startedAt: expiry.nullable(),
  completedAt: expiry.nullable(),
  policy,
  result: wireResult.nullable(),
});
export const wirePlayback = z.object({
  attemptId: id,
  playbackEventId: id,
  bankVersion: bank,
  videoUrl: url,
  expiresAt: expiry,
  mimeType: z.literal("video/mp4"),
  durationMs: duration,
  resumeAtMs: count,
});
export const wireDetail = z.object({
  scope: wireScope,
  scenario: item,
  hintPreview: hint.nullable(),
  policy,
  latestAttempt: wireAttempt.nullable(),
  previousScenarioId: id.nullable(),
  nextScenarioId: id.nullable(),
});
export const wireBookmark = z.object({
  scenarioId: id,
  bankVersion: bank,
  bookmarked: z.boolean(),
});
export type WireAttempt = z.infer<typeof wireAttempt>;
export type WirePlayback = z.infer<typeof wirePlayback>;
export type WireDetail = z.infer<typeof wireDetail>;
export type WireResult = z.infer<typeof wireResult>;
export function parseWire<T>(schema: z.ZodType<T>, input: unknown): T {
  const value = schema.safeParse(input);
  if (!value.success)
    throw new Error(
      "Phản hồi backend mô phỏng không đúng hợp đồng đã bàn giao.",
    );
  return value.data;
}
export function requireUuid(value: string) {
  return parseWire(id, value);
}
const datasetVersion = z.string().regex(/^[a-f0-9]{64}$/);
const reviewChapter = z.object({
  chapterId: z.number().int().min(1).max(6),
  chapterNumber: duration,
  chapterName: z.string().min(1),
  needReviewCount: count,
});
export const wireReviewOverview = z.object({
  scope: wireScope,
  scoringVersion: bank,
  datasetVersion,
  practicedScenarios: count,
  totalNeedReview: count,
  chapters: z.array(reviewChapter).length(6),
});
export const wireReviewPage = wireReviewOverview.extend({
  chapterId: z.number().int().min(1).max(6).nullable(),
  sort: z.literal("BEST_SCORE_ASC"),
  filteredCount: count,
  items: z
    .array(
      z.object({
        scenarioId: id,
        scenarioNumber: duration,
        chapterId: duration,
        chapterNumber: duration,
        chapterName: z.string().min(1),
        title: z.string().min(1),
        durationMs: duration,
        thumbnailUrl: url,
        thumbnailExpiresAt: expiry,
        bestScore: count.max(4),
        maxScore: z.literal(5),
        isPracticed: z.literal(true),
        isBookmarked: z.boolean(),
        completedAttemptCount: duration,
      }),
    )
    .max(12),
  page: z.object({
    number: count.max(10000),
    size: duration.max(12),
    totalElements: count,
    totalPages: count,
  }),
});
export const wireReplay = z.object({
  attemptId: id,
  scenarioId: id,
  bankVersion: bank,
  scoringVersion: bank,
  videoUrl: url,
  expiresAt: expiry,
  mimeType: z.literal("video/mp4"),
  durationMs: duration,
  readOnly: z.literal(true),
  policy: z.object({
    allowPause: z.literal(true),
    allowSeek: z.literal(true),
    allowFullscreen: z.literal(true),
  }),
});
const bookmarkChapter = z.object({
  chapterId: z.number().int().min(1).max(6),
  chapterNumber: z.number().int().min(1).max(6),
  chapterName: z.string().min(1),
  bookmarkedCount: count.safe(),
});
export const wireBookmarksOverview = z.object({
  scope: wireScope,
  scoringVersion: bank,
  datasetVersion,
  totalBookmarked: count.safe(),
  chapters: z.array(bookmarkChapter).length(6),
});
export const wireBookmarksPage = wireBookmarksOverview.extend({
  chapterId: z.number().int().min(1).max(6).nullable(),
  sort: z.literal("SCENARIO_ASC"),
  filteredCount: count.safe(),
  items: z
    .array(
      item.extend({
        chapterId: z.number().int().min(1).max(6),
        chapterNumber: z.number().int().min(1).max(6),
        chapterName: z.string().min(1),
        bestScore: count.max(5).nullable(),
        maxScore: z.literal(5),
        isBookmarked: z.literal(true),
      }),
    )
    .max(12),
  page: z.object({
    number: count.max(10000),
    size: duration.max(12),
    totalElements: count.safe(),
    totalPages: count.safe(),
  }),
});
