"use client";
import { adminStatusLabel } from "@/features/admin/foundation/admin-ui-labels";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronLeft, ChevronRight, GitBranch, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaImage } from "@/components/ui/media-image";
import { useLicenseCatalog } from "@/features/license/use-license";
import { fetchOfficialBank, fetchOfficialBankDetails, type OfficialBankQuestion } from "../official-bank-service";
import { useAdminAccess } from "../foundation/admin-access-provider";
import { AdminPageState } from "../foundation/components/admin-page-state";
import styles from "@/features/admin/questions/admin-questions.module.css";

interface Props { view?: "questions" | "chapters"; onPick?: (question: OfficialBankQuestion) => void; excludedIds?: string[]; isPicking?: boolean; selectionBankVersion?: string; showVersionLink?: boolean; questionsView?: boolean; chapterVersionHref?: string }
export function OfficialBankBrowser({ view = "questions", onPick, excludedIds = [], isPicking = false, selectionBankVersion, showVersionLink = true, questionsView = false, chapterVersionHref }: Props) {
  const { access, can, error } = useAdminAccess(); const catalog = useLicenseCatalog();
  const refined = questionsView || Boolean(chapterVersionHref);
  const [license, setLicense] = useState(""); const [chapterId, setChapter] = useState(""); const [search, setSearch] = useState("");
  const [critical, setCritical] = useState(false); const [hasMedia, setHasMedia] = useState(false); const [page, setPage] = useState(0);
  const selected = catalog.data?.find((item) => item.code === license); const bankVersion = selected?.bankVersion ?? "";
  const bank = useQuery({ queryKey: ["admin", "official-bank", access?.actorId, license, bankVersion], queryFn: ({ signal }) => fetchOfficialBank(bankVersion, license, signal), enabled: !error && can("questions", "read") && Boolean(license && bankVersion), retry: false, staleTime: 0 });
  const eligible = useMemo(() => (bank.data?.questions ?? []).filter((q) => (!chapterId || q.chapterIds.includes(chapterId)) && (!critical || q.isCritical) && (!hasMedia || q.mediaFileIds.length > 0)), [bank.data, chapterId, critical, hasMedia]);
  const pageSize = 40, totalPages = Math.ceil(eligible.length / pageSize), currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const metadata = eligible.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const details = useQuery({ queryKey: ["admin", "official-bank-page", access?.actorId, license, bankVersion, chapterId, critical, hasMedia, currentPage, metadata.map((q) => q.contentVersion)], queryFn: ({ signal }) => fetchOfficialBankDetails({ ...bank.data!, questions: metadata }, signal), enabled: !error && bank.isSuccess && metadata.length > 0, retry: false, staleTime: 0, gcTime: 0 });
  const questions = (details.data?.questions ?? []).filter((q) => `${q.content} ${q.id}`.toLocaleLowerCase("vi-VN").includes(search.trim().toLocaleLowerCase("vi-VN")));
  const excluded = new Set(excludedIds);
  const reset = () => { setChapter(""); setPage(0); setSearch(""); setCritical(false); setHasMedia(false); };
  return <div className="space-y-5">
    <section className={refined ? styles.browserCard : "space-y-4 rounded-2xl border bg-card p-5 shadow-sm"}>
      <div className={refined ? styles.browserHeader : "flex flex-wrap items-start justify-between gap-3"}><div><h3 className={refined ? "text-[18px] font-bold" : undefined}>{view === "chapters" ? "Chương ngân hàng chuẩn" : "Ngân hàng câu hỏi chuẩn"}</h3><p className={refined ? styles.browserDescription : "mt-2 text-[15px]/6 text-muted-foreground"}>{view === "chapters" ? "Xem chương và câu hỏi theo từng hạng GPLX." : "Tra cứu ngân hàng chuẩn theo hạng GPLX và phiên bản đã chọn."}</p></div>{showVersionLink && <Button asChild size="sm" variant="outline"><Link href="/admin/questions/banks"><GitBranch className="size-4" />Phiên bản & Bản nháp</Link></Button>}</div>
      <div className={chapterVersionHref ? "grid items-end gap-4 md:grid-cols-2" : refined ? styles.filtersGrid : "grid items-end gap-4 md:grid-cols-2 xl:grid-cols-3"}>
        <label className="flex flex-col gap-2 text-[15px] font-medium">Hạng GPLX<select aria-label="Hạng GPLX của ngân hàng" className={refined ? styles.select : "h-11 rounded-lg border bg-background px-3"} value={license} disabled={!catalog.isSuccess} onChange={(e) => { setLicense(e.target.value); reset(); }}><option value="">Chọn hạng GPLX</option>{catalog.data?.map((item) => <option key={item.code} value={item.code}>{item.code} — {item.title}</option>)}</select></label>
        <label className="flex flex-col gap-2 text-[15px] font-medium">{refined ? "Phiên bản áp dụng" : "Phiên bản theo danh mục hạng"}{refined ? <span className={styles.readonlyVersion} aria-label="Phiên bản ngân hàng chuẩn">{bankVersion || "Chọn hạng trước"}</span> : <select aria-label="Phiên bản ngân hàng chuẩn" className="h-11 rounded-lg border bg-background px-3" value={bankVersion} disabled={!selected} onChange={() => { }}><option value={bankVersion}>{bankVersion || "Chọn hạng trước"}</option></select>}</label>
        {chapterVersionHref ? (
          <div className="flex w-full flex-wrap items-end gap-4 md:col-span-2">
            <label className="flex min-w-[220px] flex-1 flex-col gap-2 text-[15px] font-medium">
              Tìm trong trang đang xem
              <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className={styles.browserInput} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm nội dung câu hỏi" /></div>
            </label>
            <Button asChild variant="outline" className="ml-auto h-11 shrink-0 whitespace-nowrap rounded-xl border-[#d9deea] px-5 font-semibold">
              <Link href={chapterVersionHref}><GitBranch aria-hidden="true" className="size-4" />Phiên bản chương</Link>
            </Button>
          </div>
        ) : (
          <label className="flex flex-col gap-2 text-[15px] font-medium">Tìm trong trang đang xem<div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className={refined ? styles.browserInput : "h-11 pl-9"} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nội dung hoặc mã câu hỏi" /></div></label>
        )}
      </div>
      <div className={refined ? styles.checkboxRow : "flex flex-wrap gap-5 text-[14px]/6"}><label className="flex items-center gap-2"><input type="checkbox" checked={critical} onChange={(e) => { setCritical(e.target.checked); setPage(0); setSearch(""); }} />Chỉ câu điểm liệt theo hạng</label><label className="flex items-center gap-2"><input type="checkbox" checked={hasMedia} onChange={(e) => { setHasMedia(e.target.checked); setPage(0); setSearch(""); }} />Chỉ câu có ảnh minh họa</label></div>
      {catalog.isError && <AdminPageState state="error" title="Không tải được danh mục hạng GPLX" error={catalog.error} onRetry={() => void catalog.refetch()} />}
      {selected && !selected.bankCountsMatch && <p role="alert" className="text-[14px]/6 text-amber-800">{refined ? "Số lượng câu hỏi của hạng này chưa khớp. Vui lòng kiểm tra trước khi sử dụng." : "Danh mục cho biết số câu chưa khớp chính sách của hạng. Chưa xác nhận ngân hàng đủ điều kiện sử dụng."}</p>}
      {bank.data && <div className={refined ? styles.browserStats : "flex flex-wrap gap-3 rounded-xl bg-muted/40 p-3 text-[15px]/6"}><span><strong>{bank.data.questions.length}</strong> câu thuộc hạng {bank.data.licenseClass}</span><span>{bank.data.chapters.length} chương</span><span>{bank.data.questions.filter((q) => q.isCritical).length} câu điểm liệt</span><span>{eligible.length} câu theo bộ lọc</span></div>}
      {!refined && <p className="text-[14px]/6 text-muted-foreground">Mỗi trang hiển thị tối đa 40 câu hỏi. Ô tìm kiếm áp dụng cho trang đang xem.</p>}
    </section>
    {bank.isError ? <AdminPageState state="error" error={bank.error} onRetry={() => void bank.refetch()} /> : bank.isLoading ? <AdminPageState state="loading" title="Đang đọc ngân hàng chuẩn" /> : bank.data && <div className={refined ? styles.browserBody : "grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]"}>
      <aside className={refined ? styles.chapterAside : "h-fit space-y-2 rounded-2xl border bg-card p-3"}><h4 className={refined ? styles.chapterTitle : "p-2 text-[16px] font-semibold"}>{view === "chapters" ? "Chương chuẩn" : "Lọc theo chương"}</h4><Button type="button" variant={!chapterId ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => { setChapter(""); setPage(0); setSearch(""); }}>Tất cả chương</Button>{bank.data.chapters.map((c) => <Button key={c.id} type="button" variant={chapterId === c.id ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => { setChapter(c.id); setPage(0); setSearch(""); }}><BookOpen className="size-4" />{c.title}</Button>)}</aside>
      <section className={refined ? styles.questionPanel : "min-w-0 space-y-4 rounded-2xl border bg-card p-4 shadow-sm"}>
        {details.isError ? <AdminPageState state="error" title={refined ? "Không tải được câu hỏi" : "Thông tin câu hỏi chưa đồng nhất"} error={details.error} onRetry={() => { void bank.refetch(); void details.refetch(); }} /> : metadata.length > 0 && details.isPending ? <AdminPageState state="loading" title="Đang tải trang câu hỏi" /> : questions.length === 0 ? <AdminPageState state="empty" title={search ? "Không có kết quả trong trang này" : "Chưa có câu theo bộ lọc"} /> : questions.map((q) => <article key={q.id} className={refined ? styles.questionArticle : "space-y-3 rounded-xl border p-4"}><div className={refined ? styles.questionMeta : "flex flex-wrap items-center gap-2"}><Badge variant="outline">{adminStatusLabel(q.status)}</Badge>{q.isCritical && <Badge variant="destructive">Điểm liệt</Badge>}{!refined && <span className="break-all text-[14px]/5 text-muted-foreground">Mã nội dung: {q.id}</span>}</div><p className={refined ? styles.questionContent : "text-[16px]/7 font-medium"}>{q.content}</p>{q.mediaFileIds.map((id) => <MediaImage key={id} src={id} alt="Minh họa câu hỏi" className="mx-auto max-h-56 max-w-full rounded-lg border object-contain" />)}<div className={refined ? styles.optionsGrid : "grid gap-2"}>{q.options.map((o, i) => <p key={o.id} className={refined ? `${styles.optionItem} ${o.isCorrect ? styles.optionCorrect : ""}` : `rounded-lg border px-3 py-2 text-[15px]/6 ${o.isCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" : "bg-muted/20"}`}><strong>{String.fromCharCode(65 + i)}. </strong>{o.text}{o.isCorrect ? " ✓" : ""}</p>)}</div>{q.explanation && <p className="rounded-lg bg-primary/5 p-3 text-[15px]/6"><strong>Giải thích: </strong>{q.explanation}</p>}{!refined && <details className="text-[14px]/5 text-muted-foreground"><summary className="cursor-pointer">Thông tin đối chiếu</summary><p className="mt-2 break-all">Mã kiểm tra nội dung: {q.contentVersion}</p></details>}{onPick && <Button type="button" size="sm" disabled={isPicking || excluded.has(q.id) || selectionBankVersion !== bankVersion} onClick={() => { if (selectionBankVersion === bankVersion && !excluded.has(q.id)) onPick(q); }}>{excluded.has(q.id) ? "Đã được chọn" : selectionBankVersion !== bankVersion ? "Chưa thể thêm vào phiên bản này" : "Chọn câu nguồn"}</Button>}</article>)}
        {totalPages > 0 && <div className="flex items-center justify-end gap-3"><Button type="button" size="sm" variant="outline" disabled={currentPage === 0 || details.isFetching} onClick={() => { setPage(currentPage - 1); setSearch(""); }} aria-label="Trang câu hỏi trước"><ChevronLeft className="size-4" /></Button><span className="text-[14px]">Trang {currentPage + 1} / {totalPages}</span><Button type="button" size="sm" variant="outline" disabled={currentPage + 1 >= totalPages || details.isFetching} onClick={() => { setPage(currentPage + 1); setSearch(""); }} aria-label="Trang câu hỏi tiếp theo"><ChevronRight className="size-4" /></Button></div>}
      </section>
    </div>}
  </div>;
}
