import type { ExamCriteriaPayload, ExamRulePayload, ExamStructureSection } from "../admin-examination-service";
export function validateExamRule(value: ExamRulePayload): string | null {
  if (!value.title.trim() || value.title.length > 255) return "Tên quy chế cần có từ 1 đến 255 ký tự.";
  const numbers = [value.maxRetry, value.retryIntervalSeconds, value.durationSeconds, value.gracePeriodSeconds, value.maxPauseCount, value.maxPauseDurationSeconds, value.resumeTimeoutSeconds, value.maxTabSwitchCount];
  if (numbers.some(x => !Number.isSafeInteger(x) || x < 0) || value.durationSeconds <= 0) return "Thời gian và số lần phải là số nguyên không âm, thời gian thi cần lớn hơn 0.";
  if (!value.allowRetry && value.maxRetry !== 0) return "Đặt số lần làm lại bằng 0 khi không cho phép làm lại.";
  if (value.allowPause && !value.allowResume) return "Cần cho phép tiếp tục khi cho phép tạm dừng bài thi.";
  if (value.shuffleQuestionsAcrossSections && (value.shuffleQuestionsWithinSection || value.shuffleSections)) return "Chỉ chọn một cách trộn câu hỏi, không trộn toàn bộ cùng với trộn theo phần.";
  if (!value.preventTabSwitch && value.maxTabSwitchCount !== 0) return "Đặt số lần chuyển tab bằng 0 khi không áp dụng giám sát chuyển tab.";
  if (!["IMMEDIATE", "AFTER_SUBMIT", "AFTER_EXAM_END", "MANUAL"].includes(value.resultReleaseMode)) return "Vui lòng chọn chế độ công bố kết quả hợp lệ.";
  if (value.timeZone) { try { new Intl.DateTimeFormat("vi-VN", { timeZone: value.timeZone }); } catch { return "Múi giờ chưa hợp lệ."; } }
  return null;
}
export function validateExamCriteria(value: ExamCriteriaPayload): string | null {
  const c = value.criteria;
  if (!value.title.trim() || value.title.length > 255) return "Vui lòng nhập tên tiêu chí, tối đa 255 ký tự.";
  if (!Number.isSafeInteger(c.passScore) || !Number.isSafeInteger(c.totalScore) || c.passScore < 0 || c.totalScore <= 0 || c.passScore > c.totalScore) return "Điểm đạt cần nằm trong khoảng từ 0 đến tổng điểm, tổng điểm phải lớn hơn 0.";
  if (!["SUM", "WEIGHTED", "PERCENTAGE", "BEST_OF", "AVERAGE"].includes(c.gradingMethod)) return "Phương pháp chấm chưa hợp lệ.";
  if (c.rounding && (!Number.isSafeInteger(c.rounding.precision) || c.rounding.precision < 0)) return "Số chữ số làm tròn phải là số nguyên không âm.";
  if (c.penalties?.some(p => !Number.isFinite(p.deduct) || p.deduct < 0)) return "Điểm trừ phải là số không âm.";
  if (c.sectionRules?.some(r => !r.sectionId.trim() || !Number.isSafeInteger(r.minScore) || r.minScore < 0)) return "Điền đủ mã phần và điểm tối thiểu hợp lệ.";
  return null;
}
export function validateExamStructure(title: string, sections: ExamStructureSection[]): string | null {
  if (!title.trim() || title.length > 255 || !sections.length) return "Nhập tên cấu trúc và ít nhất một phần thi.";
  if (sections.some(s => !s.code.trim() || !s.title.trim() || !Number.isSafeInteger(s.questionCount) || s.questionCount <= 0 || !Number.isSafeInteger(s.score) || s.score < 0 || !Number.isSafeInteger(s.order) || s.order < 0)) return "Mỗi phần cần có mã, tên, số câu nguyên dương, điểm và thứ tự hợp lệ.";
  if (new Set(sections.map(s => s.code.trim())).size !== sections.length || new Set(sections.map(s => s.order)).size !== sections.length) return "Mã phần và thứ tự không được trùng nhau.";
  if (sections.some(s => s.criticalQuestionCount !== undefined && (!Number.isSafeInteger(s.criticalQuestionCount) || s.criticalQuestionCount < 0 || s.criticalQuestionCount > s.questionCount))) return "Số câu điểm liệt chưa hợp lệ.";
  return null;
}
