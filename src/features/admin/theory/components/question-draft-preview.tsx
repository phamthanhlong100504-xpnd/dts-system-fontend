import { MediaImage } from "@/components/ui/media-image";

export function QuestionDraftPreview({ content, options, explanation, mediaId }: {
  content: string; options: { id: string; text: string; isCorrect: boolean }[]; explanation: string; mediaId: string | null;
}) {
  return <details className="rounded-xl border bg-card p-5">
    <summary className="cursor-pointer text-[18px]/7 font-semibold">Xem trước nội dung đang nhập</summary>
    <div className="mt-4 space-y-4 text-[15px]/7">
      <p className="text-[14px]/6 text-muted-foreground">Bản xem trước trong Admin. Nội dung chưa được công bố hoặc đưa vào bộ đề chuẩn.</p>
      <p className="whitespace-pre-line font-medium">{content || "Chưa nhập nội dung câu hỏi."}</p>
      {mediaId && <MediaImage src={mediaId} alt="Ảnh minh họa đã chọn" className="mx-auto max-h-64 max-w-full rounded-lg border object-contain" />}
      <ol className="space-y-2">{options.map((option, index) => <li key={option.id} className={`rounded-lg border p-3 ${option.isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100" : ""}`}>
        <span className="font-semibold">{index + 1}. </span>{option.text || "Chưa nhập đáp án"}{option.isCorrect && " · Được chọn đúng"}
      </li>)}</ol>
      {explanation && <p className="whitespace-pre-line rounded-lg bg-muted/30 p-3"><strong>Giải thích: </strong>{explanation}</p>}
    </div>
  </details>;
}
