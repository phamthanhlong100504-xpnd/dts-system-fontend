"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, Loader2, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLicenseCatalog } from "@/features/license/use-license";
import { fetchOfficialBank } from "@/features/admin/official-bank-service";
import { createExamStructureApi, updateExamStructureApi, fetchAdminExamStructures } from "@/features/admin/admin-examination-service";
import { buildOfficialMatrixSections, getOfficialMatrixPolicy, isOfficialMatrixCurrentlyValid } from "@/features/admin/official-matrix-policy";
import { ApiError } from "@/lib/api";

function OfficialMatrixEditor() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit") ?? "";
  const catalog = useLicenseCatalog();
  const existingQuery = useQuery({
    queryKey: ["admin", "matrix-editor", editId],
    queryFn: fetchAdminExamStructures,
    enabled: Boolean(editId),
    retry: false,
  });
  const existing = existingQuery.data?.find((row) => row.id === editId);
  const savedLicense = typeof existing?.metadata?.licenseClass === "string" ? existing.metadata.licenseClass : "";
  const [manualLicense, setManualLicense] = useState("");
  const license = editId ? savedLicense : manualLicense;
  const [manualTitle, setManualTitle] = useState<string | null>(null);
  const title = manualTitle ?? (editId ? existing?.title ?? "" : license ? `Ma trận thi lý thuyết hạng ${license} - DTS` : "");
  const [saving, setSaving] = useState(false);
  const chosenLicense = catalog.data?.find((row) => row.code === license);
  const bankVersion = chosenLicense?.bankVersion ?? "";
  const bank = useQuery({
    queryKey: ["admin", "official-matrix-bank", license, bankVersion],
    queryFn: () => fetchOfficialBank(bankVersion, license),
    enabled: Boolean(license && bankVersion),
    staleTime: 60_000,
    retry: false,
  });

  const matrix = useMemo(() => {
    if (!license) return { policy: null, sections: [], error: "" };
    try {
      const policy = getOfficialMatrixPolicy(license);
      if (!policy) return { policy: null, sections: [], error: `Chưa có ma trận chính thức cho hạng ${license}.` };
      if (policy.bankVersion !== bankVersion) return { policy, sections: [], error: "Phiên bản ngân hàng không khớp với cơ cấu đề thi đang áp dụng." };
      if (!isOfficialMatrixCurrentlyValid(policy)) return { policy, sections: [], error: "Cơ cấu đề thi này chưa đến ngày áp dụng hoặc đã hết hiệu lực." };
      if (!bank.data) return { policy, sections: [], error: "" };
      return { policy, sections: buildOfficialMatrixSections(policy, bank.data.chapters), error: "" };
    } catch (error) {
      return { policy: null, sections: [], error: error instanceof Error ? error.message : "Không thể xác định ma trận đề thi." };
    }
  }, [license, bankVersion, bank.data]);

  const ready = Boolean(
    title.trim() && !saving && matrix.policy && matrix.sections.length && !matrix.error &&
    bank.isSuccess && chosenLicense?.examAvailable && chosenLicense.bankCountsMatch &&
    chosenLicense.totalQuestions === matrix.policy?.totalQuestions &&
    chosenLicense.criticalQuestionCount === matrix.policy?.criticalQuestionCount &&
    (!editId || existing),
  );
  const total = matrix.sections.reduce((sum, s) => sum + s.questionCount, 0);
  const critical = matrix.sections.reduce((sum, s) => sum + (s.criticalQuestionCount ?? 0), 0);
  const validationMessage = chosenLicense && matrix.policy && (chosenLicense.totalQuestions !== matrix.policy.totalQuestions || chosenLicense.criticalQuestionCount !== matrix.policy.criticalQuestionCount)
    ? "Cấu hình đề thi và danh mục hạng GPLX chưa thống nhất. Chưa thể lưu." : "";

  async function save() {
    if (!ready || !matrix.policy) {
      toast.error(matrix.error || validationMessage || "Vui lòng hoàn tất dữ liệu trước khi lưu ma trận.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        sections: matrix.sections,
        metadata: { ...(existing?.metadata ?? {}), licenseClass: license, bankVersion, contentType: "BANK_VERSION", matrixPolicyId: matrix.policy.id },
      };
      if (editId) await updateExamStructureApi(editId, payload);
      else await createExamStructureApi(payload);
      toast.success(editId ? "Đã cập nhật ma trận theo cơ cấu chính thức." : "Đã tạo ma trận theo cơ cấu chính thức.");
      router.push("/admin/exam-structures");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Không lưu được ma trận. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Link href="/admin/exam-structures" aria-label="Quay lại danh sách cấu trúc"><Button variant="outline" size="icon"><ArrowLeft className="size-4" /></Button></Link>
          <div className="space-y-1"><h1 className="text-2xl font-bold">{editId ? "Cập nhật ma trận đề thi" : "Tạo ma trận đề thi chính thức"}</h1><p className="text-[14.5px]/5 text-muted-foreground">Cơ cấu và câu điểm liệt được thiết lập tự động theo hạng GPLX. Không cần tự chia số câu.</p></div>
        </div>
        <Button onClick={save} disabled={!ready} className="gap-2">{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{saving ? "Đang lưu..." : editId ? "Lưu thay đổi" : "Lưu ma trận"}</Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-lg">1. Thông tin cơ cấu đề</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5"><span className="block text-[14.5px]/5 font-semibold">Hạng GPLX *</span><select value={license} disabled={catalog.isPending || Boolean(editId)} onChange={(event) => {setManualLicense(event.target.value);setManualTitle(null);}} className="h-11 w-full rounded-lg border bg-background px-3 text-[14.5px]/5"><option value="">Chọn hạng GPLX</option>{catalog.data?.map((item) => <option key={item.code} value={item.code}>{item.code} — {item.title} ({item.totalQuestions} câu)</option>)}</select></label>
          <label className="space-y-1.5"><span className="block text-[14.5px]/5 font-semibold">Phiên bản ngân hàng</span><Input readOnly value={bankVersion} className="h-11" /></label>
          <label className="space-y-1.5 md:col-span-2"><span className="block text-[14.5px]/5 font-semibold">Tên ma trận *</span><Input className="h-11" value={title} onChange={(event) => setManualTitle(event.target.value)} /></label>
          {editId && existingQuery.isPending && <p className="text-[14.5px]/5 text-muted-foreground md:col-span-2">Đang tải ma trận cần sửa...</p>}
          {editId && existingQuery.isSuccess && !existing && <p role="alert" className="text-[14.5px]/5 text-destructive md:col-span-2">Không tìm thấy ma trận cần sửa. Vui lòng quay lại danh sách.</p>}
          {catalog.isError && <p role="alert" className="text-[14.5px]/5 text-destructive md:col-span-2">Không tải được danh mục hạng GPLX.</p>}
          {bank.isError && <p role="alert" className="text-[14.5px]/5 text-destructive md:col-span-2">Không tải được ngân hàng câu hỏi. Vui lòng thử lại.</p>}
          {matrix.error && <p role="alert" className="text-[14.5px]/5 text-destructive md:col-span-2">{matrix.error}</p>}
          {validationMessage && <p role="alert" className="text-[14.5px]/5 text-destructive md:col-span-2">{validationMessage}</p>}
          {chosenLicense && (!chosenLicense.examAvailable || !chosenLicense.bankCountsMatch) && <p role="alert" className="text-[14.5px]/5 text-amber-700 md:col-span-2">Hạng GPLX này chưa đủ điều kiện để tạo đề thi.</p>}
        </CardContent>
      </Card>

      {matrix.policy && <Card className="rounded-2xl"><CardContent className="space-y-3 p-6">
        <h2 className="font-semibold">2. Cơ cấu đề thi được áp dụng</h2>
        <div className="flex flex-wrap gap-2"><Badge variant="outline">{matrix.policy.totalQuestions} câu</Badge><Badge variant="outline">{matrix.policy.criticalQuestionCount} câu điểm liệt</Badge><Badge variant="outline">{matrix.policy.durationMinutes} phút</Badge><Badge variant="outline">Đạt từ {matrix.policy.passingCorrectAnswers} câu đúng</Badge></div>
        <div className="flex items-center gap-2 text-[14.5px]/5 text-muted-foreground"><ShieldCheck className="size-4 text-primary"/>Số câu được thiết lập theo cơ cấu hiện hành của hạng đã chọn.</div>
      </CardContent></Card>}

      {bank.isPending && license && <p className="flex items-center gap-2 text-[14.5px]/5 text-muted-foreground"><Loader2 className="size-4 animate-spin"/>Đang tải thông tin chương...</p>}
      {bank.data && matrix.sections.length > 0 && <Card className="rounded-2xl">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="size-5 text-primary"/>3. Phân bổ câu hỏi và câu điểm liệt</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {matrix.sections.map((section) => <div key={section.code} className={`grid items-center gap-3 rounded-xl border p-4 md:grid-cols-[minmax(0,1fr)_120px_120px] ${section.criticalQuestionCount ? "border-amber-200 bg-amber-50/40" : ""}`}>
            <div><p className="font-semibold">{section.title}</p><p className="mt-1 text-[12.5px]/4 text-muted-foreground">{section.criticalQuestionCount ? "Phần câu điểm liệt độc lập, không giới hạn vào một chương" : "Câu hỏi thường trong nhóm chương theo cơ cấu chuẩn"}</p></div>
            <div><p className="text-[12.5px]/4 text-muted-foreground">Số câu</p><p className="font-semibold tabular-nums">{section.questionCount}</p></div>
            <div><p className="text-[12.5px]/4 text-muted-foreground">Điểm liệt</p><p className="font-semibold tabular-nums">{section.criticalQuestionCount ?? 0}</p></div>
          </div>)}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted p-4 text-[14.5px]/5 font-semibold"><span>Tổng số câu: {total} / {matrix.policy?.totalQuestions}</span><span>Câu điểm liệt: {critical} / {matrix.policy?.criticalQuestionCount}</span><CheckCircle2 className="size-5 text-emerald-600"/></div>
          <div className="flex justify-end border-t pt-4"><Button onClick={save} disabled={!ready}><Save className="mr-2 size-4"/>{editId ? "Lưu thay đổi" : "Lưu ma trận"}</Button></div>
        </CardContent>
      </Card>}
      {editId && <p className="flex items-start gap-2 text-[14.5px]/5 text-muted-foreground"><AlertTriangle className="mt-0.5 size-4 shrink-0"/>Nếu ma trận đang được phiên bản đề đã xuất bản sử dụng, bạn không thể chỉnh sửa trực tiếp. Hãy tạo ma trận mới để sử dụng cho phiên bản tiếp theo.</p>}
    </div>
  );
}

export default function OfficialMatrixPage() {
  return <Suspense fallback={<div className="p-6 text-[14.5px]/5 text-muted-foreground">Đang mở biểu mẫu ma trận...</div>}><OfficialMatrixEditor /></Suspense>;
}
