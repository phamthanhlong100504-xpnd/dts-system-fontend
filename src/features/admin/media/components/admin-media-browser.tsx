"use client";

import { useId, useState } from "react";
import { ChevronLeft, ChevronRight, File, Film, ImageIcon, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminAccess } from "../../foundation/admin-access-provider";
import { AdminPageState } from "../../foundation/components/admin-page-state";
import { MEDIA_KINDS, formatMediaBytes, type AdminMediaFilter, type AdminMediaItem, type MediaKind, type MediaStatus } from "../admin-media-contract";
import { useAdminMedia } from "../use-admin-media";
import { useAdminMediaSelection } from "../use-admin-media-selection";
import { canChooseAdminMedia } from "../admin-media-policy";
import { AdminMediaDetail, AdminMediaStatus } from "./admin-media-detail";
import type { MediaUploadTarget } from "@/features/media/media-upload-policy";

const selectClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-[14.5px]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
export function AdminMediaBrowser({ target, editableDraft = false, onChoose }: { target?: MediaUploadTarget; editableDraft?: boolean; onChoose?: (item: AdminMediaItem) => void }) {
  const { access, error: accessError } = useAdminAccess();
  const prefix = useId();
  const [filter, setFilter] = useState<AdminMediaFilter>({ page: 0, size: 10, mediaType: target ? "IMAGE" : undefined, status: target ? "READY" : undefined, visibility: target ? "PUBLIC" : undefined });
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useAdminMedia(filter);
  const selection = useAdminMediaSelection(target, editableDraft, onChoose);
  const data = query.data;
  const items = data?.content.filter((item) => `${item.originalFilename} ${item.mediaId}`.toLocaleLowerCase("vi-VN").includes(search.trim().toLocaleLowerCase("vi-VN"))) ?? [];
  const selected = data?.content.find((item) => item.mediaId === selectedId);
  function change<K extends keyof AdminMediaFilter>(key: K, value: AdminMediaFilter[K]) { setFilter((old) => ({ ...old, [key]: value, page: 0 })); setSelectedId(null); }
  return <div className="space-y-4">
    <div className="grid items-end gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="flex min-w-0 flex-col gap-2"><label htmlFor={`${prefix}-kind`} className="text-[14.5px]/5 font-semibold text-foreground">Loại tệp</label><select id={`${prefix}-kind`} className={selectClass} value={filter.mediaType ?? ""} disabled={Boolean(target)} onChange={(e) => change("mediaType", (e.target.value || undefined) as MediaKind | undefined)}><option value="">Tất cả loại tệp</option>{MEDIA_KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></div>
      <div className="flex min-w-0 flex-col gap-2"><label htmlFor={`${prefix}-status`} className="text-[14.5px]/5 font-semibold text-foreground">Trạng thái</label><select id={`${prefix}-status`} className={selectClass} value={filter.status ?? ""} disabled={Boolean(target)} onChange={(e) => change("status", (e.target.value || undefined) as MediaStatus | undefined)}><option value="">Tất cả trạng thái</option><option value="UPLOADING">Chưa sẵn sàng</option><option value="READY">Sẵn sàng</option><option value="FAILED">Xử lý thất bại</option></select></div>
      <div className="flex min-w-0 flex-col gap-2"><label htmlFor={`${prefix}-visibility`} className="text-[14.5px]/5 font-semibold text-foreground">Quyền truy cập</label><select id={`${prefix}-visibility`} className={selectClass} value={filter.visibility ?? ""} disabled={Boolean(target)} onChange={(e) => change("visibility", (e.target.value || undefined) as AdminMediaFilter["visibility"])}><option value="">Tất cả</option><option value="PUBLIC">Công khai</option><option value="PRIVATE">Riêng tư</option></select></div>
      <div className="flex min-w-0 flex-col gap-2"><label htmlFor={`${prefix}-search`} className="text-[14.5px]/5 font-semibold text-foreground">Tìm trong trang hiện tại</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id={`${prefix}-search`} className="h-10 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên tệp hoặc mã tài nguyên" /></div></div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[12.5px]/4 text-muted-foreground">{data ? `${data.totalElements.toLocaleString("vi-VN")} tài nguyên theo bộ lọc` : "Số lượng sẽ hiển thị sau khi tải dữ liệu"}{search && data ? ` · ${items.length} khớp trong trang này` : ""}</p><Button type="button" variant="outline" size="sm" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw className={`size-4 ${query.isFetching ? "animate-spin" : ""}`} />Tải lại</Button></div>
    {selection.message && <p role="alert" className="text-[14.5px]/5 text-destructive">{selection.message}</p>}
    {query.isPending ? <AdminPageState state="loading" title="Đang tải thư viện tài nguyên" /> : query.isError ? <AdminPageState state="error" error={query.error} onRetry={() => void query.refetch()} /> : <div className="overflow-hidden rounded-2xl border bg-card shadow-sm"><Table><TableHeader><TableRow><TableHead className="pl-4">Tài nguyên</TableHead><TableHead>Định dạng / Dung lượng</TableHead><TableHead>Trạng thái</TableHead><TableHead>Truy cập</TableHead><TableHead>Ngày tải lên</TableHead><TableHead className="pr-4 text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>
      {items.length ? items.map((item) => {
        const Icon = item.mediaType === "VIDEO" ? Film : item.mediaType === "IMAGE" ? ImageIcon : File;
        const selectable = target && canChooseAdminMedia(accessError ? null : access, item, target, editableDraft);
        return <TableRow key={item.mediaId}><TableCell className="pl-4"><div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary"><Icon className="size-5" /></span><div className="min-w-0"><button type="button" className="block max-w-64 truncate text-left text-[14.5px]/5 font-medium hover:text-primary hover:underline" title={item.originalFilename} onClick={() => setSelectedId(item.mediaId)}>{item.originalFilename}</button><p className="mt-1 font-mono text-[11.5px]/4 text-muted-foreground">{item.mediaId}</p></div></div></TableCell><TableCell><p>{item.mimeType}</p><p className="mt-1 text-[12.5px]/4 text-muted-foreground">{formatMediaBytes(item.sizeBytes)}</p></TableCell><TableCell><AdminMediaStatus status={item.status} /></TableCell><TableCell>{item.visibility === "PUBLIC" ? "Công khai" : "Riêng tư"}</TableCell><TableCell className="text-[12.5px]/4 text-muted-foreground">{new Date(item.createdAt).toLocaleString("vi-VN")}</TableCell><TableCell className="pr-4 text-right"><div className="flex justify-end gap-2"><Button type="button" size="sm" variant="ghost" onClick={() => setSelectedId(item.mediaId)}>Chi tiết</Button>{onChoose && target && <Button type="button" size="sm" variant="outline" disabled={!selectable || selection.pending} onClick={() => void selection.choose(item)}>Chọn</Button>}</div></TableCell></TableRow>;
      }) : <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">{search ? "Không có kết quả khớp trong trang này. Hãy đổi từ khóa hoặc chuyển trang." : "Chưa có tài nguyên theo bộ lọc đã chọn."}</TableCell></TableRow>}
    </TableBody></Table></div>}
    {data && !query.isError && <div className="flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-[12.5px]/4 text-muted-foreground">Mỗi trang<select className={`${selectClass} w-20`} value={filter.size} onChange={(e) => change("size", Number(e.target.value))}>{[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}</select></label><div className="flex items-center gap-3"><Button type="button" size="sm" variant="outline" aria-label="Trang tài nguyên trước" disabled={query.isFetching || filter.page <= 0} onClick={() => { setFilter((f) => ({ ...f, page: f.page - 1 })); setSelectedId(null); }}><ChevronLeft className="size-4" /></Button><span className="text-[12.5px]/4 text-muted-foreground">{data.totalPages ? `Trang ${data.number + 1} / ${data.totalPages}` : "Chưa có trang dữ liệu"}</span><Button type="button" size="sm" variant="outline" aria-label="Trang tài nguyên tiếp theo" disabled={query.isFetching || filter.page + 1 >= data.totalPages} onClick={() => { setFilter((f) => ({ ...f, page: f.page + 1 })); setSelectedId(null); }}><ChevronRight className="size-4" /></Button></div></div>}
    {selected && !query.isError && !accessError && <AdminMediaDetail item={selected} onClose={() => setSelectedId(null)} />}
  </div>;
}
