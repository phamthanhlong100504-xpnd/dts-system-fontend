import type {
  ResultExamActivityType,
  ResultHistoryItem,
  ResultHistoryOutcome,
} from "@/features/result/result-service";

export type HistoryActivityType = ResultExamActivityType | "UNKNOWN";
export type HistoryResultStatus = ResultHistoryOutcome;
export type HistoryTypeFilter = ResultExamActivityType | "ALL";
export type HistoryResultFilter = ResultHistoryOutcome | "ALL";
export type HistoryPeriodFilter = "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS" | "ALL";

/** Snapshot của Result, không phải state của phiên làm bài. */
export type HistoryListItem = ResultHistoryItem & {
  resultId: string;
  title: string | null;
};

export interface HistoryListParams {
  licenseClass?: string;
  activityType: HistoryTypeFilter;
  result: HistoryResultFilter;
  period: HistoryPeriodFilter;
  from?: string;
  to?: string;
  page: number;
  size: number;
}

export interface HistoryListResult {
  items: HistoryListItem[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}
