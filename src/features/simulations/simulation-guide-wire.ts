import { z } from "zod";
const text = z
  .string()
  .max(12000)
  .refine(
    (s) =>
      !/[<>\x00-\x08\x0b\x0c\x0e-\x1f]|(?:javascript|data):|https?:\/\//i.test(
        s,
      ),
    "Chỉ cho phép chữ thuần, không HTML hoặc URL.",
  );
const item = <K extends string>(key: K) =>
  z.object({ key: z.literal(key), title: text, description: text }).strict();
function humanText(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, v]) =>
    key === "key" ? [] : humanText(v),
  );
}
export const wireGuideContent = z
  .object({
    title: text,
    description: text,
    overview: z.object({ description: text }).strict(),
    steps: z
      .object({
        title: text,
        items: z.tuple([
          item("SELECT_SCENARIO"),
          item("OBSERVE"),
          item("FIRST_RESPONSE"),
          item("REVIEW"),
        ]),
      })
      .strict(),
    scoring: z
      .object({
        title: text,
        description: text,
        illustrationTitle: text,
        illustrationNote: text,
        items: z.tuple([
          item("FIRST_ONLY"),
          item("SCORE_WINDOW"),
          item("ZERO_SCORE"),
        ]),
        important: text,
      })
      .strict(),
    recognition: z
      .object({
        title: text,
        items: z.tuple([item("HAZARD_SIGN"), item("RECOGNITION_TIP")]),
        policy: item("HINT_POLICY"),
      })
      .strict(),
    comparison: z
      .object({
        title: text,
        practice: z
          .object({
            badge: text,
            title: text,
            items: z.tuple([
              item("PRACTICE_SCOPE"),
              item("PRACTICE_RESULT"),
              item("PRACTICE_BOOKMARK"),
            ]),
          })
          .strict(),
        exam: z
          .object({
            badge: text,
            title: text,
            items: z.tuple([item("EXAM_AVAILABILITY"), item("EXAM_PLAN")]),
          })
          .strict(),
      })
      .strict(),
    notes: z
      .object({
        title: text,
        items: z.tuple([
          item("STABLE_CONNECTION"),
          item("NORMAL_PLAYBACK"),
          item("RESULT_CONFIRMATION"),
          item("REPLAY_ONLY"),
        ]),
      })
      .strict(),
    cta: z
      .object({ title: text, description: text, buttonLabel: text })
      .strict(),
  })
  .strict()
  .refine(
    (v) => humanText(v).reduce((n, s) => n + s.length, 0) <= 200000,
    "Tổng nội dung vượt giới hạn cho phép.",
  );
const revisionNumber = z.number().int().min(1).safe();
const actor = z.union([z.string().uuid(), z.literal("SYSTEM")]);
export const wireGuideRevision = z
  .object({
    pageKey: z.literal("SIMULATION_GUIDE"),
    schemaVersion: z.literal(1),
    revision: revisionNumber,
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    content: wireGuideContent,
    updatedAt: z.string().datetime({ offset: true }),
    updatedBy: actor,
    publishedAt: z.string().datetime({ offset: true }).nullable(),
    publishedBy: actor.nullable(),
    sectionOrder: z.tuple([
      z.literal("OVERVIEW"),
      z.literal("PRACTICE_STEPS"),
      z.literal("SCORING"),
      z.literal("RECOGNITION"),
      z.literal("MODE_COMPARISON"),
      z.literal("PRACTICE_NOTES"),
      z.literal("CTA"),
    ]),
  })
  .strict()
  .refine(
    (v) =>
      v.status === "DRAFT"
        ? v.publishedAt === null && v.publishedBy === null
        : v.publishedAt !== null &&
          v.publishedBy !== null &&
          humanText(v.content).every((s) => !!s.trim()),
    "Thông tin công bố không nhất quán.",
  );
const guidePolicy = z.enum([
  "MOCK_EXAM_UNAVAILABLE_V1",
  "MOCK_EXAM_RELEASED_V1",
]);
export const wireGuideBank = z
  .object({
    bankVersion: z.string().min(1),
    chapterCount: revisionNumber,
    scenarioCount: revisionNumber,
    scoringLabels: z.tuple([
      z.string().min(1),
      z.string().min(1),
      z.string().min(1),
      z.string().min(1),
      z.string().min(1),
      z.string().min(1),
      z.string().min(1),
    ]),
    mockExam: z
      .object({ available: z.boolean(), notice: z.string().min(1) })
      .strict(),
  })
  .strict();
export const wireGuideCurrent = z
  .object({
    scope: z
      .object({
        userId: z.string().uuid(),
        licenseClass: z.enum([
          "B",
          "C1",
          "C",
          "D1",
          "D2",
          "D",
          "BE",
          "C1E",
          "CE",
          "D1E",
          "D2E",
          "DE",
        ]),
        bankVersion: z.string().min(1),
      })
      .strict(),
    document: wireGuideRevision,
    bank: wireGuideBank,
    contentPolicy: guidePolicy,
  })
  .strict()
  .refine(
    (v) =>
      (v.contentPolicy === "MOCK_EXAM_RELEASED_V1") ===
      v.bank.mockExam.available,
    "Chính sách phát hành và trạng thái thi thử không nhất quán.",
  );
export const wireGuideAdmin = z
  .object({
    actorId: z.string().uuid(),
    revision: revisionNumber,
    draft: wireGuideRevision,
    published: wireGuideRevision.nullable(),
    template: wireGuideContent,
    bank: wireGuideBank,
    preview: wireGuideRevision,
    contentPolicy: guidePolicy,
  })
  .strict()
  .refine(
    (v) =>
      (v.contentPolicy === "MOCK_EXAM_RELEASED_V1") ===
      v.bank.mockExam.available,
    "Chính sách phát hành và trạng thái thi thử không nhất quán.",
  );
export const wireGuideHistory = z
  .object({
    actorId: z.string().uuid(),
    versions: z.array(wireGuideRevision).max(100),
  })
  .strict();
export const wireGuideSaveRequest = z
  .object({
    expectedRevision: revisionNumber,
    schemaVersion: z.literal(1),
    content: wireGuideContent,
  })
  .strict();
export const wireGuidePublishRequest = z
  .object({ expectedRevision: revisionNumber })
  .strict();
export function parseGuideWire<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new Error(
      "Nội dung hoặc phản hồi hướng dẫn không đúng hợp đồng đã bàn giao.",
    );
  return result.data;
}
