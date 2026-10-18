import { contentBuilderApi } from "@/lib/api";

type PagedResponse<T> = {
  content?: T[];
  totalPages?: number;
  number?: number;
};

/** Do not silently truncate a real Content Builder collection to the first 100 records. */
export async function readContentBuilderCollection<T>(path: string): Promise<T[]> {
  const result: T[] = [];
  const maxPages = 100;
  for (let page = 0; page < maxPages; page++) {
    const separator = path.includes("?") ? "&" : "?";
    const response = await contentBuilderApi.get<PagedResponse<T> | T[]>(`${path}${separator}page=${page}&size=100`);
    const items = Array.isArray(response) ? response : response?.content;
    if (!Array.isArray(items)) throw new Error(`Content Builder trả danh sách sai định dạng: ${path}`);
    result.push(...items);
    const totalPages = Array.isArray(response) ? undefined : response.totalPages;
    if (totalPages !== undefined && (!Number.isInteger(totalPages) || totalPages < 0)) {
      throw new Error(`Content Builder trả totalPages không hợp lệ: ${path}`);
    }
    if ((typeof totalPages === "number" && page + 1 >= totalPages) || items.length < 100) return result;
  }
  throw new Error(`Content Builder trả quá nhiều trang; không hiển thị dữ liệu chưa tải đủ: ${path}`);
}
