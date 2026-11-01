"use client";

import { useState } from "react";
import { Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAccess } from "../../foundation/admin-access-provider";
import { canUploadExistingAttachment } from "../admin-media-policy";
import { AdminMediaBrowser } from "./admin-media-browser";
import { AdminMediaUpload } from "./admin-media-upload";
import type { MediaUploadTarget } from "@/features/media/media-upload-policy";

export function AdminMediaPicker({ target, editableDraft, disabled = false, onSelect }: { target: MediaUploadTarget; editableDraft: boolean; disabled?: boolean; onSelect: (mediaId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { access, error } = useAdminAccess();
  const allowed = !disabled && !error && editableDraft && canUploadExistingAttachment(access, target);
  return <><Button type="button" variant="outline" size="sm" disabled={!allowed} onClick={() => setOpen(true)}><Images className="size-4" />Chọn từ thư viện / tải mới</Button>
    <Dialog open={open} onOpenChange={(next) => { if (!busy) setOpen(next); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-5xl" onEscapeKeyDown={(e) => { if (busy) e.preventDefault(); }} onPointerDownOutside={(e) => { if (busy) e.preventDefault(); }}>
      <DialogHeader><DialogTitle>Chọn tài nguyên cho bản nháp</DialogTitle><DialogDescription>Chọn ảnh công khai có trạng thái Sẵn sàng. Lưu bản nháp để áp dụng ảnh đã chọn.</DialogDescription></DialogHeader>
      <Tabs defaultValue="library"><TabsList><TabsTrigger value="library" disabled={busy}>Thư viện</TabsTrigger><TabsTrigger value="upload" disabled={busy || !allowed}>Tải ảnh mới</TabsTrigger></TabsList><TabsContent value="library" className="mt-4"><AdminMediaBrowser target={target} editableDraft={editableDraft && allowed} onChoose={(item) => { if (allowed) { onSelect(item.mediaId); setOpen(false); } }} /></TabsContent><TabsContent value="upload" className="mt-4"><AdminMediaUpload target={target} editableDraft={editableDraft && allowed} onBusyChange={setBusy} onChoose={(item) => { if (allowed) { onSelect(item.mediaId); setOpen(false); } }} /></TabsContent></Tabs>
    </DialogContent></Dialog>
  </>;
}
