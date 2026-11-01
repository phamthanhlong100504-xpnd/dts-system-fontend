import { examinationApi } from "@/lib/api";
import { mapStudentExam } from "@/features/examination/official-exam-service";
import type { OfficialExamDetail, OfficialExamRuleSummary } from "@/features/examination/official-exam-detail-types";

type StudentExam = Parameters<typeof mapStudentExam>[0];
interface BackendStudentExamDetail {
  exam: StudentExam;
  instructions: string | null;
  rules: OfficialExamRuleSummary;
  grading: {totalScore: number; passScore: number; gradingMethod: string; passingCorrectAnswers: number; criticalQuestionCount: number};
  serverTime: string;
}

export async function getOfficialExamDetail(examId: string, _licenseClass: string, examVersionId?: string): Promise<OfficialExamDetail> {
  const query = examVersionId ? `?examVersionId=${encodeURIComponent(examVersionId)}` : "";
  const data = await examinationApi.get<BackendStudentExamDetail>(`/v1/student/exams/${encodeURIComponent(examId)}${query}`);
  if (!data?.exam?.examId || !data?.exam?.examVersionId) {
    throw new Error("Phản hồi chi tiết kỳ thi không hợp lệ.");
  }
  const exam = mapStudentExam(data.exam);
  return { ...exam, rule: data.rules, instructions: data.instructions, grading: data.grading, serverTime: data.serverTime };
}
