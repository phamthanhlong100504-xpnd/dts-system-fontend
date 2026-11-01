"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { QuestionImage } from "@/components/ui/question-image";
import { useExamReview } from "@/features/examination/use-examination";

type ReviewOption = { id: string; content?: string | null; isCorrect?: boolean | null };
type ReviewQuestion = { id?: string; content?: string; isCritical?: boolean; mediaFileIds?: string[]; imageUrl?: string; isCorrect?: boolean | null; options?: ReviewOption[]; userAnswer?: { value?: string | null } | null; explanation?: string | null };

export default function ExamReviewPage() {
  return <RequireAuth><ReviewContent /></RequireAuth>;
}

function ReviewContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const query = useExamReview(sessionId);

  if (query.isLoading) {
    return <main className="font-dts min-h-[calc(100vh-64px)] bg-[#f7f6fb] p-12 text-center text-[15.5px] text-[#475467]">Đang tải nội dung bài thi được phép xem lại...</main>;
  }

  if (query.isError || !query.data) {
    return (
      <main className="font-dts min-h-[calc(100vh-64px)] bg-[#f7f6fb] px-5 py-12 text-[#101828]">
        <section className="mx-auto max-w-[800px] rounded-[18px] border border-[#dedfea] bg-white px-7 py-12 text-center shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
          <h1 className="text-[23px] font-bold">Chưa thể xem lại bài thi</h1>
          <p className="mx-auto mt-3 max-w-[570px] text-[15.5px] leading-7 text-[#475467]">{query.error instanceof Error ? query.error.message : "Bài thi hiện chưa được phép xem lại theo quy chế."}</p>
          <button type="button" onClick={() => router.push(`/examination/result/${sessionId}`)} className="mt-6 min-h-11 rounded-[10px] bg-[#0758d9] px-6 text-[14.5px] font-semibold text-white hover:bg-[#064fc3]">Quay lại kết quả</button>
        </section>
      </main>
    );
  }

  const questions = (query.data.questions ?? []) as ReviewQuestion[];

  return (
    <main className="font-dts min-h-[calc(100vh-64px)] bg-[#f7f6fb] pb-16 pt-7 text-[#101828]">
      <div className="px-5 lg:px-[1cm]">
        <button type="button" onClick={() => router.push(`/examination/result/${sessionId}`)} className="inline-flex items-center gap-2 rounded-[8px] py-2 text-[14.5px] font-medium text-[#344054] transition hover:text-[#0758d9]">
          <ArrowLeft className="size-4" /> Quay lại kết quả
        </button>
      </div>

      <div className="mx-auto mt-6 w-full max-w-[1200px] px-5 sm:px-7">
        <header className="mb-7">
          <h1 className="text-[27px] font-bold tracking-[-0.025em]">Xem lại bài thi</h1>
          <p className="mt-2 text-[14.5px] font-medium leading-6 text-[#475467]">Xem lại các câu hỏi, đáp án và giải thích được phép hiển thị theo quy chế thi.</p>
        </header>

        <div className="space-y-5">
          {questions.map((q, index) => {
            const selected = (q.userAnswer?.value ?? "").split(",").filter(Boolean);
            const imageSources = q.mediaFileIds?.length
              ? q.mediaFileIds
              : q.imageUrl ? [q.imageUrl] : [];
            return (
              <article key={q.id ?? index} className="rounded-[18px] border border-[#dedfea] bg-white px-6 py-7 shadow-[0_4px_14px_rgba(31,41,55,0.055)] sm:px-8">
                <div className="mb-5 flex flex-nowrap items-center gap-2">
                  <h2 className="inline-flex shrink-0 whitespace-nowrap rounded-[8px] bg-[#eaf1ff] px-3 py-1.5 text-[12.5px] font-bold text-[#0758d9]">Câu {index + 1}</h2>
                  {q.isCritical === true && (
                    <span className="inline-flex shrink-0 whitespace-nowrap rounded-[8px] bg-[#fff2dc] px-3 py-1.5 text-[12.5px] font-semibold text-[#b54708]">Câu điểm liệt</span>
                  )}
                </div>

                <p className="whitespace-pre-line text-[16px] font-semibold leading-[1.65] text-[#101828]">{q.content}</p>
                {imageSources.map(id => (
                  <QuestionImage key={id} src={id} alt={`Ảnh câu ${index + 1}`} className="mt-5" />
                ))}

                <div className="mt-6 space-y-3">
                  {(q.options ?? []).map((option, optionIndex) => {
                    const chosen = selected.includes(option.id);
                    const correctOption = option.isCorrect === true;
                    const wrongChoice = chosen && option.isCorrect === false;
                    return (
                      <div
                        key={option.id}
                        className={`flex items-start gap-3 rounded-[12px] border px-4 py-4 text-[15.5px] font-medium leading-[1.55] ${correctOption ? "border-[#18a566] bg-[#effaf4] text-[#126b46]" : wrongChoice ? "border-[#e34848] bg-[#fff3f2] text-[#9f1f25]" : chosen ? "border-[#0758d9] bg-[#f3f6ff] text-[#101828]" : "border-[#e3e3ee] bg-[#f5f4fb] text-[#27364f]"}`}
                      >
                        <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[14.5px] font-semibold ${correctOption ? "bg-[#dcf7e8] text-[#087443]" : wrongChoice ? "bg-[#ffe5e3] text-[#b42318]" : chosen ? "bg-[#e3ebff] text-[#0758d9]" : "bg-[#e8edff] text-[#56647a]"}`}>
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span className="min-w-0 flex-1">{option.content}</span>
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="mt-6 rounded-[12px] border border-[#dfe8ff] bg-[#f0f5ff] px-5 py-4 text-[15.5px] font-medium leading-7 text-[#344054]">
                    <h3 className="font-bold text-[#101828]">Giải thích</h3>
                    <p className="mt-2 whitespace-pre-line">{q.explanation}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {!questions.length && (
          <div className="rounded-[18px] border border-[#dedfea] bg-white px-8 py-12 text-center text-[15.5px] text-[#475467]">
            Hiện không có câu hỏi nào được phép xem lại theo quy chế thi.
          </div>
        )}
      </div>
    </main>
  );
}
