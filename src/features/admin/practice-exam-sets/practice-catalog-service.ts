import { practiceApi } from "@/lib/api";
import { record } from "../theory/theory-contract";
import { practiceCatalogActor } from "../examination/examination-guard";

export interface PracticePolicySummary { examType: string; totalQuestions: number; durationMinutes: number; passingScore: number; criticalQuestionCount: number }
const licenseCode = (value: string) => { const v = value.trim().toUpperCase(); if (!/^[A-Z][A-Z0-9]{0,9}$/.test(v)) throw new Error("Vui lòng chọn hạng GPLX hợp lệ."); return v; };
const integer = (v: unknown, positive = false): v is number => Number.isSafeInteger(v) && (v as number) >= (positive ? 1 : 0);
// The student preset listing synchronizes the requesting account's active attempt.
// No Admin adapter may call that endpoint, even when attempt fields would be discarded.
export async function fetchPracticePolicySummary(licenseClass: string, signal?: AbortSignal): Promise<PracticePolicySummary> {
  const actor = practiceCatalogActor(), license = licenseCode(licenseClass);
  const v = record(await practiceApi.get<unknown>("/v1/exams/config", { params: { examType: license }, signal })); actor.assert();
  if (v.examType !== license || !integer(v.totalQuestions, true) || !integer(v.durationMinutes, true) || !integer(v.passingScore, true) || !integer(v.criticalQuestionCount) || v.passingScore > v.totalQuestions || v.criticalQuestionCount > v.totalQuestions) throw new Error("Chưa xác minh được cấu hình thi của hạng này. Vui lòng tải lại.");
  return { examType: license, totalQuestions: v.totalQuestions, durationMinutes: v.durationMinutes, passingScore: v.passingScore, criticalQuestionCount: v.criticalQuestionCount };
}
