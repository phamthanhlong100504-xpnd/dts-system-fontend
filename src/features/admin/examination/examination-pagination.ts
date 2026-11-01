import { examinationApi } from "@/lib/api";
import { record } from "../theory/theory-contract";

export interface ExaminationPage<T> { items: T[]; page: number; size: number; totalElements: number; totalPages: number }
export function readExaminationPage<T>(raw: unknown, expectedPage: number): ExaminationPage<T> {
  const v = record(raw), spring = Array.isArray(v.content);
  const items = spring ? v.content : v.items, page = spring ? v.number : v.page, size = v.size, total = v.totalElements;
  if (!Array.isArray(items) || !Number.isSafeInteger(page) || page !== expectedPage || !Number.isSafeInteger(size) || (size as number) <= 0 || !Number.isSafeInteger(total) || (total as number) < 0 || items.length > (size as number) || (items.length && expectedPage * (size as number) + items.length > (total as number))) throw new Error("Chưa thể đọc đầy đủ danh sách. Vui lòng tải lại.");
  const pages = Math.ceil((total as number) / (size as number));
  if (spring && v.totalPages !== pages) throw new Error("Thông tin số trang chưa nhất quán. Vui lòng tải lại.");
  return { items: items as T[], page: page as number, size: size as number, totalElements: total as number, totalPages: pages };
}
export async function readExaminationCollection<T>(path: string, assert: () => void, signal?: AbortSignal, maxItems = 10000): Promise<T[]> {
  const rows: T[] = []; let total: number | undefined;
  for (let page = 0; page < 100; page++) {
    assert();
    const next = readExaminationPage<T>(await examinationApi.get<unknown>(path, { params: { page, size: 100 }, signal }), page);
    assert();
    if (next.totalElements > maxItems) throw new Error("Chưa thể kiểm tra đầy đủ danh sách quá lớn. Vui lòng thử lại sau.");
    if (total !== undefined && next.totalElements !== total) throw new Error("Danh sách vừa thay đổi. Vui lòng tải lại trước khi tiếp tục.");
    total = next.totalElements; rows.push(...next.items);
    if (page + 1 >= next.totalPages) {
      if (rows.length !== total) throw new Error("Chưa tải đủ dữ liệu. Vui lòng thử lại.");
      return rows;
    }
  }
  throw new Error("Danh sách quá lớn để kiểm tra đầy đủ. Vui lòng thử lại sau.");
}
