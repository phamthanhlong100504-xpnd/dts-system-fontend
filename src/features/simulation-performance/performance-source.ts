import { z } from "zod";
import { progressApi, resultApi } from "@/lib/api";
import type { ApiClient } from "@/lib/api/http";
import { useAuthStore } from "@/stores/auth-store";
import { useLicenseStore } from "@/stores/license-store";
import {
  analyticsSchema,
  historySchema,
  performancePeriod,
  progressSchema,
  rankingSchema,
  validateReference,
} from "./performance-contract";
import type {
  PerformancePeriod,
  PerformanceSnapshot,
} from "./performance-contract";

export interface PerformanceScope {
  userId: string;
  licenseClass: string;
  policyVersion: string;
  bankVersion?: string | null;
}
export interface ReadPin {
  watermark?: number;
  asOf?: string;
}
export interface HistoryFilters extends ReadPin {
  activityType?: "SIM_RANDOM_EXAM" | "SIM_PRESET_EXAM";
  result?: "PASSED" | "FAILED";
  from?: string;
  to?: string;
  page: number;
  size: number;
  sort?: "completedAt,desc" | "completedAt,asc";
}
const timestamp = z.string().datetime({ offset: true });
const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const bank = z.string().trim().min(1).max(96);
function scopeValid(s: PerformanceScope) {
  z.string().uuid().parse(s.userId);
  z.string()
    .regex(/^[A-Z][A-Z0-9]{0,4}$/)
    .parse(s.licenseClass);
  bank.parse(s.policyVersion);
}
function pinValid(p: ReadPin) {
  if (p.watermark !== undefined) integer.positive().parse(p.watermark);
  if (p.asOf !== undefined) timestamp.parse(p.asOf);
}
function pagination(page: number, size: number) {
  integer.parse(page);
  integer.min(1).max(100).parse(size);
}
function checkBase(v: PerformanceSnapshot, s: PerformanceScope, p: ReadPin) {
  if (v.licenseClass !== s.licenseClass)
    throw Error("Dữ liệu không thuộc hạng GPLX đang xem.");
  if (p.watermark !== undefined && v.sourceWatermark !== p.watermark)
    throw Error("Mốc đồng bộ không khớp.");
  if (
    v.syncStatus.sequence !== v.sourceWatermark ||
    v.syncStatus.contiguousSequence < v.sourceWatermark
  )
    throw Error("Mốc dữ liệu chưa được xác nhận.");
  if (
    v.dataStatus === "READY" &&
    (!v.syncStatus.complete || v.syncStatus.status !== "READY")
  )
    throw Error("Trạng thái đồng bộ không nhất quán.");
  if (p.asOf && v.asOf && Date.parse(v.asOf) !== Date.parse(p.asOf))
    throw Error("Thời điểm thống kê không khớp.");
}
function unique(values: string[]) {
  if (new Set(values).size !== values.length)
    throw Error("Dữ liệu bị lặp trong response.");
}
function checkPeriod(
  v: z.infer<typeof analyticsSchema> | z.infer<typeof rankingSchema>,
) {
  const e = v.expScope;
  if (
    e.licenseClass !== v.licenseClass ||
    e.from !== v.from ||
    e.to !== v.to ||
    e.asOf !== v.asOf ||
    e.sourceWatermark !== v.sourceWatermark ||
    e.ruleVersion !== v.ruleVersion
  )
    throw Error("Phạm vi EXP không khớp thống kê.");
}
export function createPerformanceSource(
  result: Pick<ApiClient, "get">,
  progress: Pick<ApiClient, "get">,
  guard: (s: PerformanceScope) => void,
) {
  async function read<T extends PerformanceSnapshot>(
    api: Pick<ApiClient, "get">,
    path: string,
    s: PerformanceScope,
    params: Record<string, unknown>,
    schema: z.ZodType<T>,
    signal?: AbortSignal,
  ) {
    scopeValid(s);
    guard(s);
    const raw = await api.get<unknown>(path, {
      params: { licenseClass: s.licenseClass, ...params },
      signal,
      headers: { "Cache-Control": "no-store" },
    });
    guard(s);
    const v = schema.parse(raw);
    checkBase(v, s, params as ReadPin);
    return v;
  }
  return {
    history: async (
      s: PerformanceScope,
      f: HistoryFilters,
      signal?: AbortSignal,
    ) => {
      pagination(f.page, f.size);
      pinValid(f);
      if (f.activityType !== undefined)
        z.enum(["SIM_RANDOM_EXAM", "SIM_PRESET_EXAM"]).parse(f.activityType);
      if (f.result !== undefined) z.enum(["PASSED", "FAILED"]).parse(f.result);
      if (f.from) timestamp.parse(f.from);
      if (f.to) timestamp.parse(f.to);
      if (f.from && f.to && Date.parse(f.from) >= Date.parse(f.to))
        throw Error("Khoảng thời gian không hợp lệ.");
      const sort = f.sort ?? "completedAt,desc";
      z.enum(["completedAt,desc", "completedAt,asc"]).parse(sort);
      const v = await read(
        result,
        "/v1/results/me/history/simulations",
        s,
        {
          activityType: f.activityType,
          result: f.result,
          from: f.from,
          to: f.to,
          page: f.page,
          size: f.size,
          watermark: f.watermark,
          asOf: f.asOf,
          sort,
        },
        historySchema,
        signal,
      );
      if (
        v.page !== f.page ||
        v.size !== f.size ||
        v.sort !== sort ||
        v.content.length > f.size
      )
        throw Error("Phân trang lịch sử không khớp.");
      unique(v.content.map((i) => i.sourceId));
      v.content.forEach((i, n) => {
        validateReference(
          i.sourceResult,
          s.licenseClass,
          i.sourceId,
          i.sourceType,
        );
        if (
          i.licenseClass !== s.licenseClass ||
          i.sessionId !== i.sourceId ||
          i.score !== i.sourceScore ||
          Date.parse(i.startedAt) > Date.parse(i.completedAt)
        )
          throw Error("Kết quả nguồn không nhất quán.");
        if (
          (f.activityType && i.activityType !== f.activityType) ||
          (f.result && i.result !== f.result) ||
          (f.from && Date.parse(i.completedAt) < Date.parse(f.from)) ||
          (f.to && Date.parse(i.completedAt) >= Date.parse(f.to))
        )
          throw Error("Lịch sử không khớp bộ lọc.");
        if (n) {
          const a = v.content[n - 1],
            time = Date.parse(a.completedAt) - Date.parse(i.completedAt);
          if (sort === "completedAt,desc" ? time < 0 : time > 0)
            throw Error("Thứ tự lịch sử không hợp lệ.");
        }
      });
      return v;
    },
    analytics: async (
      s: PerformanceScope,
      period: PerformancePeriod,
      pin: ReadPin = {},
      signal?: AbortSignal,
    ) => {
      performancePeriod.parse(period);
      pinValid(pin);
      const v = await read(
        result,
        "/v1/results/me/analytics/combined",
        s,
        { period, watermark: pin.watermark, asOf: pin.asOf },
        analyticsSchema,
        signal,
      );
      checkPeriod(v);
      if (v.period !== period) throw Error("Kỳ thống kê không khớp.");
      unique(v.recentResults.map((i) => `${i.sourceType}:${i.sourceId}`));
      v.recentResults.forEach((i, n) => {
        validateReference(
          i.sourceResult,
          s.licenseClass,
          i.sourceId,
          i.sourceType,
        );
        if (
          i.licenseClass !== s.licenseClass ||
          (i.module === "SIMULATION") !==
            (i.sourceType === "SIMULATION_SESSION") ||
          i.sourceScore > i.sourceMaxScore
        )
          throw Error("Kết quả gần đây không khớp module.");
        const expected =
          i.module === "SIMULATION"
            ? ["SIM_RANDOM_EXAM", "SIM_PRESET_EXAM"]
            : ["RANDOM_EXAM", "PRESET_EXAM", "OFFICIAL_EXAM"];
        if (!expected.includes(i.activityType))
          throw Error("Loại hoạt động không hợp lệ.");
        if (
          n &&
          Date.parse(v.recentResults[n - 1].completedAt) <
            Date.parse(i.completedAt)
        )
          throw Error("Thứ tự kết quả không hợp lệ.");
      });
      unique(v.scoreTrend.map((i) => i.date));
      if (
        v.summary.attempts === 0 &&
        (v.summary.averageScore !== null || v.summary.passRate !== null)
      )
        throw Error("Thống kê rỗng không được giả thành điểm hoặc tỷ lệ.");
      return v;
    },
    ranking: async (
      s: PerformanceScope,
      period: PerformancePeriod,
      page: number,
      size: number,
      pin: ReadPin = {},
      signal?: AbortSignal,
    ) => {
      performancePeriod.parse(period);
      pagination(page, size);
      pinValid(pin);
      const v = await read(
        result,
        "/v1/leaderboards/combined",
        s,
        { period, page, size, watermark: pin.watermark, asOf: pin.asOf },
        rankingSchema,
        signal,
      );
      checkPeriod(v);
      if (
        v.period !== period ||
        v.page !== page ||
        v.size !== size ||
        v.currentUser.userId !== s.userId ||
        v.items.length > size
      )
        throw Error("Bảng xếp hạng không khớp phạm vi.");
      unique(v.items.map((i) => i.userId));
      return v;
    },
    progress: async (
      s: PerformanceScope,
      bankVersion?: string,
      watermark?: number,
      signal?: AbortSignal,
    ) => {
      if (bankVersion !== undefined) bank.parse(bankVersion);
      pinValid({ watermark });
      const v = await read(
        progress,
        "/v1/progress/simulations/learning-overview",
        s,
        { bankVersion, watermark },
        progressSchema,
        signal,
      );
      if (bankVersion && v.bankVersion !== bankVersion)
        throw Error("Ngân hàng tiến độ không khớp.");
      unique(v.chapters.map((i) => String(i.chapterId)));
      for (const row of [v, ...v.chapters]) {
        if (row.bookmarkCount !== row.bookmarkedScenarios)
          throw Error("Số đánh dấu không nhất quán.");
        if (
          row.totalScenarios !== null &&
          row.practicedScenarios !== null &&
          row.practicedScenarios > row.totalScenarios
        )
          throw Error("Số đã luyện vượt tổng tình huống.");
        if (
          row.practicedScenarios !== null &&
          row.perfectScenarios !== null &&
          row.needReviewCount !== null &&
          row.practicedScenarios !== row.perfectScenarios + row.needReviewCount
        )
          throw Error("Số cần ôn không khớp tiến độ.");
      }
      v.chapters.forEach((c) => {
        if (
          c.navigation.chapterId !== c.chapterId ||
          c.navigation.bankVersion !== v.bankVersion ||
          c.navigation.path !== `/practice/simulations/chapters/${c.chapterId}`
        )
          throw Error("Điều hướng chương không hợp lệ.");
      });
      return v;
    },
  };
}
export const performanceSource = createPerformanceSource(
  resultApi,
  progressApi,
  (s) => {
    const auth = useAuthStore.getState();
    if (
      !auth.accessToken ||
      auth.user?.id !== s.userId ||
      useLicenseStore.getState().selectedLicense !== s.licenseClass
    )
      throw Error("Tài khoản hoặc hạng đã thay đổi. Hãy tải lại dữ liệu.");
  },
);
