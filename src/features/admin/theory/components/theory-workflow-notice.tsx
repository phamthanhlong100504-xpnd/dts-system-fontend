import { Info } from "lucide-react";

export function TheoryWorkflowNotice() {
  return <aside className="flex items-start gap-3 rounded-xl border bg-card p-4 text-[14px]/6 text-muted-foreground">
    <Info className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
    <p><strong className="font-semibold text-foreground">Biên soạn bản nháp</strong> Bạn có thể chỉnh sửa bản nháp, nội dung đã công bố chỉ được xem. Chức năng tạo phiên bản mới và phê duyệt hiện chưa khả dụng.</p>
  </aside>;
}
