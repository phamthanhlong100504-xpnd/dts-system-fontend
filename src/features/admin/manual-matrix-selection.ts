import type { ExamStructureSection } from "@/features/admin/admin-examination-service";
import type { OfficialBankChapter, OfficialBankQuestion } from "@/features/admin/official-bank-service";

/** A section of an official examination structure. The critical section has no chapter constraint. */
export interface ManualSectionQuota {
  code: string;
  title: string;
  questionCount: number;
  critical: boolean;
  chapterIds: string[];
}

export interface ManualCandidate {
  id: string;
  isCritical: boolean;
  chapterIds: string[];
  chapterNumber?: number;
}

export interface ManualSelectionState {
  valid: boolean;
  complete: boolean;
  assignedBySection: number[];
  unmatchedIds: string[];
  message: string;
}

export function getManualSectionQuotas(sections: ExamStructureSection[]): ManualSectionQuota[] {
  return sections.map((section) => ({
    code: section.code,
    title: section.title,
    questionCount: section.questionCount,
    critical: (section.criticalQuestionCount ?? 0) > 0,
    chapterIds: section.chapterIds ?? [],
  }));
}

export function resolveManualQuestionChapterIds(
  question: Pick<OfficialBankQuestion, "chapterId" | "chapterIds" | "chapterNumber">,
  chapters: OfficialBankChapter[],
): string[] {
  const sources = new Set([...(question.chapterIds ?? []), question.chapterId].filter((id): id is string => Boolean(id)));
  const matched = chapters.filter((chapter) =>
    sources.has(chapter.id) ||
    (chapter.sourceChapterId !== undefined && sources.has(chapter.sourceChapterId)) ||
    (question.chapterNumber !== undefined && chapter.number === question.chapterNumber),
  );
  return matched.map((chapter) => chapter.id);
}

function eligible(candidate: ManualCandidate, section: ManualSectionQuota): boolean {
  if (candidate.isCritical || section.critical) return candidate.isCritical && section.critical;
  return candidate.chapterIds.some((id) => section.chapterIds.includes(id));
}

export function evaluateManualMatrixSelection(
  selectedIds: string[],
  candidates: ManualCandidate[],
  sections: ManualSectionQuota[],
): ManualSelectionState {
  if (sections.length === 0 || sections.some((section) =>
    !Number.isInteger(section.questionCount) || section.questionCount < 1 ||
    (section.critical ? section.chapterIds.length > 0 : section.chapterIds.length === 0))) {
    return { valid: false, complete: false, assignedBySection: sections.map(() => 0), unmatchedIds: selectedIds, message: "Chưa có ma trận phần thi hợp lệ." };
  }
  const questionsById = new Map(candidates.map((question) => [question.id, question]));
  const slots = sections.flatMap((section, index) => Array.from({ length: section.questionCount }, () => index));
  const owners = slots.map(() => -1);
  const unmatchedIds: string[] = [];
  const usedIds = new Set<string>();

  function assign(questionIndex: number, visited: Set<number>): boolean {
    const question = questionsById.get(selectedIds[questionIndex]);
    if (!question) return false;
    for (let slot = 0; slot < slots.length; slot++) {
      if (visited.has(slot) || !eligible(question, sections[slots[slot]])) continue;
      visited.add(slot);
      if (owners[slot] === -1 || assign(owners[slot], visited)) {
        owners[slot] = questionIndex;
        return true;
      }
    }
    return false;
  }

  for (let index = 0; index < selectedIds.length; index++) {
    const id = selectedIds[index];
    if (usedIds.has(id) || !questionsById.has(id) || !assign(index, new Set<number>())) {
      unmatchedIds.push(id);
    }
    usedIds.add(id);
  }
  const assignedBySection = sections.map((_, index) => owners.filter((owner, slot) => owner !== -1 && slots[slot] === index).length);
  const valid = unmatchedIds.length === 0 && selectedIds.length <= slots.length;
  const complete = valid && selectedIds.length === slots.length && assignedBySection.every((count, index) => count === sections[index].questionCount);
  return {
    valid,
    complete,
    assignedBySection,
    unmatchedIds,
    message: !valid ? "Các câu đã chọn không thể phân bổ đúng ma trận. Hãy kiểm tra nhóm chương hoặc câu điểm liệt."
      : complete ? "Đã chọn đủ câu theo từng nhóm chương và câu điểm liệt."
      : `Đã chọn ${selectedIds.length}/${slots.length} câu. Hãy bổ sung đúng chỉ tiêu từng phần thi.`,
  };
}
