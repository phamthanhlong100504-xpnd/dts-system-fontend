"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLicenseCatalog } from "@/features/license/use-license";
import { ArrowLeft, BookOpen, Loader2, Plus, Send, Copy, Archive, Trash2, Pencil, Shuffle, ListChecks, Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { examinationApi } from "@/lib/api";
import { fetchOfficialBank, fetchOfficialBankDetails, type OfficialBank } from "@/features/admin/official-bank-service";
import { cloneExamVersionApi, type ExamVersionItem } from "@/features/admin/admin-examination-service";
import { buildOfficialMatrixSections, getOfficialMatrixPolicy, matchesOfficialMatrix } from "@/features/admin/official-matrix-policy";
import { evaluateManualMatrixSelection, getManualSectionQuotas, resolveManualQuestionChapterIds } from "@/features/admin/manual-matrix-selection";
import {
  useAdminExams, useAdminExamVersions, useAdminExamStructures, useAdminExamRules,
  useAdminExamCriterias, useCreateExamVersion, usePublishExamVersion,
  useArchiveExamVersion, useDeleteExamVersion, useUpdateExamVersion, useChangeExamStatus,
} from "@/features/admin/use-admin-content";

interface ManualQuestion { id: string; text: string; chapterIds: string[]; chapterTitle: string; isCritical: boolean; displayNo?: string | number }
function toManualQuestions(bank?: OfficialBank): ManualQuestion[] {
  if (!bank) return [];
  const seen = new Set<string>();
  return bank.questions.flatMap((q) => {
    if (!/^[0-9a-fA-F-]{36}$/.test(q.id) || seen.has(q.id) || !q.content.trim()) return [];
    seen.add(q.id);
    const chapterIds = resolveManualQuestionChapterIds(q, bank.chapters);
    const chapterTitle = bank.chapters.filter((chapter) => chapterIds.includes(chapter.id)).map((chapter) => chapter.title).join(" / ");
    return [{ id: q.id, text: q.content, chapterIds, chapterTitle: chapterTitle || "Chưa xác định chương", isCritical: q.isCritical, displayNo: q.displayNo }];
  });
}

function localInputToIso(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Thời gian không hợp lệ.");
  return date.toISOString();
}
function isoToLocalInput(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function AdminExamDetailsPage() {
  const params = useParams<{ examId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const examId = params.examId;
  const { data: exams = [], isLoading: examsLoading, isError: examsError } = useAdminExams();
  const { data: versions = [], isLoading: versionsLoading, isError: versionsError } = useAdminExamVersions(examId);
  const { data: structures = [] } = useAdminExamStructures();
  const { data: rules = [] } = useAdminExamRules();
  const licenseCatalog = useLicenseCatalog();
  const licenseOptions = licenseCatalog.data ?? [];
  const changeStatus = useChangeExamStatus();
  const { data: criterias = [] } = useAdminExamCriterias();
  const create = useCreateExamVersion(examId);
  const publish = usePublishExamVersion(examId);
  const archive = useArchiveExamVersion(examId);
  const remove = useDeleteExamVersion(examId);
  const update = useUpdateExamVersion(examId);
  const exam = exams.find((e) => e.id === examId);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ExamVersionItem | null>(null);
  const [title, setTitle] = useState("");
  const [licenseClass, setLicenseClass] = useState("");
  const [bankVersion, setBankVersion] = useState("");
  const [selectionMode, setSelectionMode] = useState<"AUTO_MATRIX" | "MANUAL">("AUTO_MATRIX");
  const [manualQuestionIds, setManualQuestionIds] = useState<string[]>([]);
  const [questionSearch, setQuestionSearch] = useState("");
  const [manualTab, setManualTab] = useState("ALL");
  const [visibleLimit, setVisibleLimit] = useState(50);
  const [anchorId, setAnchorId] = useState("__ALL__");
  const [structureId, setStructureId] = useState("");
  const [ruleId, setRuleId] = useState("");
  const [criteriaId, setCriteriaId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [instructions, setInstructions] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [releaseSessionId, setReleaseSessionId] = useState("");
  const [releasing, setReleasing] = useState(false);

  const bankQuery = useQuery({
    queryKey: ["admin", "content-builder", "bank", bankVersion.trim(), licenseClass.trim().toUpperCase()] as const,
    queryFn: () => fetchOfficialBank(bankVersion, licenseClass),
    enabled: showCreate && Boolean(bankVersion.trim() && licenseClass.trim()),
    staleTime: 30_000,
    retry: false,
  });
  const chapters = useMemo(() => bankQuery.data?.chapters ?? [], [bankQuery.data]);
  const detailQuery = useQuery({
    queryKey: ["admin", "content-builder", "bank-manual-details", bankVersion.trim(), licenseClass.trim().toUpperCase()] as const,
    queryFn: ({ signal }) => fetchOfficialBankDetails(bankQuery.data!, signal),
    enabled: showCreate && selectionMode === "MANUAL" && bankQuery.isSuccess,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const bankQuestions = useMemo(() => toManualQuestions(detailQuery.data), [detailQuery.data]);
  const selectedQuestionSet = useMemo(() => new Set(manualQuestionIds), [manualQuestionIds]);
  const filteredQuestions = useMemo(() => {
    const query = questionSearch.trim().toLocaleLowerCase("vi-VN");
    return bankQuestions.filter((q) => {
      const matchingTab = manualTab === "ALL" || (manualTab === "CRITICAL" && q.isCritical) ||
        (manualTab === "SELECTED" && selectedQuestionSet.has(q.id)) ||
        (!q.isCritical && q.chapterIds.includes(manualTab));
      return matchingTab && (!query || [q.id, String(q.displayNo ?? ""), q.text, q.chapterTitle].some((part) => part.toLocaleLowerCase("vi-VN").includes(query)));
    });
  }, [bankQuestions, questionSearch, manualTab, selectedQuestionSet]);
  const selectedStructure = structures.find((item) => item.id === structureId);
  const matrixProblem = useMemo(() => {
    if (!structureId || !licenseClass || !bankQuery.data) return "";
    try {
      const policy = getOfficialMatrixPolicy(licenseClass);
      if (!policy) return "Chưa có cơ cấu đề thi chính thức cho hạng đã chọn.";
      if (policy.bankVersion !== bankVersion) return "Ngân hàng câu hỏi không khớp cơ cấu đề thi chính thức.";
      const expected = buildOfficialMatrixSections(policy, bankQuery.data.chapters);
      const structure = structures.find((item) => item.id === structureId);
      if (!structure || !matchesOfficialMatrix(structure.sections, expected)) {
        return "Ma trận đã chọn chưa đúng cơ cấu chính thức. Hãy cập nhật ma trận trước khi tạo phiên bản.";
      }
      return "";
    } catch (error) {
      return error instanceof Error ? error.message : "Không kiểm tra được cơ cấu đề thi.";
    }
  }, [structureId, licenseClass, bankQuery.data, bankVersion, structures]);

  const requiredQuestionCount = selectedStructure?.totalQuestions ?? selectedStructure?.sections.reduce((sum, section) => sum + section.questionCount, 0) ?? 0;
  const manualSections = useMemo(() => getManualSectionQuotas(selectedStructure?.sections ?? []), [selectedStructure]);
  const manualState = useMemo(() => evaluateManualMatrixSelection(manualQuestionIds, bankQuestions, manualSections), [manualQuestionIds, bankQuestions, manualSections]);
  // BANK_VERSION requires one real chapter UUID as content anchor. "Tất cả chương" is a UI scope,
  // never a synthetic UUID or a new backend contract. The matrix defines actual section quotas.
  const effectiveAnchorId = anchorId === "__ALL__" ? chapters[0]?.id ?? "" : anchorId;
  const publishedVersions = versions.filter((version) => version.status === "PUBLISHED");
  const isBusy = create.isPending || publish.isPending || archive.isPending || remove.isPending || update.isPending || Boolean(pendingId);

  function resetForm() {
    const preferredLicense = exam?.licenseType && exam.licenseType !== "—" ? exam.licenseType : "";
    setTitle(""); setLicenseClass(preferredLicense); setBankVersion(licenseOptions.find((item) => item.code === preferredLicense)?.bankVersion ?? "");
    setAnchorId("__ALL__"); setStructureId(""); setRuleId(""); setCriteriaId(""); setStartAt(""); setEndAt(""); setInstructions("");
    setSelectionMode("AUTO_MATRIX"); setManualQuestionIds([]); setQuestionSearch(""); setManualTab("ALL"); setVisibleLimit(50);
  }
  async function handleCreate() {
    if (!title.trim() || !licenseClass.trim() || !bankVersion.trim() || !effectiveAnchorId || !structureId || !ruleId || !criteriaId || !startAt || !endAt) {
      toast.error("Vui lòng nhập đủ thông tin và chọn chương câu hỏi."); return;
    }
    if (!licenseOptions.some((item) => item.code === licenseClass && item.bankVersion === bankVersion)) { toast.error("Phiên bản ngân hàng không phù hợp với hạng GPLX đã chọn."); return; }
    if (!bankQuery.data || bankQuery.data.bankVersion !== bankVersion || bankQuery.data.licenseClass !== licenseClass) {toast.error("Ngân hàng câu hỏi không phù hợp với hạng GPLX đã chọn.");return;}
    if (!chapters.some((c) => c.id === effectiveAnchorId)) { toast.error("Chương câu hỏi không hợp lệ. Vui lòng chọn lại."); return; }
    if (matrixProblem) { toast.error(matrixProblem); return; }
    if (selectionMode === "MANUAL") {
      if (!detailQuery.isSuccess || bankQuestions.length !== bankQuery.data.questions.length) { toast.error("Danh sách câu hỏi chưa tải đầy đủ. Vui lòng thử lại."); return; }
      if (requiredQuestionCount <= 0 || manualQuestionIds.length !== requiredQuestionCount) { toast.error(`Phải chọn đủ ${requiredQuestionCount} câu theo cấu trúc đề.`); return; }
      if (!manualState.complete) { toast.error(manualState.message); return; }
    }
    try {
      const startedAt = localInputToIso(startAt), endedAt = localInputToIso(endAt);
      if (Date.parse(startedAt) >= Date.parse(endedAt)) { toast.error("Thời gian kết thúc phải sau thời gian bắt đầu."); return; }
      await create.mutateAsync({ title: title.trim(), examType: "OFFICIAL", examStructureId: structureId, examRuleId: ruleId, examCriteriaId: criteriaId, contentType: "BANK_VERSION", contentId: effectiveAnchorId, licenseClass: licenseClass.trim().toUpperCase(), bankVersion: bankVersion.trim(), selectionMode, manualQuestionIds: selectionMode === "MANUAL" ? manualQuestionIds : [], startedAt, endedAt, metadata: {instructions: instructions.trim()} });
      await qc.invalidateQueries({ queryKey: ["admin", "exams"], exact: true });
      setShowCreate(false); resetForm(); toast.success("Đã lưu bản nháp. Hãy kiểm tra lại trước khi xuất bản.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Tạo phiên bản thất bại."); }
  }
  function chooseLicense(next: string) {
    setLicenseClass(next); setBankVersion(licenseOptions.find((item) => item.code === next)?.bankVersion ?? "");
    setAnchorId("__ALL__"); setManualQuestionIds([]); setManualTab("ALL"); setQuestionSearch("");
  }
  function toggleManualQuestion(id: string, checked: boolean) {
    if (!checked) { setManualQuestionIds((ids) => ids.filter((x) => x !== id)); return; }
    if (!selectedStructure || matrixProblem) { toast.error(matrixProblem || "Hãy chọn ma trận đề thi hợp lệ trước khi chọn câu."); return; }
    const nextIds = [...manualQuestionIds, id];
    const nextState = evaluateManualMatrixSelection(nextIds, bankQuestions, manualSections);
    if (!nextState.valid) { toast.error(nextState.message); return; }
    setManualQuestionIds((ids) => ids.includes(id) ? ids : [...ids, id]);
  }
  async function toggleExamVisibility() {
    const target = exam?.status === "HIDDEN" ? "PUBLISHED" : "HIDDEN";
    if (!exam || !window.confirm(`${target === "PUBLISHED" ? "Hiển thị" : "Ẩn"} kỳ thi ${exam.title} đối với học viên?`)) return;
    try { await changeStatus.mutateAsync({id: exam.id, status: target}); toast.success(target === "PUBLISHED" ? "Kỳ thi đã được hiển thị theo điều kiện lịch và hạng GPLX." : "Kỳ thi đã được ẩn khỏi danh sách đăng ký mới."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không thể đổi trạng thái kỳ thi."); }
  }
  async function changeVersion(version: ExamVersionItem, action: "publish" | "archive" | "delete" | "clone") {
    const verb = {publish: "xuất bản", archive: "lưu trữ", delete: "xóa", clone: "sao chép thành DRAFT"}[action];
    if (!window.confirm(`Bạn muốn ${verb} phiên bản ${version.title}?`)) return;
    setPendingId(version.id);
    try {
      if (action === "publish") {
        await publish.mutateAsync(version.id);
        if (exam?.status === "HIDDEN") toast.info("Phiên bản đã xuất bản nhưng kỳ thi vẫn đang ẩn. Chọn “Hiển thị kỳ thi” khi muốn mở cho học viên.");
      }
      if (action === "archive") await archive.mutateAsync(version.id);
      if (action === "delete") await remove.mutateAsync(version.id);
      if (action === "clone") { await cloneExamVersionApi(version.id); await qc.invalidateQueries({queryKey: ["admin", "exams", examId]}); await qc.invalidateQueries({queryKey: ["admin", "exams", examId, "versions"]}); }
      await qc.invalidateQueries({queryKey: ["admin", "exams"]});
      toast.success(`Đã ${verb} phiên bản.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : `Không thể ${verb} phiên bản.`); }
    finally { setPendingId(null); }
  }
  async function saveEdit() {
    if (!editing || editing.status !== "DRAFT") return;
    if (!title.trim() || !startAt || !endAt) { toast.error("Chưa nhập đủ tiêu đề và thời gian."); return; }
    try {
      const startedAt = localInputToIso(startAt), endedAt = localInputToIso(endAt);
      if (Date.parse(startedAt) >= Date.parse(endedAt)) { toast.error("Khoảng thời gian không hợp lệ."); return; }
      await update.mutateAsync({versionId: editing.id, payload: {title: title.trim(), startedAt, endedAt, examStructureId: structureId || undefined, examRuleId: ruleId || undefined, examCriteriaId: criteriaId || undefined, metadata: {instructions: instructions.trim()}}});
      toast.success("Đã lưu thay đổi phiên bản."); setEditing(null);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Cập nhật thất bại."); }
  }
  function openEdit(v: ExamVersionItem) {
    setEditing(v); setShowCreate(false); setTitle(v.title); setStartAt(isoToLocalInput(v.startedAt)); setEndAt(isoToLocalInput(v.endedAt));
    setStructureId(v.examStructureId || ""); setRuleId(v.examRuleId || ""); setCriteriaId(v.examCriteriaId || ""); setInstructions(v.metadata?.instructions || "");
  }

  async function releaseResult() {
    const id = releaseSessionId.trim();
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {toast.error("Vui lòng nhập mã phiên thi hợp lệ.");return;}
    if (!window.confirm("Bạn có chắc muốn công bố kết quả của phiên thi này?")) return;
    setReleasing(true);
    try {
      await examinationApi.post<void>(`/v1/exam-sessions/${encodeURIComponent(id)}/release-result`);
      toast.success("Đã yêu cầu công bố kết quả. Hãy đọc lại trạng thái phiên thi.");
      setReleaseSessionId("");
    } catch (error) {toast.error(error instanceof Error ? error.message : "Không thể công bố kết quả.");}
    finally {setReleasing(false);}
  }

  if (examsLoading) return <div className="p-8 text-muted-foreground">Đang tải kỳ thi...</div>;
  if (examsError || versionsError) return <div className="rounded-xl border p-8 text-red-600">Không thể tải thông tin kỳ thi. Vui lòng kiểm tra kết nối hoặc quyền truy cập.</div>;
  if (!exam) return <div className="p-8">Không tìm thấy kỳ thi. <Button variant="outline" onClick={() => router.push("/admin/exams")}>Quay lại</Button></div>;

  return (
    <div className="font-dts space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3"><Button variant="outline" size="icon" onClick={() => router.push("/admin/exams")}><ArrowLeft className="size-4"/></Button><div><h1 className="text-2xl font-bold">{exam.title}</h1><p className="text-sm text-muted-foreground">{exam.code} · Hạng {exam.licenseType} · Trạng thái {({ DRAFT: "Bản nháp", PUBLISHED: "Đã xuất bản", HIDDEN: "Đang ẩn", ARCHIVED: "Đã lưu trữ" } as Record<string, string>)[exam.status ?? ""] ?? exam.status}</p></div></div>
        <div className="flex flex-wrap items-center gap-2">
          {publishedVersions.length > 0 && (exam.status === "HIDDEN" || exam.status === "PUBLISHED") && <Button variant="outline" disabled={changeStatus.isPending} onClick={() => void toggleExamVisibility()}>{exam.status === "HIDDEN" ? "Hiển thị kỳ thi cho học viên" : "Ẩn kỳ thi"}</Button>}
          <Button onClick={() => {resetForm(); setShowCreate(true); setEditing(null);}}><Plus className="mr-2 size-4"/>Tạo phiên bản đề thi</Button>
        </div>
      </div>

      {exam.status === "HIDDEN" && publishedVersions.length > 0 && <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">Phiên bản đề thi đã được xuất bản nhưng kỳ thi đang ẩn. Để học viên tham gia, hãy bật hiển thị và kiểm tra lại lịch thi.</p>}
      {showCreate && <Card className="rounded-2xl border shadow-sm"><CardHeader className="pb-4"><CardTitle className="text-xl">Tạo phiên bản đề thi</CardTitle><p className="mt-1 text-sm text-muted-foreground">Chọn cách lập đề, sau đó thiết lập nội dung, quy chế và lịch tổ chức.</p></CardHeader><CardContent className="space-y-6">
        <div role="group" aria-label="Cách tạo đề thi" className="grid gap-4 md:grid-cols-2">
          <button type="button" aria-pressed={selectionMode === "AUTO_MATRIX"} onClick={() => {setSelectionMode("AUTO_MATRIX"); setManualQuestionIds([]);}} className={`group relative flex min-h-36 items-start gap-4 rounded-2xl border-2 p-5 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${selectionMode === "AUTO_MATRIX" ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"}`}>
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${selectionMode === "AUTO_MATRIX" ? "bg-primary text-primary-foreground" : "bg-muted text-primary"}`}><Shuffle className="size-5"/></span>
            <span className="min-w-0 flex-1"><span className="block text-base font-semibold">Tạo đề tự động</span><span className="mt-2 block text-sm leading-6 text-muted-foreground">Hệ thống phân bổ câu hỏi theo cấu trúc và số lượng đã thiết lập.</span></span>
            {selectionMode === "AUTO_MATRIX" && <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label="Đã chọn"><Check className="size-4"/></span>}
          </button>
          <button type="button" aria-pressed={selectionMode === "MANUAL"} onClick={() => {setSelectionMode("MANUAL"); setManualQuestionIds([]);}} className={`group relative flex min-h-36 items-start gap-4 rounded-2xl border-2 p-5 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${selectionMode === "MANUAL" ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"}`}>
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${selectionMode === "MANUAL" ? "bg-primary text-primary-foreground" : "bg-muted text-primary"}`}><ListChecks className="size-5"/></span>
            <span className="min-w-0 flex-1"><span className="block text-base font-semibold">Tự chọn câu hỏi</span><span className="mt-2 block text-sm leading-6 text-muted-foreground">Chọn từng câu trong ngân hàng để lập đề phù hợp với cấu trúc.</span></span>
            {selectionMode === "MANUAL" && <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label="Đã chọn"><Check className="size-4"/></span>}
          </button>
        </div>
        <div className="grid gap-x-5 gap-y-[0.5cm] md:grid-cols-2">
          <Field label="Tên phiên bản *" className="md:col-span-2"><Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Nhập tên phiên bản đề thi" /></Field>
          <Field label="Hạng GPLX *"><select value={licenseClass} onChange={(e)=>chooseLicense(e.target.value)} disabled={!licenseCatalog.isSuccess} className="h-10 w-full rounded-lg border bg-white px-3 text-sm"><option value="">{licenseCatalog.isLoading ? "Đang tải danh mục..." : "Chọn hạng GPLX"}</option>{licenseOptions.map((item)=><option key={item.code} value={item.code}>{item.code} — {item.title}</option>)}</select>{licenseCatalog.isError && <p className="text-xs text-red-600">Không tải được danh mục hạng GPLX. Vui lòng thử lại.</p>}</Field>
          <Field label="Phiên bản ngân hàng câu hỏi"><Input readOnly value={bankVersion} placeholder="Tự động điền từ hạng GPLX" /></Field>
          <Field label="Chương câu hỏi *"><select value={anchorId} onChange={(e)=>{setAnchorId(e.target.value); if (selectionMode === "MANUAL") {setManualTab(e.target.value === "__ALL__" ? "ALL" : e.target.value);setVisibleLimit(50);}}} className="h-10 w-full rounded-lg border bg-white px-3 text-sm" disabled={!bankQuery.data || bankQuery.isError}><option value="__ALL__">Tất cả chương (theo ma trận)</option>{chapters.map((c)=> <option key={c.id} value={c.id}>{c.title}</option>)}</select><p className="mt-2 text-xs text-muted-foreground">Tùy chọn xem chương; khi tạo đề, hệ thống vẫn dùng ma trận đã chọn để phân bổ câu hỏi.</p>{bankQuery.isError && <p className="text-xs text-red-600">Không tải được ngân hàng câu hỏi. Vui lòng thử lại hoặc kiểm tra quyền truy cập.</p>}</Field>
          <Field label="Cấu trúc đề thi *"><select value={structureId} onChange={(e)=>{setStructureId(e.target.value);setManualQuestionIds([]);}} className="h-10 w-full rounded-lg border bg-white px-3 text-sm"><option value="">Chọn cấu trúc đề</option>{structures.map((x: {id: string;title: string})=><option key={x.id} value={x.id}>{x.title}</option>)}</select></Field>
          {matrixProblem && structureId && <div role="alert" className="md:col-span-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"><p>{matrixProblem}</p><a className="mt-2 inline-block font-semibold underline" href={`/admin/exams/structures/create?edit=${encodeURIComponent(structureId)}`}>Cập nhật ma trận đề thi</a></div>}
          <Field label="Quy chế thi *"><select value={ruleId} onChange={(e)=>setRuleId(e.target.value)} className="h-10 w-full rounded-lg border bg-white px-3 text-sm"><option value="">Chọn quy chế</option>{rules.map((x: {id: string;title: string})=><option key={x.id} value={x.id}>{x.title}</option>)}</select></Field>
          <Field label="Tiêu chí chấm điểm *"><select value={criteriaId} onChange={(e)=>setCriteriaId(e.target.value)} className="h-10 w-full rounded-lg border bg-white px-3 text-sm"><option value="">Chọn tiêu chí</option>{criterias.map((x)=><option key={x.id} value={x.id}>{x.title}</option>)}</select></Field>
          <Field label="Thời gian bắt đầu *"><Input type="datetime-local" value={startAt} onChange={(e)=>setStartAt(e.target.value)}/></Field>
          <Field label="Thời gian kết thúc *"><Input type="datetime-local" value={endAt} onChange={(e)=>setEndAt(e.target.value)}/></Field>
        </div>
        {selectionMode === "MANUAL" && <div className="space-y-5 rounded-xl border p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold">Danh sách câu hỏi lựa chọn</h3><p className="text-xs text-muted-foreground">Đã chọn {manualQuestionIds.length}/{requiredQuestionCount || "chưa chọn cấu trúc"} câu. Hãy chọn theo số lượng của từng phần thi.</p></div><Input className="w-full sm:max-w-sm" placeholder="Tìm theo nội dung hoặc mã câu hỏi" value={questionSearch} onChange={(e)=>{setQuestionSearch(e.target.value);setVisibleLimit(50);}} /></div>
          {selectedStructure && !matrixProblem && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Chỉ tiêu từng phần thi">
            {manualSections.map((section, index) => <div key={`${section.code}-${index}`} className={`rounded-lg border p-3 text-sm ${section.critical ? "border-amber-300 bg-amber-50/60" : "bg-muted/20"}`}>
              <div className="font-medium">{section.title}{section.critical ? " · Điểm liệt" : ""}</div>
              <div className="mt-2 font-semibold tabular-nums">{manualState.assignedBySection[index] ?? 0}/{section.questionCount} câu</div>
            </div>)}
          </div>}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc câu hỏi theo chương">
            {[{id: "ALL", title: "Tất cả"}, ...chapters.map((chapter, index) => ({id: chapter.id, title: chapter.title || `Chương ${index + 1}`})), {id: "CRITICAL", title: "Câu điểm liệt"}, {id: "SELECTED", title: `Đã chọn (${manualQuestionIds.length})`}].map((tab) =>
              <button type="button" key={tab.id} aria-pressed={manualTab === tab.id} onClick={()=>{setManualTab(tab.id);setVisibleLimit(50);}}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${manualTab === tab.id ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>{tab.title}</button>)}
          </div>
          {selectedStructure && <p role="status" className={`text-sm ${manualState.complete ? "text-emerald-700" : "text-muted-foreground"}`}>{manualState.message}</p>}
          {!bankVersion || !licenseClass ? <p className="text-sm text-muted-foreground">Chọn hạng GPLX để tải ngân hàng câu hỏi.</p> : bankQuery.isLoading || detailQuery.isPending ? <p className="text-sm text-muted-foreground">Đang tải danh sách câu hỏi...</p> : detailQuery.isError ? <p role="alert" className="text-sm text-red-600">Không tải được nội dung câu hỏi: {detailQuery.error instanceof Error ? detailQuery.error.message : "Vui lòng thử lại"}. <Button type="button" variant="outline" size="sm" onClick={() => void detailQuery.refetch()}>Thử lại</Button></p> : bankQuestions.length !== bankQuery.data?.questions.length ? <p role="alert" className="text-sm text-red-600">Danh sách câu hỏi chưa tải đầy đủ. Vui lòng thử lại trước khi lập đề.</p> : <>
            <div className="max-h-[32rem] space-y-2 overflow-y-auto" aria-label="Câu hỏi trong chương đang chọn">
              {filteredQuestions.length === 0 && <p className="rounded-lg border p-4 text-sm text-muted-foreground">Không có câu hỏi phù hợp với bộ lọc hiện tại.</p>}
              {filteredQuestions.slice(0, visibleLimit).map((q)=> <label key={q.id} className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/40">
                <input type="checkbox" checked={selectedQuestionSet.has(q.id)} disabled={Boolean(matrixProblem) || !selectedStructure} onChange={(e)=>toggleManualQuestion(q.id, e.target.checked)} className="mt-1 size-4"/>
                <span className="min-w-0 flex-1"><span className="block text-sm">{q.displayNo != null ? `#${q.displayNo} · ` : ""}{q.text}</span>
                <span className="mt-2 block text-xs text-muted-foreground">{q.chapterTitle}{q.isCritical ? " · Câu điểm liệt" : ""}</span></span>
                {q.isCritical && <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">Điểm liệt</span>}
              </label>)}
            </div>
            {filteredQuestions.length > visibleLimit && <Button type="button" variant="outline" onClick={()=>setVisibleLimit((limit)=>limit+50)}>Xem thêm câu ({filteredQuestions.length-visibleLimit} còn lại)</Button>}
            <p className="text-sm text-muted-foreground">Kiểm tra số lượng câu theo từng phần và câu điểm liệt trước khi lưu phiên bản.</p>
          </>}
        </div>}
        <Field label="Hướng dẫn dự thi"><textarea className="min-h-24 w-full rounded-lg border p-3 text-sm" value={instructions} onChange={(e)=>setInstructions(e.target.value)} placeholder="Mỗi hướng dẫn trên một dòng"/></Field>
        <p className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">Phiên bản được lưu ở trạng thái bản nháp. Bạn có thể kiểm tra lại cấu hình trước khi xuất bản.</p>
        <div className="flex justify-end gap-3"><Button variant="outline" onClick={()=>setShowCreate(false)} disabled={isBusy}>Hủy</Button><Button onClick={()=>void handleCreate()} disabled={isBusy || bankQuery.isLoading || !licenseCatalog.isSuccess || Boolean(matrixProblem) || (selectionMode === "MANUAL" && (!detailQuery.isSuccess || !manualState.complete))}>{create.isPending && <Loader2 className="mr-2 size-4 animate-spin"/>}Lưu bản nháp</Button></div>
      </CardContent></Card>}

      <Card className="rounded-2xl"><CardHeader><CardTitle>Các phiên bản đề thi</CardTitle></CardHeader><CardContent>
        {versionsLoading ? <p className="py-12 text-center text-muted-foreground">Đang tải phiên bản...</p> : versions.length === 0 ? <p className="py-12 text-center text-muted-foreground">Chưa có phiên bản đề thi. Hãy tạo bản nháp và kiểm tra cấu hình trước khi xuất bản.</p> : <div className="overflow-x-auto"><table className="min-w-[940px] w-full text-left text-sm"><thead><tr className="border-b text-muted-foreground"><th className="p-3">Phiên bản</th><th className="p-3">Tên phiên bản</th><th className="p-3">Hình thức lập đề</th><th className="p-3">Lịch thi</th><th className="p-3">Trạng thái</th><th className="min-w-[300px] p-3 text-right whitespace-nowrap">Thao tác</th></tr></thead><tbody>{versions.map((v)=> <tr key={v.id} className="border-b last:border-0"><td className="p-3">v{v.versionNo}</td><td className="p-3 font-semibold">{v.title}</td><td className="p-3"><BookOpen className="mr-1 inline size-4"/>{v.selectionMode === "MANUAL" ? "Tự chọn câu hỏi" : "Tạo đề tự động"}<span className="mt-1 block text-xs text-muted-foreground">Hạng {v.licenseClass ?? "—"} · {v.bankVersion ?? "—"}</span></td><td className="p-3 text-xs">{v.startedAt ? new Date(v.startedAt).toLocaleString("vi-VN") : "—"} → {v.endedAt ? new Date(v.endedAt).toLocaleString("vi-VN") : "—"}</td><td className="p-3"><Badge variant="secondary">{({ DRAFT: "Bản nháp", PUBLISHED: "Đã xuất bản", HIDDEN: "Đang ẩn", ARCHIVED: "Đã lưu trữ" } as Record<string, string>)[v.status] ?? v.status}</Badge></td><td className="p-3 whitespace-nowrap"><div className="flex flex-nowrap items-center justify-end gap-1.5">{v.status === "DRAFT" && <><Button size="sm" variant="outline" onClick={()=>openEdit(v)} disabled={isBusy}><Pencil className="mr-1 size-3"/>Sửa</Button><Button size="sm" onClick={()=>void changeVersion(v,"publish")} disabled={isBusy}><Send className="mr-1 size-3"/>Xuất bản</Button><Button size="sm" variant="ghost" onClick={()=>void changeVersion(v,"delete")} disabled={isBusy}><Trash2 className="size-4"/></Button></>}{v.status === "PUBLISHED" && <Button size="sm" variant="outline" onClick={()=>void changeVersion(v,"archive")} disabled={isBusy}><Archive className="mr-1 size-3"/>Lưu trữ</Button>}<Button size="sm" variant="outline" onClick={()=>void changeVersion(v,"clone")} disabled={isBusy}><Copy className="mr-1 size-3"/>Sao chép</Button></div></td></tr>)}</tbody></table></div>}
      </CardContent></Card>

      <Card className="rounded-2xl"><CardHeader><CardTitle>Công bố kết quả thi</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Chỉ áp dụng cho các bài thi được thiết lập công bố kết quả thủ công. Nhập mã phiên thi cần công bố, sau đó xác nhận.</p><div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center"><Input aria-label="Mã phiên thi" className="w-full min-w-0 flex-1" placeholder="Nhập mã phiên thi" value={releaseSessionId} onChange={(e)=>setReleaseSessionId(e.target.value)}/><Button className="w-full shrink-0 whitespace-nowrap sm:ml-auto sm:w-auto" onClick={()=>void releaseResult()} disabled={releasing || !releaseSessionId.trim()}>{releasing && <Loader2 className="mr-2 size-4 animate-spin"/>}Công bố kết quả</Button></div></CardContent></Card>

      {editing && <Card className="rounded-2xl"><CardHeader><CardTitle>{editing.status === "DRAFT" ? "Chỉnh sửa bản nháp" : "Chi tiết phiên bản"}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Mã phiên bản: {editing.id}. Để thay đổi hạng GPLX hoặc ngân hàng câu hỏi, hãy sao chép thành phiên bản mới.</p><div className="grid gap-4 md:grid-cols-2"><Field label="Tên phiên bản"><Input disabled={editing.status !== "DRAFT"} value={title} onChange={(e)=>setTitle(e.target.value)}/></Field><Field label="Bắt đầu"><Input type="datetime-local" disabled={editing.status !== "DRAFT"} value={startAt} onChange={(e)=>setStartAt(e.target.value)}/></Field><Field label="Kết thúc"><Input type="datetime-local" disabled={editing.status !== "DRAFT"} value={endAt} onChange={(e)=>setEndAt(e.target.value)}/></Field><Field label="Cấu trúc"><select className="h-10 w-full rounded-lg border bg-white px-3" disabled={editing.status !== "DRAFT"} value={structureId} onChange={(e)=>setStructureId(e.target.value)}><option value="">Chọn</option>{structures.map((x: {id:string;title:string})=><option key={x.id} value={x.id}>{x.title}</option>)}</select></Field><Field label="Quy chế"><select className="h-10 w-full rounded-lg border bg-white px-3" disabled={editing.status !== "DRAFT"} value={ruleId} onChange={(e)=>setRuleId(e.target.value)}><option value="">Chọn</option>{rules.map((x: {id:string;title:string})=><option key={x.id} value={x.id}>{x.title}</option>)}</select></Field><Field label="Tiêu chí"><select className="h-10 w-full rounded-lg border bg-white px-3" disabled={editing.status !== "DRAFT"} value={criteriaId} onChange={(e)=>setCriteriaId(e.target.value)}><option value="">Chọn</option>{criterias.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></Field></div><Field label="Hướng dẫn"><textarea className="min-h-24 w-full rounded-lg border p-3 text-sm" disabled={editing.status !== "DRAFT"} value={instructions} onChange={(e)=>setInstructions(e.target.value)}/></Field><div className="flex justify-end gap-3"><Button variant="outline" onClick={()=>setEditing(null)}>Đóng</Button>{editing.status === "DRAFT" && <Button onClick={()=>void saveEdit()} disabled={isBusy}>Lưu thay đổi</Button>}</div></CardContent></Card>}
    </div>
  );
}

function Field({label,children,className}:{label:string;children:React.ReactNode;className?:string}) {return <div className={`min-w-0 space-y-[0.5cm] ${className ?? ""}`}><label className="block text-sm font-semibold text-[#475467]">{label}</label>{children}</div>;}
