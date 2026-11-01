import type { ExamVersionItem } from "../admin-examination-service";
const diffFields: Array<[keyof ExamVersionItem, string]> = [["title", "Tên phiên bản"], ["licenseClass", "Hạng GPLX"], ["bankVersion", "Ngân hàng câu hỏi"], ["selectionMode", "Hình thức lập đề"], ["examStructureId", "Cấu trúc đề"], ["examRuleId", "Quy chế"], ["examCriteriaId", "Tiêu chí chấm"], ["startedAt", "Thời gian bắt đầu"], ["endedAt", "Thời gian kết thúc"]];
export function examVersionChanges(previous: ExamVersionItem, current: ExamVersionItem): string[] {
  const changes = diffFields.filter(([key]) => previous[key] !== current[key]).map(([, label]) => label);
  if (previous.manualQuestionIds && current.manualQuestionIds && previous.manualQuestionIds.join() !== current.manualQuestionIds.join()) changes.push("Danh sách hoặc thứ tự câu hỏi");
  if (previous.metadata?.instructions !== current.metadata?.instructions) changes.push("Hướng dẫn làm bài");
  return changes;
}
