import { Badge } from "@/components/ui/badge";

const contentLabels: Record<string, string> = {
  DRAFT: "Bản nháp", IN_REVIEW: "Chờ duyệt", APPROVED: "Đã duyệt",
  PUBLISHED: "Đã công bố", ARCHIVED: "Đã lưu trữ",
};
const releaseLabels: Record<string, string> = {
  CREATED: "Đã tạo", VALIDATING: "Đang kiểm tra", READY: "Sẵn sàng phát hành",
  DISTRIBUTING: "Đang đồng bộ", ACTIVATING: "Đang kích hoạt", ACTIVE: "Đã kích hoạt",
  FAILED: "Phát hành thất bại", RETIRED: "Đã ngừng sử dụng",
};

export function AdminContentStatus({ status }: { status: string | null | undefined }) {
  return <Badge variant={status === "PUBLISHED" ? "default" : "secondary"}>{status ? contentLabels[status] ?? "Chưa xác định" : "Chưa có trạng thái"}</Badge>;
}

export function AdminReleaseStatus({ status }: { status: string | null | undefined }) {
  return <Badge variant={status === "FAILED" ? "destructive" : status === "ACTIVE" ? "default" : "secondary"}>{status ? releaseLabels[status] ?? "Chưa xác định" : "Chưa có trạng thái phát hành"}</Badge>;
}
