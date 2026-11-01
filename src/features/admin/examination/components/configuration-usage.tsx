"use client";
import Link from "next/link";
import {LifecycleButton} from "../../workbench/components/lifecycle-button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAdminAccess } from "../../foundation/admin-access-provider";
import { adminStatusLabel } from "../../foundation/admin-ui-labels";
import { AdminPageState } from "../../foundation/components/admin-page-state";
import { readConfigurationReferences, type ExamConfigurationKind } from "../examination-config-usage";
export function ConfigurationUsage({ kind, id, title }: { kind: ExamConfigurationKind; id: string; title: string }) {
  const [open, setOpen] = useState(false); const { access, can, error } = useAdminAccess();
  const allowed = !error && can("exam", "read") && can("exam_version", "read");
  const query = useQuery({ queryKey: ["admin", "exam-config-usage", access?.actorId, kind, id], queryFn: ({ signal }) => readConfigurationReferences(kind, id, signal), enabled: allowed && open, retry: false, staleTime: 0, gcTime: 0 });
  return <><LifecycleButton subject={{kind:kind==="structure"?"EXAM_STRUCTURE":kind==="criteria"?"EXAM_CRITERIA":"EXAM_RULE",id}}/><Button type="button" size="sm" variant="outline" disabled={!allowed} onClick={() => setOpen(true)}>Nơi sử dụng</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Nơi sử dụng cấu hình</DialogTitle><DialogDescription>{title}</DialogDescription></DialogHeader>{query.isPending ? <AdminPageState state="loading" /> : query.isError ? <AdminPageState state="error" error={query.error} onRetry={() => void query.refetch()} /> : query.data?.length ? <div className="space-y-3">{query.data.map(r => <div key={r.versionId} className="space-y-2 rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold">{r.examTitle}</p><Badge variant="outline">{adminStatusLabel(r.status)}</Badge></div><p className="text-[15px]/6">Phiên bản {r.versionNo} — {r.title}</p><Button asChild variant="outline" size="sm"><Link href={`/admin/exams/${r.examId}`}>Xem kỳ thi</Link></Button></div>)}</div> : <p className="text-[15px]/6 text-muted-foreground">Chưa có phiên bản tham chiếu trong danh sách được phép xem. Điều kiện chỉnh sửa và xóa sẽ được kiểm tra lại khi lưu.</p>}<p className="text-[14px]/6 text-muted-foreground">Cấu hình của phiên bản đã công bố hoặc lưu trữ được giữ nguyên. Để thay đổi, hãy tạo cấu hình mới.</p></DialogContent></Dialog></>;
}
