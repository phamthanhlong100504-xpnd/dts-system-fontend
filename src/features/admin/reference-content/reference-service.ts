import { contentBuilderApi } from "@/lib/api";
import { isUuid, theoryActor } from "../theory/theory-contract";
import { readReference, readReferencePage, validateReferenceDraft, type DraftFields, type ReferenceFilter, type ReferenceKind } from "./reference-contract";
export async function listReference(kind: ReferenceKind, filter: ReferenceFilter, signal?: AbortSignal) {
  const actor = theoryActor(kind); if (!filter.bankVersion.trim() || filter.bankVersion.length > 64) throw new Error("Cần nhập phiên bản dữ liệu hợp lệ.");
  const raw = await contentBuilderApi.get<unknown>(`/v1/${kind}`, { params: { bankVersion: filter.bankVersion, keyword: filter.keyword.trim() || undefined, category: kind === "traffic-signs" ? filter.category || undefined : undefined, page: filter.page, size: filter.size }, signal }); actor.assert(); return readReferencePage(raw, kind, filter);
}
export async function detailReference(kind: ReferenceKind, id: string, bankVersion: string, signal?: AbortSignal) {
  const actor = theoryActor(kind); if (!isUuid(id)) throw new Error("Mã nội dung không hợp lệ.");
  const result = readReference(await contentBuilderApi.get<unknown>(`/v1/${kind}/${id}`, { signal }), kind); actor.assert();
  if (result.id !== id || result.bankVersion !== bankVersion || result.status !== "PUBLISHED") throw new Error("Nội dung không thuộc phiên bản đã chọn."); return result;
}
export async function createReferenceDraft(kind: ReferenceKind, f: DraftFields) {
  const invalid = validateReferenceDraft(f, kind); if (invalid) throw new Error(invalid); const actor = theoryActor(kind, "create");
  const common = { sourceId: Number(f.sourceId), bankVersion: f.bankVersion.trim() };
  const body = kind === "traffic-signs" ? { ...common, code: f.code.trim(), name: f.name.trim(), category: f.category, categoryName: f.categoryName.trim(), meaning: f.meaning, quickTip: f.quickTip, sourceImage: f.sourceImage.trim(), mediaFileId: f.mediaFileId || null, applicableLicenses: f.applicableLicenses } : { ...common, sortOrder: Number(f.sortOrder), title: f.title.trim(), quickRule: f.quickRule, explanation: f.explanation };
  const result = readReference(await contentBuilderApi.post<unknown>(`/v1/${kind}/draft`, body), kind); actor.assert();
  if (result.status !== "DRAFT" || result.bankVersion !== common.bankVersion || result.sourceId !== common.sourceId) throw new Error("Hệ thống chưa xác nhận đúng bản nháp vừa gửi."); return result;
}
