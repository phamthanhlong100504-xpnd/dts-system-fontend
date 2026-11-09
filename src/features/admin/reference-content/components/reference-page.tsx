"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Eye, Plus, Search } from "lucide-react";
import { adminStatusLabel } from "@/features/admin/foundation/admin-ui-labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MediaImage } from "@/components/ui/media-image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminAccess } from "../../foundation/admin-access-provider";
import { AdminPageHeader } from "../../foundation/components/admin-page-header";
import { AdminPageState } from "../../foundation/components/admin-page-state";
import { detailReference, listReference } from "../reference-service";
import { SIGN_CATEGORIES, type ReferenceFilter, type ReferenceKind } from "../reference-contract";
import { ReferencePreview } from "./reference-preview";
import { ReferenceEditor } from "./reference-editor";
import styles from "@/features/admin/admin-business-pages.module.css";

export function ReferencePage({ kind, versionHref }: { kind: ReferenceKind; versionHref: string }) {
  const { access, can, error } = useAdminAccess();
  const traffic = kind === "traffic-signs";
  const title = traffic ? "Biển báo giao thông" : "Mẹo ghi nhớ";
  const [version, setVersion] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState<ReferenceFilter>({ bankVersion: "", keyword: "", category: "", page: 0, size: 20 });
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const closeEditor = useRef<(() => void) | null>(null);

  const query = useQuery({
    queryKey: ["admin", kind, access?.actorId, "published", filter],
    queryFn: ({ signal }) => listReference(kind, filter, signal),
    enabled: !error && can(kind, "read") && Boolean(filter.bankVersion),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const detail = useQuery({
    queryKey: ["admin", kind, access?.actorId, "detail", filter.bankVersion, selected],
    queryFn: ({ signal }) => detailReference(kind, selected!, filter.bankVersion, signal),
    enabled: !error && Boolean(selected && filter.bankVersion),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const data = query.data;

  return (
    <div className={styles.page} data-testid={`admin-${kind}-page`}>
      <AdminPageHeader
        title={title}
        description={traffic ? "Tra cứu và quản lý nội dung biển báo theo từng phiên bản." : "Tra cứu và quản lý các nội dung giúp học viên ghi nhớ kiến thức."}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline"><Link href={versionHref}>Bản nháp & phiên bản</Link></Button>
            {can(kind, "create") && <Button type="button" onClick={() => setCreating(true)}><Plus className="size-4" />Tạo bản nháp</Button>}
          </div>
        )}
      />

      <form
        className={styles.panel}
        onSubmit={e => {
          e.preventDefault();
          setSelected(null);
          setFilter({ bankVersion: version.trim(), keyword, category, page: 0, size: filter.size });
        }}
      >
        <div className={traffic ? styles.formGridFour : styles.formGridThree}>
          <label className="flex flex-col gap-2 font-semibold">
            Phiên bản nội dung *
            <Input maxLength={64} required value={version} onChange={e => setVersion(e.target.value)} placeholder="Nhập phiên bản" />
          </label>
          <label className="flex flex-col gap-2 font-semibold">
            {traffic ? "Tìm biển báo" : "Tìm mẹo ghi nhớ"}
            <Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Nhập nội dung cần tìm" />
          </label>
          {traffic && (
            <label className="flex flex-col gap-2 font-semibold">
              Nhóm biển
              <select value={category} onChange={e => setCategory(e.target.value)} className="h-[42px] rounded-xl border bg-background px-3">
                <option value="">Tất cả nhóm</option>
                {SIGN_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
          )}
          <Button type="submit" className="h-[42px] whitespace-nowrap" disabled={!version.trim() || query.isFetching}>
            <Search className="size-4" />Tìm kiếm
          </Button>
        </div>
      </form>

      {!filter.bankVersion ? (
        <AdminPageState state="empty" title="Chọn phiên bản nội dung để xem danh sách" />
      ) : query.isPending ? (
        <AdminPageState state="loading" />
      ) : query.isError ? (
        <AdminPageState state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : data && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px]/6"><strong>{data.totalElements}</strong> nội dung phù hợp</p>
            <Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>Tải lại</Button>
          </div>
          <div className={styles.tableCard}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{traffic ? "Biển báo" : "Nội dung ghi nhớ"}</th>
                    <th>{traffic ? "Nhóm / Hạng áp dụng" : "Thứ tự"}</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.length ? data.content.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {"code" in item && item.mediaFileId && <MediaImage src={item.mediaFileId} alt={item.name} className="size-16 shrink-0 rounded-xl border bg-white object-contain" />}
                          <div className="max-w-lg whitespace-normal">
                            <p className={styles.tableTitle}>{"code" in item ? `${item.code} — ${item.name}` : item.title}</p>
                            <p className={`${styles.tableSecondary} line-clamp-2`}>{"code" in item ? item.quickTip : item.quickRule}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-normal">
                        {"code" in item ? <>{item.categoryName}<p className={styles.tableSecondary}>{item.applicableLicenses.join(", ")}</p></> : item.sortOrder}
                      </td>
                      <td><Badge variant="outline">{adminStatusLabel(item.status)}</Badge></td>
                      <td className="text-right"><Button type="button" variant="outline" size="sm" onClick={() => setSelected(item.id)}><Eye className="size-4" />Chi tiết</Button></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className={styles.emptyPanel}>Không có nội dung phù hợp với bộ lọc.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className={styles.toolbarFooter}>
              <label className="flex items-center gap-2">Mỗi trang
                <select className="h-9 rounded-xl border bg-background px-3" value={filter.size} onChange={e => { setFilter(old => ({ ...old, size: Number(e.target.value), page: 0 })); setSelected(null); }}>
                  {[20, 40, 80].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <div className="flex items-center gap-3">
                <Button type="button" size="sm" variant="outline" aria-label="Trang trước" disabled={filter.page === 0 || query.isFetching} onClick={() => setFilter(old => ({ ...old, page: old.page - 1 }))}><ChevronLeft className="size-4" /></Button>
                <span>{data.totalPages ? `Trang ${data.pageNumber + 1} / ${data.totalPages}` : "Chưa có dữ liệu"}</span>
                <Button type="button" size="sm" variant="outline" aria-label="Trang tiếp" disabled={data.last || query.isFetching} onClick={() => setFilter(old => ({ ...old, page: old.page + 1 }))}><ChevronRight className="size-4" /></Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết {traffic ? "biển báo" : "mẹo ghi nhớ"}</DialogTitle>
            <DialogDescription className="sr-only">Nội dung {traffic ? "biển báo" : "mẹo ghi nhớ"}</DialogDescription>
          </DialogHeader>
          {detail.isError ? <AdminPageState state="error" error={detail.error} onRetry={() => void detail.refetch()} /> : detail.isPending ? <AdminPageState state="loading" /> : detail.data && <ReferencePreview item={detail.data} />}
        </DialogContent>
      </Dialog>
      <Dialog open={creating} onOpenChange={open => { if (!open) closeEditor.current?.(); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tạo bản nháp {traffic ? "biển báo" : "mẹo ghi nhớ"}</DialogTitle>
            <DialogDescription className="sr-only">Biên soạn nội dung mới</DialogDescription>
          </DialogHeader>
          <ReferenceEditor key={creating ? "open" : "closed"} kind={kind} bankVersion={filter.bankVersion || version.trim()} onClose={() => setCreating(false)} registerClose={handler => { closeEditor.current = handler; }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
