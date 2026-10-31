import { ApiError, examinationApi } from "@/lib/api";
import { contentFingerprint, isUuid, record, text } from "../theory/theory-contract";
import { examinationActor } from "./examination-guard";
import { readExaminationCollection } from "./examination-pagination";

export type ExamConfigurationKind = "structure" | "rule" | "criteria";
const configs = {
  structure: { resource: "exam_structure", route: "exam-structures", field: "examStructureId" },
  rule: { resource: "exam_rule", route: "exam-rules", field: "examRuleId" },
  criteria: { resource: "exam_criteria", route: "exam-criterias", field: "examCriteriaId" },
} as const;
export interface ExamConfigurationReference { examId: string; examTitle: string; versionId: string; title: string; versionNo: number; status: string }
export async function readConfigurationReferences(kind: ExamConfigurationKind, id: string, signal?: AbortSignal): Promise<ExamConfigurationReference[]> {
  if (!isUuid(id)) throw new Error("Mã cấu hình không hợp lệ.");
  const actor = examinationActor("exam_version"), parentActor = examinationActor("exam");
  const assert = () => { actor.assert(); parentActor.assert(); };
  const exams = await readExaminationCollection<unknown>("/v1/exams", assert, signal, 500);
  const references: ExamConfigurationReference[] = [];
  for (let offset = 0; offset < exams.length; offset += 5) {
    await Promise.all(exams.slice(offset, offset + 5).map(async raw => {
      const exam = record(raw); if (!isUuid(exam.id)) throw new Error("Thông tin kỳ thi chưa đầy đủ.");
      const examId = exam.id, examTitle = text(exam.title, "tên kỳ thi");
      const versions = await readExaminationCollection<unknown>(`/v1/exams/${examId}/versions`, assert, signal, 1000);
      for (const rawVersion of versions) {
        const v = record(rawVersion);
        if (!isUuid(v.id) || v.examId !== examId || !Number.isInteger(v.versionNo) || !["DRAFT", "PUBLISHED", "ARCHIVED"].includes(v.status as string)) throw new Error("Thông tin phiên bản đề thi chưa đầy đủ.");
        if (v[configs[kind].field] === id) references.push({ examId, examTitle, versionId: v.id, title: text(v.title, "tên phiên bản"), versionNo: v.versionNo as number, status: v.status as string });
      }
    }));
  }
  assert(); return references.sort((a, b) => a.examTitle.localeCompare(b.examTitle, "vi-VN") || b.versionNo - a.versionNo);
}
export async function requireMutableConfiguration(kind: ExamConfigurationKind, id: string, action: "update" | "delete", expectedFingerprint?: string) {
  if (!isUuid(id)) throw new Error("Mã cấu hình không hợp lệ.");
  const descriptor = configs[kind], actor = examinationActor(descriptor.resource, action);
  const current = record(await examinationApi.get<unknown>(`/v1/${descriptor.route}/${id}`)); actor.assert();
  if (current.id !== id || current.status !== (kind === "structure" ? "DRAFT" : "ACTIVE")) throw new ApiError("Cấu hình này hiện chỉ được xem. Vui lòng tạo bản cấu hình mới.", 409);
  if (action === "update" && (!expectedFingerprint || contentFingerprint(current) !== expectedFingerprint)) throw new ApiError("Cấu hình đã thay đổi. Nội dung đang nhập được giữ lại, vui lòng mở lại bản mới nhất trước khi lưu.", 409);
  const references = await readConfigurationReferences(kind, id); actor.assert();
  if (references.some(r => action === "delete" || r.status === "PUBLISHED" || r.status === "ARCHIVED")) throw new ApiError("Cấu hình đang được đề thi sử dụng. Vui lòng tạo bản cấu hình mới.", 409, "CONFIGURATION_IN_USE");
  return { current, actor };
}
