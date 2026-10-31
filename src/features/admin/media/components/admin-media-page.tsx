"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminAccess } from "../../foundation/admin-access-provider";
import { AdminPageHeader } from "../../foundation/components/admin-page-header";
import { canUploadExistingAttachment } from "../admin-media-policy";
import { AdminMediaBrowser } from "./admin-media-browser";
import { AdminMediaUpload } from "./admin-media-upload";

export function AdminMediaPage() {
  const { access, error } = useAdminAccess();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const canUpload = !error && (canUploadExistingAttachment(access, "QUESTION") || canUploadExistingAttachment(access, "EXAM") || canUploadExistingAttachment(access, "TRAFFIC_SIGN"));
  return <div className="space-y-6">
    <AdminPageHeader title="Thư viện tài nguyên" description="Tra cứu ảnh, video và trạng thái tài nguyên dùng trong hệ thống DTS." actions={<Button type="button" disabled={!canUpload} onClick={() => setUploadOpen(true)}><UploadCloud className="size-4" />Tải tài nguyên lên</Button>} />
    <div className="flex flex-wrap items-start gap-3 rounded-xl border bg-card p-4"><Badge variant="outline">Kho tài nguyên</Badge><p className="min-w-0 flex-1 text-[14.5px]/5 text-muted-foreground">Tài nguyên sẵn sàng có thể được chọn khi biên soạn. Nội dung chỉ hiển thị cho học viên sau khi được công bố.</p></div>
    <AdminMediaBrowser />
    <Dialog open={uploadOpen} onOpenChange={(next) => { if (!busy) setUploadOpen(next); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl" onEscapeKeyDown={(e) => { if (busy) e.preventDefault(); }} onPointerDownOutside={(e) => { if (busy) e.preventDefault(); }}><DialogHeader><DialogTitle>Tải tài nguyên lên</DialogTitle><DialogDescription>Chỉ dùng tệp có trạng thái Sẵn sàng khi biên soạn nội dung.</DialogDescription></DialogHeader><AdminMediaUpload onBusyChange={setBusy} /></DialogContent></Dialog>
  </div>;
}
