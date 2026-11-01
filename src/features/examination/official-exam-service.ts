import { examinationApi } from "@/lib/api";
import type { OfficialExamListItem, OfficialExamListParams, OfficialExamListResult } from "@/features/examination/official-exam-types";

interface BackendStudentExam {
  examId: string;
  examVersionId: string;
  title: string;
  licenseClass: string;
  examType: string;
  bankVersion: string;
  startedAt: string;
  endedAt: string;
  questionCount: number;
  durationSeconds: number;
  maxAttempts: number | null;
  usedAttempts: number;
  remainingAttempts: number | null;
  availability: OfficialExamListItem["availability"];
  participationStatus: OfficialExamListItem["participationStatus"];
  activeSessionId: string | null;
  canStart: boolean;
  canResume: boolean;
  reasonCode: string | null;
  retryAvailableAt: string | null;
}

interface BackendStudentExamList {
  selectedLicenseClass: string;
  tab: string;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  items: BackendStudentExam[];
  serverTime: string;
}

export function mapStudentExam(item: BackendStudentExam): OfficialExamListItem {
  return {
    examId: item.examId,
    examVersionId: item.examVersionId,
    title: item.title,
    licenseClass: item.licenseClass,
    examType: item.examType,
    bankVersion: item.bankVersion,
    questionsCount: item.questionCount,
    durationSeconds: item.durationSeconds,
    startedAt: item.startedAt,
    endedAt: item.endedAt,
    maxAttempts: item.maxAttempts,
    usedAttempts: item.usedAttempts,
    remainingAttempts: item.remainingAttempts,
    availability: item.availability,
    participationStatus: item.participationStatus,
    activeSessionId: item.activeSessionId,
    canStart: item.canStart,
    canResume: item.canResume,
    reasonCode: item.reasonCode,
    retryAvailableAt: item.retryAvailableAt,
  };
}

export async function getOfficialExams(params: OfficialExamListParams): Promise<OfficialExamListResult> {
  const query = new URLSearchParams({tab: params.tab, page: String(params.page ?? 0), size: String(params.size ?? 20)});
  // Server can infer the selected license from Identity. Do not send a stale license selector as authority.
  const data = await examinationApi.get<BackendStudentExamList>(`/v1/student/exams?${query.toString()}`);
  if (!data || !Array.isArray(data.items) || typeof data.totalElements !== "number") {
    throw new Error("Phản hồi danh sách kỳ thi chính thức không hợp lệ.");
  }
  return {
    items: data.items.map(mapStudentExam), total: data.totalElements,
    page: data.page, size: data.size, totalPages: data.totalPages,
    selectedLicenseClass: data.selectedLicenseClass, serverTime: data.serverTime,
  };
}
