"use client";
import {LifecyclePanel} from "../../workbench/components/lifecycle-panel";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import styles from "@/features/admin/examination/admin-exam-visual.module.css";
import { MediaImage } from "@/components/ui/media-image";
import { Button } from "@/components/ui/button";
import { examVersionChanges } from "../exam-version-comparison";
import type { ExamVersionItem } from "../../admin-examination-service";
import { fetchOfficialBank, fetchOfficialBankDetails } from "../../official-bank-service";
import { useAdminAccess } from "../../foundation/admin-access-provider";
import { AdminPageState } from "../../foundation/components/admin-page-state";
import { adminStatusLabel } from "../../foundation/admin-ui-labels";

function readable(value: unknown) { return value === undefined || value === null || value === "" ? "Chưa có thông tin" : String(value); }
export function ExamVersionInspection({ version, previous, onClose, hidden }: { version: ExamVersionItem; previous?: ExamVersionItem; onClose: () => void; hidden: boolean }) {
  const { access, can, error } = useAdminAccess();
  const canPreview = !error && can("questions", "read") && version.status === "DRAFT" && version.selectionMode === "MANUAL" && Boolean(version.licenseClass && version.bankVersion && version.manualQuestionIds?.length);
  const source = useQuery({
    queryKey: ["admin", "official-version-preview", access?.actorId, version.id, version.updatedAt, version.bankVersion, version.licenseClass, version.manualQuestionIds], enabled: canPreview, retry: false, staleTime: 0, gcTime: 0, queryFn: async ({ signal }) => {
      const bank = await fetchOfficialBank(version.bankVersion!, version.licenseClass!, signal), ids = version.manualQuestionIds!;
      if (new Set(ids).size !== ids.length || ids.some(id => !bank.questions.some(q => q.id === id))) throw new Error("Danh sách câu hỏi chưa khớp ngân hàng và hạng GPLX. Vui lòng kiểm tra lại bản nháp.");
      const subset = { ...bank, questions: ids.map(id => bank.questions.find(q => q.id === id)!) };
      return fetchOfficialBankDetails(subset, signal);
    }
  });
  const changes = previous ? examVersionChanges(previous, version) : [];
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className={styles.dialog}><DialogHeader><DialogTitle>Phiên bản {version.versionNo} — {version.title}</DialogTitle><DialogDescription>Xem thông tin phiên bản và những thay đổi so với phiên bản trước.</DialogDescription></DialogHeader>
    {hidden && <p className="rounded-xl border border-amber-300 p-4 text-[15px]/6 text-amber-800">Kỳ thi đang ẩn, phiên bản đã công bố chưa đồng nghĩa học viên có thể tham gia.</p>}
    <dl className="grid gap-4 text-[15px]/6 sm:grid-cols-2">{[["Trạng thái", adminStatusLabel(version.status)], ["Hạng GPLX", version.licenseClass], ["Phiên bản ngân hàng", version.bankVersion], ["Hình thức lập đề", version.selectionMode === "MANUAL" ? "Tự chọn câu hỏi" : version.selectionMode === "AUTO_MATRIX" ? "Tạo đề tự động" : undefined], ["Số câu", version.totalQuestions], ["Thời gian", version.durationSeconds != null ? `${version.durationSeconds / 60} phút` : undefined], ["Số câu cần đúng", version.passingCorrectAnswers], ["Số câu điểm liệt", version.criticalQuestionCount], ["Bắt đầu", version.startedAt ? new Date(version.startedAt).toLocaleString("vi-VN") : undefined], ["Kết thúc", version.endedAt ? new Date(version.endedAt).toLocaleString("vi-VN") : undefined]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{readable(value)}</dd></div>)}</dl>
    {version.metadata?.instructions && <p className="whitespace-pre-line rounded-xl border p-4 text-[15px]/7">{version.metadata.instructions}</p>}
    <section className="space-y-3 rounded-xl border p-4"><h3>Đối chiếu phiên bản</h3>{previous ? <><p className="text-[14px]/6 text-muted-foreground">So với phiên bản {previous.versionNo}</p>{changes.length ? <ul className="list-disc space-y-2 pl-5 text-[15px]/6">{changes.map(label => <li key={label}>{label}</li>)}</ul> : <p className="text-[15px]/6">Không có thay đổi ở các thông tin được so sánh.</p>}</> : <p className="text-[15px]/6 text-muted-foreground">Chưa có phiên bản trước để đối chiếu.</p>}</section>
    {version.status !== "DRAFT" ? <p className="text-[14px]/6 text-muted-foreground">Nội dung bài thi của học viên được giữ theo phiên bản khi bắt đầu. Màn này chỉ hiển thị cấu hình đề, không mở đáp án của phiên đang thi.</p> : version.selectionMode === "AUTO_MATRIX" ? <p className="text-[14px]/6 text-muted-foreground">Câu hỏi sẽ được hệ thống lựa chọn theo ma trận. Danh sách câu cụ thể chưa được hiển thị ở bước xem cấu hình này.</p> : !canPreview ? <p className="text-[14px]/6 text-muted-foreground">Chưa thể xem danh sách câu hỏi. Cần có quyền tra cứu ngân hàng và đầy đủ thông tin của bản nháp.</p> : source.isPending ? <AdminPageState state="loading" title="Đang tải câu hỏi của bản nháp" /> : source.isError ? <AdminPageState state="error" error={source.error} onRetry={() => void source.refetch()} /> : <section className="space-y-4"><h3>Câu hỏi theo thứ tự đã chọn</h3><p className="text-[14px]/6 text-muted-foreground">Xem nội dung nguồn của bản nháp, điều kiện sử dụng được kiểm tra lại khi công bố.</p>{source.data?.questions.map((q, index) => <article key={q.id} className="space-y-3 rounded-xl border p-4"><p className="text-[16px]/7 font-semibold">Câu {index + 1}{q.isCritical ? " · Điểm liệt" : ""}</p><p className="whitespace-pre-line text-[15px]/7">{q.content}</p>{q.chapterNumber != null && <p className="text-[14px]/6 text-muted-foreground">Chương {q.chapterNumber}</p>}{q.mediaFileIds.map(id => <MediaImage key={id} src={id} alt="Minh họa câu hỏi" className="mx-auto max-h-56 max-w-full rounded-lg object-contain" />)}{q.options.map((o, i) => <p key={o.id} className="text-[15px]/6">{i + 1}. {o.text}{o.isCorrect ? " · Đáp án đúng" : ""}</p>)}{q.explanation && <p className="whitespace-pre-line text-[15px]/7"><strong>Giải thích: </strong>{q.explanation}</p>}</article>)}</section>}
    <LifecyclePanel key={version.id} subject={{kind:"EXAM_VERSION",id:version.id}}/>
    <div className="dts-admin-actions"><Button variant="outline" onClick={onClose}>Đóng</Button></div>
  </DialogContent></Dialog>;
}
