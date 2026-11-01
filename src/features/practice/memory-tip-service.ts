
import { practiceApi } from "@/lib/api";
import type { MemoryTipListResult } from "@/features/practice/memory-tip-types";

export async function getMemoryTips(): Promise<MemoryTipListResult> {
  const data = await practiceApi.get<MemoryTipListResult>("/v1/memory-tips");

  if (!data || !Array.isArray(data.items) || typeof data.totalElements !== "number") {
    throw new Error("Phản hồi danh sách mẹo ghi nhớ không hợp lệ.");
  }

  return data;
}
