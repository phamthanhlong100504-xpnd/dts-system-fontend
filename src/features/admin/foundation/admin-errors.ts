export interface AdminFailure {
  kind: "unauthorized" | "forbidden" | "conflict" | "error";
  message: string;
  code?: string;
  traceId?: string;
}

/** Keep business errors distinct; 409 is not always a draft revision conflict. */
export function adminFailure(error: unknown, fallback = "Không thể hoàn tất yêu cầu. Vui lòng thử lại."): AdminFailure {
  const value = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const code = typeof value.errorCode === "string" ? value.errorCode : undefined;
  const traceId = typeof value.traceId === "string" ? value.traceId : undefined;
  if (value.status === 401) return { kind: "unauthorized", message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", code, traceId };
  if (value.status === 403) return { kind: "forbidden", message: "Bạn không có quyền thực hiện thao tác này.", code, traceId };
  if (value.status === 409) {
    const inUse = ["CONFIGURATION_IN_USE", "STRUCTURE_IN_USE", "RULE_IN_USE", "CRITERIA_IN_USE", "STRUCTURE_REFERENCED", "RULE_REFERENCED", "CRITERIA_REFERENCED"];
    return { kind: "conflict", message: code && inUse.includes(code) ? "Cấu hình đang được đề thi sử dụng. Vui lòng tạo bản cấu hình mới, nội dung đang nhập được giữ lại." : "Dữ liệu hoặc trạng thái đã thay đổi. Kiểm tra lại trước khi tiếp tục, nội dung đang nhập cần được giữ lại.", code, traceId };
  }
  return { kind: "error", message: fallback, code, traceId };
}
