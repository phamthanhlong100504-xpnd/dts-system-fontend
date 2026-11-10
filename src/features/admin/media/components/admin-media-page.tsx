"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminAccess } from "../../foundation/admin-access-provider";
import { AdminPageHeader } from "../../foundation/components/admin-page-header";
import { canUploadExistingAttachment } from "../admin-media-policy";
import { AdminMediaBrowser } from "./admin-media-browser";
import { AdminMediaUpload } from "./admin-media-upload";
import styles from "@/features/admin/workbench/components/admin-management-visual.module.css";

export function AdminMediaPage() {
  const { access, error } = useAdminAccess();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const canUpload = !error && (canUploadExistingAttachment(access, "QUESTION") || canUploadExistingAttachment(access, "EXAM") || canUploadExistingAttachment(access, "TRAFFIC_SIGN") || canUploadExistingAttachment(access, "SIMULATION_VIDEO") || canUploadExistingAttachment(access, "SIMULATION_THUMBNAIL"));
  return <div className={styles.page} data-testid="admin-media-page">
    <AdminPageHeader title="Thư viện tài nguyên" description="Tra cứu ảnh, video và trạng thái tài nguyên dùng trong hệ thống DTS." actions={<Button type="button" disabled={!canUpload} onClick={() => setUploadOpen(true)}><UploadCloud className="size-4" />Tải tài nguyên lên</Button>} />
    <AdminMediaBrowser />
    <Dialog open={uploadOpen} onOpenChange={(next) => { if (!busy) setUploadOpen(next); }}><DialogContent className={`${styles.uploadDialog} max-h-[90dvh] overflow-y-auto sm:max-w-2xl`} onEscapeKeyDown={(e) => { if (busy) e.preventDefault(); }} onPointerDownOutside={(e) => { if (busy) e.preventDefault(); }}><DialogHeader><DialogTitle>Tải tài nguyên lên</DialogTitle><DialogDescription>Chọn loại tài nguyên và tệp cần tải lên.</DialogDescription></DialogHeader><AdminMediaUpload onBusyChange={setBusy} /></DialogContent></Dialog>
  </div>;
}
