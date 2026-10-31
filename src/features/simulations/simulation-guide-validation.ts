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
  if (
    !content ||
    !content.overview ||
    !content.steps ||
    !content.scoring ||
    !content.recognition ||
    !content.comparison ||
    !content.notes ||
    !content.cta
  )
    throw new Error("Thiếu cấu trúc nội dung SIM-06.");
  const arrays = [
    content.steps.items,
    content.scoring.items,
    content.recognition.items,
    content.notes.items,
  ];
  for (const [n, items] of arrays.entries())
    if (!Array.isArray(items) || items.length !== [4, 3, 2, 4][n])
      throw new Error("Số khu vực hướng dẫn không đúng cấu trúc.");
  for (const mode of [content.comparison.practice, content.comparison.exam])
    if (
      !mode ||
      !Array.isArray(mode.items) ||
      mode.items.length < 1 ||
      mode.items.length > 10
    )
      throw new Error("Nội dung so sánh chế độ không hợp lệ.");
  for (const items of [
    ...arrays,
    content.comparison.practice.items,
    content.comparison.exam.items,
    [content.recognition.policy],
  ]) {
    const keys = new Set<string>();
    for (const i of items) {
      if (!i || typeof i.key !== "string" || !i.key || keys.has(i.key))
        throw new Error("Mã mục nội dung bị thiếu hoặc trùng.");
      keys.add(i.key);
      text(i.title);
      text(i.description);
    }
  }
  for (const f of guideTextFields(content)) text(f.value);
}
export function guidePublishErrors(content: GuideContent) {
  validateGuideContent(content);
  return guideTextFields(content)
    .filter((f) => !f.value.trim())
    .map((f) => `${f.group}: ${f.label}`);
}
export function validateGuideBank(bank: GuideBankInfo) {
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
}
export function validateGuideHistory(data: GuideHistory, actorId: string) {
  if (!data || data.actorId !== actorId || !Array.isArray(data.versions))
    throw new Error("Lịch sử không khớp tài khoản.");
  const revisions = new Set<number>();
  for (const version of data.versions) {
    validateGuideRevision(version);
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
      JSON.stringify(data.draft.content) !==
        JSON.stringify(data.published.content))
  );
}
