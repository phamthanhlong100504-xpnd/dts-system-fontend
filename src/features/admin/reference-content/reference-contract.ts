import { isUuid, record, status, text, type TheoryStatus } from "../theory/theory-contract";
export type ReferenceKind = "traffic-signs" | "memory-tips";
export const SIGN_CATEGORIES = [{ value: "cam", label: "Biển cấm" }, { value: "nguy_hiem", label: "Biển nguy hiểm" }, { value: "hieu_lenh", label: "Biển hiệu lệnh" }, { value: "chi_dan", label: "Biển chỉ dẫn" }, { value: "phu", label: "Biển phụ" }] as const;
export interface ReferenceBase { id: string; sourceId: number; bankVersion: string; status: TheoryStatus; publishedAt?: string | null }
export interface TrafficSignRecord extends ReferenceBase { code: string; name: string; category: string; categoryName: string; meaning: string; quickTip: string; sourceImage: string; mediaFileId: string | null; applicableLicenses: string[] }
export interface MemoryTipRecord extends ReferenceBase { sortOrder: number; title: string; quickRule: string; explanation: string }
export type ReferenceRecord = TrafficSignRecord | MemoryTipRecord;
export interface ReferencePage { content: ReferenceRecord[]; pageNumber: number; pageSize: number; totalElements: number; totalPages: number; last: boolean }
export interface ReferenceFilter { bankVersion: string; keyword: string; category?: string; page: number; size: number }
export interface DraftFields { sourceId: string; bankVersion: string; code: string; name: string; category: string; categoryName: string; meaning: string; quickTip: string; sourceImage: string; mediaFileId: string; applicableLicenses: string[]; sortOrder: string; title: string; quickRule: string; explanation: string }
export function readReference(value: unknown, kind: ReferenceKind): ReferenceRecord {
  const v = record(value); if (!isUuid(v.id) || !Number.isSafeInteger(v.sourceId) || (v.sourceId as number) < 1) throw new Error("Chưa xác định được mã nội dung.");
  const base = { id: v.id, sourceId: v.sourceId as number, bankVersion: text(v.bankVersion, "phiên bản"), status: status(v.status), publishedAt: typeof v.publishedAt === "string" ? v.publishedAt : null };
  if (kind === "memory-tips") {
    if (!Number.isSafeInteger(v.sortOrder) || (v.sortOrder as number) < 1) throw new Error("Mẹo ghi nhớ thiếu thứ tự hợp lệ.");
    return { ...base, sortOrder: v.sortOrder as number, title: text(v.title, "tiêu đề"), quickRule: text(v.quickRule, "quy tắc"), explanation: text(v.explanation, "giải thích") };
  }
  if (!SIGN_CATEGORIES.some(c => c.value === v.category) || !Array.isArray(v.applicableLicenses) || !v.applicableLicenses.length || v.applicableLicenses.some(x => typeof x !== "string" || !x.trim()) || (v.mediaFileId != null && !isUuid(v.mediaFileId))) throw new Error("Phân loại, hạng hoặc tài nguyên biển báo không hợp lệ.");
  return { ...base, code: text(v.code, "mã biển"), name: text(v.name, "tên biển"), category: v.category as string, categoryName: text(v.categoryName, "nhóm biển"), meaning: text(v.meaning, "ý nghĩa"), quickTip: text(v.quickTip, "mẹo nhận biết"), sourceImage: text(v.sourceImage, "ảnh nguồn"), mediaFileId: (v.mediaFileId as string | null) ?? null, applicableLicenses: v.applicableLicenses as string[] };
}
export function readReferencePage(value: unknown, kind: ReferenceKind, filter: ReferenceFilter): ReferencePage {
  const v = record(value);
  for (const key of ["pageNumber", "pageSize", "totalElements", "totalPages"]) if (!Number.isSafeInteger(v[key]) || (v[key] as number) < 0) throw new Error("Hệ thống chưa trả phân trang hợp lệ.");
  if (!Array.isArray(v.content) || v.pageNumber !== filter.page || v.pageSize !== filter.size || typeof v.last !== "boolean" || v.totalPages !== Math.ceil((v.totalElements as number) / (v.pageSize as number)) || v.content.length > (v.pageSize as number)) throw new Error("Phân trang không khớp yêu cầu.");
  const content = v.content.map(x => readReference(x, kind));
  if ((content.length > 0 && filter.page * filter.size + content.length > (v.totalElements as number)) || content.some(x => x.bankVersion !== filter.bankVersion || x.status !== "PUBLISHED" || (kind === "traffic-signs" && filter.category && "category" in x && x.category !== filter.category)) || new Set(content.map(x => x.id)).size !== content.length) throw new Error("Không hiển thị nội dung sai phiên bản hoặc trạng thái.");
  return { content, pageNumber: v.pageNumber as number, pageSize: v.pageSize as number, totalElements: v.totalElements as number, totalPages: v.totalPages as number, last: v.last };
}
export function validateReferenceDraft(f: DraftFields, kind: ReferenceKind): string | null {
  if (!Number.isSafeInteger(Number(f.sourceId)) || Number(f.sourceId) < 1 || !f.bankVersion.trim() || f.bankVersion.length > 64) return "Mã đối chiếu phải là số nguyên dương, phiên bản cần có từ 1 đến 64 ký tự.";
  if (kind === "memory-tips") {
    if (!Number.isSafeInteger(Number(f.sortOrder)) || Number(f.sortOrder) < 1) return "Thứ tự phải là số nguyên dương.";
    if (!f.title.trim() || f.title.length > 255 || !f.quickRule.trim() || !f.explanation.trim()) return "Nhập tiêu đề (tối đa 255 ký tự), quy tắc ghi nhớ và giải thích.";
  } else {
    if (!f.code.trim() || f.code.length > 32 || !f.name.trim() || f.name.length > 255 || !SIGN_CATEGORIES.some(c => c.value === f.category) || !f.categoryName.trim() || f.categoryName.length > 100 || !f.meaning.trim() || !f.quickTip.trim() || !f.sourceImage.trim() || f.sourceImage.length > 255 || !f.applicableLicenses.length) return "Điền đủ thông tin biển báo, nhóm, nội dung, ảnh nguồn và hạng áp dụng theo giới hạn của trường.";
    if (/^https?:/i.test(f.sourceImage) || /X-Amz-/i.test(f.sourceImage)) return "Nhập thông tin ảnh gốc, không dùng địa chỉ ảnh tạm thời.";
    if (f.mediaFileId && !isUuid(f.mediaFileId)) return "Vui lòng chọn ảnh có trạng thái Sẵn sàng từ thư viện.";
  }
  return null;
}
