"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaImage } from "@/components/ui/media-image";
import { useLicenseCatalog } from "@/features/license/use-license";
import { fetchOfficialBank, fetchOfficialBankDetails, type OfficialBankQuestion } from "@/features/admin/official-bank-service";

interface Props {
  view?: "questions" | "chapters";
  onPick?: (question: OfficialBankQuestion) => void;
  excludedIds?: string[];
  isPicking?: boolean;
}

export function OfficialBankBrowser({view = "questions", onPick, excludedIds = [], isPicking = false}: Props) {
  const catalog = useLicenseCatalog();
  const [license, setLicense] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(40);
  const selected = catalog.data?.find((item) => item.code === license);
  const bankVersion = selected?.bankVersion ?? "";
  const bank = useQuery({
    queryKey: ["admin", "official-bank", license, bankVersion],
    queryFn: () => fetchOfficialBank(bankVersion, license),
    enabled: Boolean(license && bankVersion),
    retry: false,
    staleTime: 60_000,
  });
  const detailQuery = useQuery({
    queryKey: ["admin", "official-bank-details", license, bankVersion],
    queryFn: ({ signal }) => fetchOfficialBankDetails(bank.data!, signal),
    enabled: bank.isSuccess,
    retry: false,
    staleTime: 5 * 60_000,
  });
  const detailedBank = detailQuery.data;
  const questions = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("vi-VN");
    return (detailedBank?.questions ?? []).filter((item) => {
      if (chapterId) {
        const chapterIndex = (bank.data?.chapters ?? []).findIndex((c) => c.id === chapterId);
        if (item.chapterId !== chapterId && !item.chapterIds.includes(chapterId) && !(chapterIndex >= 0 && item.chapterNumber === chapterIndex + 1)) return false;
      }
      return !q || item.content.toLocaleLowerCase("vi-VN").includes(q) || item.id.toLowerCase().includes(q);
    });
  }, [bank.data?.chapters, detailedBank, chapterId, search]);
  const excluded = useMemo(() => new Set(excludedIds), [excludedIds]);
  const currentChapter = bank.data?.chapters.find((item) => item.id === chapterId);

  return <div className="space-y-5">
    <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Ngân hàng câu hỏi chính thức</h3>
          <p className="mt-1 text-[14.5px]/5 text-muted-foreground">Xem và tra cứu câu hỏi theo hạng giấy phép lái xe. Nội dung ngân hàng chuẩn chỉ được xem tại đây.</p>
        </div>
        <Badge variant="outline">Ngân hàng chuẩn</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5"><span className="block text-[14.5px]/5 font-medium">Hạng GPLX</span>
          <select aria-label="Hạng GPLX của ngân hàng" className="h-11 w-full rounded-lg border bg-background px-3 text-[14.5px]/5" value={license} disabled={!catalog.isSuccess} onChange={(e) => {setLicense(e.target.value);setChapterId("");setSearch("");setLimit(40);}}>
            <option value="">{catalog.isLoading ? "Đang tải hạng GPLX..." : "Chọn hạng GPLX"}</option>
            {catalog.data?.map((item) => <option key={item.code} value={item.code}>{item.code} — {item.title}</option>)}
          </select>
        </label>
        <label className="space-y-1.5"><span className="block text-[14.5px]/5 font-medium">Phiên bản ngân hàng</span><Input className="h-11" readOnly value={bankVersion} placeholder="Tự động theo hạng GPLX" /></label>
        <label className="space-y-1.5 md:col-span-2"><span className="block text-[14.5px]/5 font-medium">Tìm câu hỏi</span><div className="relative"><Search className="absolute left-3 top-3.5 size-4 text-muted-foreground"/><Input className="h-11 pl-9" value={search} onChange={(e)=>{setSearch(e.target.value);setLimit(40);}} placeholder="Tìm theo nội dung hoặc mã câu"/></div></label>
      </div>
      {catalog.isError && <p role="alert" className="text-[14.5px]/5 text-destructive">Không tải được danh mục hạng GPLX. Vui lòng thử lại.</p>}
      {selected && !selected.bankCountsMatch && <p role="alert" className="text-[14.5px]/5 text-amber-800"><AlertTriangle className="mr-1 inline size-4"/>Số câu trong ngân hàng hiện chưa khớp yêu cầu của hạng GPLX này.</p>}
      {bank.isError && <p role="alert" className="text-[14.5px]/5 text-destructive">Không tải được ngân hàng câu hỏi: {bank.error instanceof Error ? bank.error.message : "Lỗi không xác định"}. Vui lòng kiểm tra quyền truy cập.</p>}
      {bank.isLoading && <p className="flex items-center gap-2 text-[14.5px]/5 text-muted-foreground"><Loader2 className="size-4 animate-spin"/>Đang tải ngân hàng câu hỏi...</p>}
      {detailQuery.isPending && bank.data && <p className="flex items-center gap-2 text-[14.5px]/5 text-muted-foreground"><Loader2 className="size-4 animate-spin"/>Đang tải nội dung câu hỏi và đáp án...</p>}
      {detailQuery.isError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-[14.5px]/5 text-destructive">Không tải được nội dung câu hỏi: {detailQuery.error instanceof Error ? detailQuery.error.message : "Lỗi không xác định"}. Vui lòng thử lại sau ít phút. <Button type="button" size="sm" variant="outline" className="ml-2" onClick={() => void detailQuery.refetch()}>Thử lại</Button></p>}
      {bank.data && <div className="flex flex-wrap gap-3 rounded-xl bg-muted/40 p-3 text-[14.5px]/5"><span><strong>{bank.data.chapters.length}</strong> chương</span><span><strong>{bank.data.questions.length}</strong> câu hỏi</span><span><strong>{bank.data.questions.filter((q)=>q.isCritical).length}</strong> câu điểm liệt</span><span>Hạng <strong>{bank.data.licenseClass}</strong></span></div>}
    </div>

    {bank.data && detailedBank && <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="rounded-2xl border bg-card p-3 shadow-sm h-fit">
        <h4 className="p-2 font-semibold">Danh sách chương</h4>
        <div className="space-y-1.5">
          <button type="button" onClick={()=>{setChapterId("");setLimit(40);}} className={`w-full rounded-lg p-3 text-left text-[14.5px]/5 ${!chapterId ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"}`}>Tất cả chương</button>
          {bank.data.chapters.map((chapter,i)=><button type="button" key={chapter.id} onClick={()=>{setChapterId(chapter.id);setLimit(40);}} className={`flex w-full items-start gap-2 rounded-lg p-3 text-left text-[14.5px]/5 ${chapterId===chapter.id ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"}`}><BookOpen className="mt-0.5 size-4 shrink-0"/><span>{chapter.title.startsWith("Chương ") ? chapter.title : `Chương ${chapter.number ?? i+1}: ${chapter.title}`}</span></button>)}
        </div>
      </div>
      <div className="min-w-0 rounded-2xl border bg-card p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-base font-semibold">{currentChapter ? currentChapter.title : view === "chapters" ? "Câu hỏi theo chương" : "Danh sách câu hỏi"}</h4><span className="text-[14.5px]/5 text-muted-foreground">{questions.length} câu phù hợp</span></div>
        {questions.length === 0 && <p className="rounded-lg bg-muted p-5 text-[14.5px]/5 text-muted-foreground">Không tìm thấy câu hỏi phù hợp. Vui lòng chọn chương khác hoặc thay đổi từ khóa.</p>}
        {questions.slice(0,limit).map((question)=><article key={question.id} className="space-y-3 rounded-xl border p-4">
          <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">Câu {question.displayNo ?? question.id.slice(0, 8)}</Badge>{question.isCritical && <Badge variant="destructive">Điểm liệt</Badge>}<span className="text-[12.5px]/4 text-muted-foreground">{question.id}</span></div>
          <p className="text-[15.5px] font-medium leading-7">{question.content}</p>
          {question.mediaFileIds.map((mediaId)=><MediaImage key={mediaId} src={mediaId} alt="Minh họa câu hỏi" className="mx-auto block max-h-56 max-w-full w-auto rounded-lg border object-contain" />)}
          {question.options.length > 0 && <div className="grid gap-2">{question.options.map((option,i)=><div key={option.id ?? i} className={`rounded-lg border px-3 py-2 text-[14.5px]/5 ${option.isCorrect ? "border-emerald-200 bg-emerald-50" : "bg-muted/30"}`}><span className="mr-2 font-semibold">{String.fromCharCode(65+i)}.</span>{option.text}{option.isCorrect && <span className="ml-2 text-emerald-700">✓</span>}</div>)}</div>}
          {question.explanation && <p className="rounded-lg bg-primary/5 px-3 py-2 text-[14.5px]/5"><strong>Giải thích:</strong> {question.explanation}</p>}
          {onPick && <div className="flex justify-end"><Button type="button" size="sm" disabled={isPicking || excluded.has(question.id)} onClick={()=>onPick(question)}>{excluded.has(question.id) ? "Đã có trong chương" : "Thêm câu hỏi"}</Button></div>}
        </article>)}
        {questions.length > limit && <div className="flex justify-center"><Button type="button" variant="outline" onClick={()=>setLimit((n)=>n+40)}>Hiển thị thêm ({questions.length-limit} câu)</Button></div>}
      </div>
    </div>}
  </div>;
}
