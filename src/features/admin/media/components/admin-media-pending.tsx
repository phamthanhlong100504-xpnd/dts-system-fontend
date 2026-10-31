"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAdminAccess } from "../../foundation/admin-access-provider";
import { adminFailure } from "../../foundation/admin-errors";
import { checkUploadedMedia } from "../admin-media-service";
import { canChooseAdminMedia } from "../admin-media-policy";
import { useAdminMediaSelection } from "../use-admin-media-selection";
import type { MediaUploadTarget } from "@/features/media/media-upload-policy";

/** A delayed image upload never replaces the editor selection automatically. */
export function AdminMediaPending({ mediaId, target, editableDraft, onChoose }: { mediaId: string; target: MediaUploadTarget; editableDraft: boolean; onChoose: (id: string) => void }) {
  const { access, error } = useAdminAccess();
  const selection = useAdminMediaSelection(target, editableDraft, (item) => onChoose(item.mediaId));
  const query = useQuery({
    queryKey: ["admin", "media", access?.actorId, "legacy-upload-check", mediaId],
    queryFn: ({ signal }) => checkUploadedMedia(access!.actorId, mediaId, signal), enabled: Boolean(access && !error),
    retry: false, staleTime: 0, gcTime: 0,
  });
  const item = query.data?.kind === "known" ? query.data.item : undefined;
  const allowed = item && canChooseAdminMedia(error ? null : access, item, target, editableDraft);
  return <div role="status" className="mt-3 space-y-2 rounded-xl border bg-muted/20 p-3 text-[12.5px]/5">
    <p className="font-medium">{item?.status === "FAILED" ? "Tệp xử lý thất bại." : allowed ? "tài nguyên đã sẵn sàng. Chọn để gắn vào bản nháp này." : "Tệp đang được kiểm tra. Vui lòng kiểm tra lại sau."}</p>
    <p className="break-all font-mono text-muted-foreground">{mediaId}</p>
    {query.isError && <p className="text-destructive">{adminFailure(query.error).message}</p>}
    {selection.message && <p role="alert" className="text-destructive">{selection.message}</p>}
    <div className="dts-admin-actions"><Button type="button" size="sm" variant="outline" disabled={query.isFetching || Boolean(error)} onClick={() => void query.refetch()}>Kiểm tra lại</Button><Button type="button" size="sm" disabled={!allowed || selection.pending} onClick={() => { if (item) void selection.choose(item); }}>Dùng ảnh này</Button></div>
  </div>;
}
