import { guideEqual } from "./simulation-guide-content";
import {
  parseGuideWire,
  wireGuideContent,
  wireGuideBank,
  wireGuideRevision,
  wireGuideCurrent,
  wireGuideAdmin,
  wireGuideHistory,
} from "./simulation-guide-wire";
import { guideTextFields } from "./simulation-guide-fields";
import type {
  GuideAdminSnapshot,
  GuideBankInfo,
  GuideContent,
  GuideHistory,
  GuideRevision,
  PublishedGuide,
} from "./simulation-guide-types";
function integer(n: number) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("Phiên bản hoặc số liệu hướng dẫn không hợp lệ.");
}
function text(s: string) {
  if (typeof s !== "string" || s.length > 12000)
    throw new Error("Nội dung hướng dẫn không hợp lệ.");
}
function timestamp(s: string) {
  if (typeof s !== "string" || !s || !Number.isFinite(Date.parse(s)))
    throw new Error("Thời điểm nội dung không hợp lệ.");
}
export function validateGuideContent(content: GuideContent) {
  parseGuideWire(wireGuideContent, content);
}
export function guidePublishErrors(content: GuideContent) {
  try {
    validateGuideContent(content);
  } catch (error) {
    return [error instanceof Error ? error.message : "Nội dung chưa hợp lệ."];
  }
  return guideTextFields(content)
    .filter((f) => !f.value.trim())
    .map((f) => `${f.group}: ${f.label}`);
}
export function validateGuideBank(bank: GuideBankInfo) {
  parseGuideWire(wireGuideBank, bank);
  if (
    !bank ||
    !bank.bankVersion ||
    !Array.isArray(bank.scoringLabels) ||
    bank.scoringLabels.length !== 7 ||
    !bank.mockExam ||
    typeof bank.mockExam.available !== "boolean"
  )
    throw new Error("Thiếu thông tin ngân hàng hoặc khả năng thi thử.");
  integer(bank.chapterCount);
  integer(bank.scenarioCount);
  for (const label of bank.scoringLabels) {
    text(label);
    if (!label.trim()) throw new Error("Thiếu nhãn minh họa chấm điểm.");
  }
  text(bank.mockExam.notice);
  if (!bank.mockExam.notice.trim())
    throw new Error("Thiếu thông báo trạng thái thi thử.");
}
export function validateGuideRevision(doc: GuideRevision) {
  parseGuideWire(wireGuideRevision, doc);
  if (
    !doc ||
    doc.pageKey !== "SIMULATION_GUIDE" ||
    doc.schemaVersion !== 1 ||
    !["DRAFT", "PUBLISHED", "ARCHIVED"].includes(doc.status)
  )
    throw new Error("Phiên bản hướng dẫn không được hỗ trợ.");
  integer(doc.revision);
  if (doc.revision < 1 || !doc.updatedBy)
    throw new Error("Thiếu thông tin chỉnh sửa.");
  timestamp(doc.updatedAt);
  validateGuideContent(doc.content);
  if (doc.status === "PUBLISHED" || doc.status === "ARCHIVED") {
    if (
      !doc.publishedAt ||
      !doc.publishedBy ||
      guidePublishErrors(doc.content).length
    )
      throw new Error("Bản công bố thiếu nội dung hoặc thông tin xác nhận.");
    timestamp(doc.publishedAt);
  }
}
export function validatePublishedGuide(data: PublishedGuide) {
  parseGuideWire(wireGuideCurrent, data);
  if (!data || !data.scope || !data.scope.bankVersion)
    throw new Error("Thiếu phạm vi hướng dẫn.");
  validateGuideRevision(data.document);
  validateGuideBank(data.bank);
  if (
    data.document.status !== "PUBLISHED" ||
    data.scope.bankVersion !== data.bank.bankVersion
  )
    throw new Error("Học viên chỉ được đọc bản công bố của đúng ngân hàng.");
}
export function guideEditableContent(data: GuideAdminSnapshot): GuideContent {
  const content =
    data.draft?.content ?? data.published?.content ?? data.template;
  if (!content) throw new Error("Backend chưa cung cấp cấu trúc bản nháp.");
  return content;
}
export function validateGuideAdmin(data: GuideAdminSnapshot, actorId: string) {
  parseGuideWire(wireGuideAdmin, data);
  if (!data || data.actorId !== actorId)
    throw new Error("Dữ liệu quản trị không khớp tài khoản.");
  integer(data.revision);
  validateGuideBank(data.bank);
  for (const [status, doc] of [
    ["DRAFT", data.draft],
    ["PUBLISHED", data.published],
  ] as const)
    if (doc) {
      validateGuideRevision(doc);
      if (doc.status !== status || doc.revision > data.revision)
        throw new Error("Trạng thái phiên bản quản trị không nhất quán.");
    }
  if (data.draft && data.draft.revision !== data.revision)
    throw new Error("Revision bản nháp không khớp phiên đang chỉnh sửa.");
  validateGuideContent(guideEditableContent(data));
  validateGuideRevision(data.preview);
  if (
    !data.draft ||
    data.preview.status !== "DRAFT" ||
    data.preview.revision !== data.revision ||
    data.preview.updatedAt !== data.draft.updatedAt ||
    data.preview.updatedBy !== data.draft.updatedBy
  )
    throw new Error("Bản xem trước không khớp bản nháp đã lưu.");
  const projected = structuredClone(data.draft.content);
  projected.comparison.exam = structuredClone(
    data.preview.content.comparison.exam,
  );
  if (!guideEqual(projected, data.preview.content))
    throw new Error("Bản xem trước thay đổi ngoài chính sách hiển thị.");
}
export function validateGuideHistory(data: GuideHistory, actorId: string) {
  parseGuideWire(wireGuideHistory, data);
  if (!data || data.actorId !== actorId || !Array.isArray(data.versions))
    throw new Error("Lịch sử không khớp tài khoản.");
  const revisions = new Set<number>();
  let previous = Infinity;
  for (const version of data.versions) {
    validateGuideRevision(version);
    if (version.status === "DRAFT" || version.revision >= previous)
      throw new Error(
        "Lịch sử chỉ chứa bản công bố/lưu trữ theo thứ tự mới nhất.",
      );
    previous = version.revision;
    if (revisions.has(version.revision))
      throw new Error("Lịch sử trùng phiên bản.");
    revisions.add(version.revision);
  }
}

export function guideDraftNeedsPublication(data: GuideAdminSnapshot) {
  return (
    !!data.draft &&
    (!data.published ||
      data.draft.revision !== data.published.revision ||
      !guideEqual(data.draft.content, data.published.content))
  );
}
