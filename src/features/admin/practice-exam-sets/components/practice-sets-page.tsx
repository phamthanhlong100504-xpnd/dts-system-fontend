"use client";
import Link from "next/link";
import { ResourceWorkspace } from "../../workbench/components/resource-workspace";
import { PolicyWorkspace } from "../../workbench/components/policy-workspace";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLicenseCatalog } from "@/features/license/use-license";
import { useAdminAccess } from "../../foundation/admin-access-provider";
import { AdminPageHeader } from "../../foundation/components/admin-page-header";
import { AdminPageState } from "../../foundation/components/admin-page-state";
import { fetchPracticePolicySummary } from "../practice-catalog-service";

export function PracticeSetsPage({ setId, initialLicense = "" }: { setId?: string; initialLicense?: string }) {
  const { access, error } = useAdminAccess(), catalog = useLicenseCatalog();
  const [license, setLicense] = useState(initialLicense); const [tab, setTab] = useState("sets");
  const enabled = Boolean(access && !error && license && catalog.data?.some(x => x.code === license));
  const policy = useQuery({ queryKey: ["admin", "practice-policy-summary", access?.actorId, license], queryFn: ({ signal }) => fetchPracticePolicySummary(license, signal), enabled: enabled && tab === "policy", retry: false, staleTime: 0, gcTime: 0 });
  return <div className="space-y-6">
    <AdminPageHeader title={setId ? "Thông tin bộ đề luyện tập" : "Bộ đề luyện tập"} description="Quản lý bộ đề cố định và xem cấu hình thi thử theo hạng GPLX."  />

    {setId && <Button asChild variant="outline"><Link href={`/admin/practice-exam-sets?licenseClass=${encodeURIComponent(license)}`}><ArrowLeft className="size-4" />Danh sách bộ đề</Link></Button>}
    {catalog.isError && <AdminPageState state="error" error={catalog.error} onRetry={() => void catalog.refetch()} />}
    <Tabs value={tab} onValueChange={setTab}>
      <div className="max-w-full overflow-x-auto pb-2"><div className="flex min-w-max items-center justify-between gap-6 rounded-xl border bg-card p-4">
        <label className="flex shrink-0 items-center gap-3 text-[15px] font-semibold">Hạng GPLX<select className="h-11 w-56 rounded-lg border bg-background px-3" value={license} disabled={!catalog.isSuccess} onChange={e => setLicense(e.target.value)}><option value="">Chọn hạng GPLX</option>{catalog.data?.map(x => <option key={x.code} value={x.code}>{x.code} — {x.title}</option>)}</select></label>
        <TabsList className="h-11 shrink-0"><TabsTrigger value="sets" className="whitespace-nowrap">Bộ đề cố định</TabsTrigger><TabsTrigger value="policy" className="whitespace-nowrap">Cấu hình thi ngẫu nhiên</TabsTrigger></TabsList>
      </div></div>
      <TabsContent value="sets" className="space-y-4 pt-4">
        <ResourceWorkspace key={license} kind="practice-sets" baseHref="/admin/practice-exam-sets" lockedLicense={license} embedded/>
      </TabsContent>
      <TabsContent value="policy" className="space-y-4 pt-4">{!enabled ? <AdminPageState state="empty" title="Chọn hạng GPLX để xem cấu hình thi" /> : policy.isPending ? <AdminPageState state="loading" /> : policy.isError ? <AdminPageState state="error" error={policy.error} onRetry={() => void policy.refetch()} /> : policy.data && <div className="space-y-4 rounded-2xl border bg-card p-5"><h2>Cấu hình thi ngẫu nhiên — Hạng {policy.data.examType}</h2><dl className="grid gap-5 text-[15px]/6 sm:grid-cols-2 xl:grid-cols-4">{[["Tổng số câu", policy.data.totalQuestions], ["Thời gian", `${policy.data.durationMinutes} phút`], ["Số câu cần đúng", policy.data.passingScore], ["Số câu điểm liệt", policy.data.criticalQuestionCount]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 text-[20px] font-semibold">{value}</dd></div>)}</dl><p className="text-[14px]/6 text-muted-foreground">Cấu hình được cung cấp bởi hệ thống luyện tập. Thông tin chi tiết về phiên bản chính sách, cơ cấu chương và thời điểm hiệu lực hiện chưa khả dụng.</p>{catalog.data?.find(x => x.code === license)?.examAvailable === false && <p role="alert" className="text-[15px]/6 text-amber-800">Ngân hàng của hạng này chưa sẵn sàng để tạo bài thi thử.</p>}<Button variant="outline" disabled={policy.isFetching} onClick={() => void policy.refetch()}>Tải lại</Button></div>}</TabsContent>
    </Tabs>
    <PolicyWorkspace module="theory" embedded/>
  </div>;
}
