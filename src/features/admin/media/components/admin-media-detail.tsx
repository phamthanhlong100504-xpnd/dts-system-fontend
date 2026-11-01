"use client";

import { useState } from "react";
import { MediaUsagePanel,PrivateAssetPreview } from "../../workbench/components/media-usage";
import { useQuery } from "@tanstack/react-query";
import { Film, ImageIcon, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaImage } from "@/components/ui/media-image";
import { useAdminAccess } from "../../foundation/admin-access-provider";
import { AdminPageState } from "../../foundation/components/admin-page-state";
import { fetchPublicMediaPreview } from "../admin-media-service";
import { formatMediaBytes, MEDIA_STATUS_LABELS, type AdminMediaItem } from "../admin-media-contract";

export function AdminMediaStatus({ status }: { status: AdminMediaItem["status"] }) {
  const color = status === "READY" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" : status === "FAILED" ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300";
  return <Badge variant="outline" className={color}>{MEDIA_STATUS_LABELS[status]}</Badge>;
}

function MediaPreview({ item }: { item: AdminMediaItem }) {
  const { access, error } = useAdminAccess();
  const [failed, setFailed] = useState(false);
  const [imageEpoch, setImageEpoch] = useState(0);
  const supported = item.mediaType === "IMAGE" || item.mediaType === "VIDEO";
  const allowed = !error && item.visibility === "PUBLIC" && item.status === "READY" && supported;
  const preview = useQuery({
    queryKey: ["admin", "media", access?.actorId, "preview", item.mediaId],
    queryFn: ({ signal }) => fetchPublicMediaPreview(access!.actorId, item, signal), enabled: Boolean(access && allowed),
    staleTime: 0, gcTime: 0, retry: false, refetchOnWindowFocus: false,
  });
  if (item.status !== "READY") return <AdminPageState state={item.status === "FAILED" ? "error" : "processing"} title={MEDIA_STATUS_LABELS[item.status]} description={item.status === "FAILED" ? "Tệp xử lý thất bại. Vui lòng chọn tệp khác." : "tài nguyên chưa sẵn sàng. Tải lại danh sách để kiểm tra trạng thái mới nhất."} />;
  if (item.visibility === "PRIVATE" && supported) return <PrivateAssetPreview key={item.mediaId} mediaId={item.mediaId} video={item.mediaType === "VIDEO"} title={item.originalFilename}/>;
  if (!supported) return <AdminPageState state="empty" title="Không hỗ trợ xem trước loại tệp này" description="Thông tin tài nguyên được hiển thị bên dưới." />;
  if (!allowed) return <AdminPageState state="forbidden" description="Bạn chưa được cấp quyền xem tài nguyên này." />;
  return <div className="space-y-3">
    {preview.isPending ? <AdminPageState state="loading" title="Đang lấy quyền xem tài nguyên" /> : preview.isError ? <AdminPageState state="error" error={preview.error} onRetry={() => void preview.refetch()} /> : !failed && preview.data ?
      <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-xl border bg-black/5" onErrorCapture={() => setFailed(true)}>
        {item.mediaType === "VIDEO" ? <video key={preview.data} controls preload="metadata" src={preview.data} className="max-h-[42vh] w-full" aria-label={item.originalFilename} onError={() => setFailed(true)} /> : <MediaImage key={imageEpoch} src={preview.data} alt={item.originalFilename} className="max-h-[42vh] max-w-full object-contain" />}
      </div> : <AdminPageState state="error" title="Không thể phát hoặc hiển thị tệp" description="Chưa thể mở tệp này. Vui lòng tải lại để thử lại." />}
    <Button type="button" variant="outline" size="sm" disabled={preview.isFetching || !allowed} onClick={async () => { setFailed(false); await preview.refetch(); setImageEpoch((n) => n + 1); }}><RefreshCw className="size-4" />Tải lại bản xem trước</Button>
  </div>;
}

export function AdminMediaDetail({ item, onClose }: { item: AdminMediaItem; onClose: () => void }) {
  const Icon = item.mediaType === "VIDEO" ? Film : ImageIcon;
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
    <DialogHeader><DialogTitle className="flex items-center gap-2 pr-7"><Icon className="size-5 shrink-0 text-primary" /><span className="break-all">{item.originalFilename}</span></DialogTitle><DialogDescription>Thông tin tài nguyên và trạng thái do hệ thống trả về.</DialogDescription></DialogHeader>
    <MediaPreview key={item.mediaId} item={item} />
    <dl className="grid gap-4 rounded-xl border p-4 text-[14.5px]/5 sm:grid-cols-2">
      <div className="sm:col-span-2"><dt className="text-muted-foreground">Mã tài nguyên</dt><dd className="mt-1 break-all font-mono text-[12.5px]/4">{item.mediaId}</dd></div>
      <div><dt className="text-muted-foreground">Trạng thái</dt><dd className="mt-1"><AdminMediaStatus status={item.status} /></dd></div>
      <div><dt className="text-muted-foreground">Quyền truy cập</dt><dd className="mt-1">{item.visibility === "PUBLIC" ? "Công khai" : "Riêng tư"}</dd></div>
      <div><dt className="text-muted-foreground">Định dạng</dt><dd className="mt-1">{item.mimeType}</dd></div>
      <div><dt className="text-muted-foreground">Dung lượng</dt><dd className="mt-1">{formatMediaBytes(item.sizeBytes)}</dd></div>
      <div><dt className="text-muted-foreground">Ngày tải lên</dt><dd className="mt-1">{new Date(item.createdAt).toLocaleString("vi-VN")}</dd></div>
      <div><dt className="text-muted-foreground">Nơi sử dụng</dt><dd className="mt-1 text-muted-foreground">Chưa xác định nơi sử dụng</dd></div>
    </dl>
    <MediaUsagePanel key={item.mediaId} mediaId={item.mediaId}/>
  </DialogContent></Dialog>;
}
