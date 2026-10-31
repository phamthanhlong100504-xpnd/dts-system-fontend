import { contentBuilderApi } from "@/lib/api";
import { isUuid, record, text, theoryActor } from "./theory/theory-contract";

export interface OfficialBankChapter { id: string; title: string; number?: number; sourceChapterId?: string }
export interface OfficialBankQuestion {
  id: string; content: string; chapterId?: string; chapterIds: string[]; chapterNumber?: number; isCritical: boolean;
  options: Array<{ id?: string; text: string; isCorrect?: boolean }>; explanation?: string; mediaFileIds: string[]; displayNo?: string | number;
  status?: string; contentVersion?: string; optionIds?: string[]; questionType?: string;
}
export interface OfficialBank { bankVersion: string; licenseClass: string; chapters: OfficialBankChapter[]; questions: OfficialBankQuestion[] }
const ids = (v: unknown, label: string): string[] => {
  if (!Array.isArray(v) || v.some((x) => !isUuid(x)) || new Set(v).size !== v.length) throw new Error(`Thông tin ${label} của ngân hàng chưa hợp lệ.`);
  return v;
};
/** Existing endpoint explicitly permits a verified ROLE_ADMIN + questions:read JWT.
 * No service credential is ever generated or sent by the browser.
 */
export async function fetchOfficialBank(bankVersion: string, licenseClass: string, signal?: AbortSignal): Promise<OfficialBank> {
  const actor = theoryActor("questions"); const version = bankVersion.trim(), license = licenseClass.trim().toUpperCase();
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(version) || !license) throw new Error("Chưa chọn hạng và phiên bản ngân hàng hợp lệ.");
  const v = record(await contentBuilderApi.get<unknown>("/v1/internal/questions/bank", { params: { bankVersion: version, licenseClass: license }, signal })); actor.assert();
  if (v.bankVersion !== version || v.licenseClass !== license || !Array.isArray(v.chapters) || !Array.isArray(v.questions)) throw new Error("Ngân hàng trả sai hạng, phiên bản hoặc cấu trúc.");
  const chapters = v.chapters.map((value) => {
    const c = record(value);
    if (!isUuid(c.id) || c.bankVersion !== version || !Number.isInteger(c.sourceChapterId) || (c.sourceChapterId as number) < 1) throw new Error("Nguồn chương không hợp lệ.");
    return { id: c.id, title: `Chương nguồn ${c.sourceChapterId}`, number: c.sourceChapterId as number, sourceChapterId: String(c.sourceChapterId) };
  });
  if (new Set(chapters.map((c) => c.id)).size !== chapters.length) throw new Error("Dữ liệu có chương bị trùng. Vui lòng tải lại.");
  const chapterSet = new Set(chapters.map((c) => c.id));
  const questions = v.questions.map((value) => {
    const q = record(value); if (!isUuid(q.id) || q.status !== "PUBLISHED" || typeof q.isCritical !== "boolean" || typeof q.contentVersion !== "string" || !/^[0-9a-f]{64}$/i.test(q.contentVersion)) throw new Error("Thông tin câu hỏi chưa đầy đủ. Vui lòng tải lại ngân hàng.");
    const chapterIds = ids(q.chapterIds, "chương học"), optionIds = ids(q.optionIds, "đáp án"), mediaFileIds = ids(q.mediaFileIds, "ảnh minh họa");
    if (!chapterIds.length || chapterIds.some((id) => !chapterSet.has(id)) || optionIds.length < 2) throw new Error("Câu hỏi chưa được xếp đúng chương hoặc thiếu đáp án.");
    return {
      id: q.id, content: "", chapterId: chapterIds[0], chapterIds, chapterNumber: chapters.find((c) => c.id === chapterIds[0])?.number,
      isCritical: q.isCritical, options: [], mediaFileIds, status: q.status, contentVersion: q.contentVersion, optionIds, questionType: text(q.questionType, "loại câu nguồn")
    } satisfies OfficialBankQuestion;
  });
  if (new Set(questions.map((q) => q.id)).size !== questions.length) throw new Error("Ngân hàng có câu hỏi bị trùng. Vui lòng tải lại.");
  return { bankVersion: version, licenseClass: license, chapters, questions };
}
/** Accepts a bounded subset for the browser; Examination callers retain the same API. */
export async function fetchOfficialBankDetails(bank: OfficialBank, signal?: AbortSignal): Promise<OfficialBank> {
  const actor = theoryActor("questions");
  if (!bank.questions.length) return bank;
  const details = new Map<string, Record<string, unknown>>();
  const requestedIds = bank.questions.map((q) => q.id);
  if (new Set(requestedIds).size !== requestedIds.length) throw new Error("Yêu cầu câu nguồn bị trùng.");
  const batches: string[][] = []; for (let start = 0; start < requestedIds.length; start += 40) batches.push(requestedIds.slice(start, start + 40));
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(3, batches.length) }, async () => {
    while (cursor < batches.length) {
      actor.assert(); const batch = batches[cursor++];
      const data = await contentBuilderApi.post<unknown>("/v1/internal/questions/batch", batch, { params: { licenseClass: bank.licenseClass }, signal }); actor.assert();
      if (!Array.isArray(data) || data.length !== batch.length) throw new Error("Nguồn chưa trả đủ nội dung của trang đang xem.");
      for (const value of data) { const q = record(value); if (!isUuid(q.id) || !batch.includes(q.id) || details.has(q.id)) throw new Error("Danh sách câu hỏi chưa chính xác. Vui lòng tải lại."); details.set(q.id, q); }
    }
  }));
  const questions = bank.questions.map((meta) => {
    const q = details.get(meta.id); if (!q || q.status !== "PUBLISHED" || q.contentVersion !== meta.contentVersion || q.isCritical !== meta.isCritical || q.type !== meta.questionType) throw new Error("Ngân hàng đã thay đổi hoặc chưa khớp hạng GPLX. Vui lòng tải lại.");
    const media = ids(q.mediaFileIds, "ảnh minh họa"); if (media.join() !== meta.mediaFileIds.join()) throw new Error("Ảnh minh họa chưa khớp với phiên bản câu hỏi. Vui lòng tải lại.");
    if (!Array.isArray(q.options)) throw new Error("Nguồn thiếu đáp án.");
    const options = q.options.map((value) => { const o = record(value); if (!isUuid(o.id) || typeof o.isCorrect !== "boolean") throw new Error("Đáp án nguồn không hợp lệ."); return { id: o.id, text: text(o.content, "nội dung đáp án"), isCorrect: o.isCorrect }; });
    if (new Set(options.map((o) => o.id)).size !== options.length || options.length !== meta.optionIds?.length || options.some((o) => !meta.optionIds?.includes(o.id))) throw new Error("Đáp án chưa khớp với câu hỏi. Vui lòng tải lại.");
    const ordered = meta.optionIds!.map((id) => options.find((o) => o.id === id)!);
    const explanation = q.explanations && typeof q.explanations === "object" && "text" in q.explanations && typeof q.explanations.text === "string" ? q.explanations.text : undefined;
    return { ...meta, content: text(q.content, "nội dung câu chuẩn"), options: ordered, explanation };
  });
  return { ...bank, questions };
}
