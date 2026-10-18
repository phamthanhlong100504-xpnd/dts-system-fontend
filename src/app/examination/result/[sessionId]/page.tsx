"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Clock3, Home, RefreshCcw, Target, Trophy } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { useExamResultData } from "@/features/examination/use-examination";

export default function ExamResultPage() {
  return <RequireAuth><ResultContent /></RequireAuth>;
}

function ResultContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data, isLoading, isError, error, refetch } = useExamResultData(sessionId);

  if (isLoading) {
    return (
      <main className="font-dts flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#f7f6fb] px-5 py-14 text-[15px] text-[#475467]">
        Đang tải kết quả bài thi...
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="font-dts min-h-[calc(100vh-64px)] bg-[#f7f6fb] px-5 py-14 text-[#101828]">
        <section className="mx-auto max-w-[760px] rounded-[18px] border border-[#fecdca] bg-white px-7 py-12 text-center shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
          <AlertCircle className="mx-auto size-12 text-rose-600" />
          <h1 className="mt-5 text-[23px] font-bold">Không tải được kết quả</h1>
          <p className="mx-auto mt-3 max-w-[550px] text-[15px] leading-7 text-[#475467]">
            {error instanceof Error ? error.message : "Hiện chưa có thông tin kết quả bài thi."}
          </p>
          <button type="button" onClick={() => void refetch()} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0758d9] px-6 text-[14px] font-semibold text-white hover:bg-[#064fc3]">
            <RefreshCcw className="size-4" /> Thử lại
          </button>
        </section>
      </main>
    );
  }

  const published = data.resultPublished === true && Boolean(data.summary);
  const passed = data.summary?.result === "PASS";

  return (
    <main className="font-dts min-h-[calc(100vh-64px)] bg-[#f7f6fb] pb-16 pt-7 text-[#101828]">
      <div className="px-5 lg:px-[1cm]">
        <Link href="/examination" className="inline-flex items-center gap-2 rounded-[8px] py-2 text-[14px] font-medium text-[#475467] transition hover:text-[#0758d9]">
          <ArrowLeft className="size-4" /> Quay lại danh sách kỳ thi
        </Link>
      </div>
      <div className="mx-auto mt-8 w-full max-w-[1000px] px-5 sm:px-7">
        <section className="rounded-[20px] border border-[#dedfea] bg-white px-6 py-9 text-center shadow-[0_4px_16px_rgba(31,41,55,0.055)] sm:px-12 sm:py-12">
          {!published ? (
            <>
              <div className="mx-auto flex size-16 items-center justify-center rounded-[16px] bg-[#eef3ff] text-[#0758d9]">
                <Clock3 className="size-8" />
              </div>
              <h1 className="mt-6 text-[26px] font-bold tracking-[-0.025em]">
                {data.status === "EXPIRED" ? "Phiên thi đã hết hạn" : "Đã nộp bài thành công"}
              </h1>
              <p className="mx-auto mt-3 max-w-[640px] text-[15px] font-medium leading-[1.8] text-[#475467]">
                Kết quả bài thi của bạn đang chờ công bố theo quy chế. Điểm số và đáp án sẽ hiển thị khi được phép xem.
              </p>
              <div className="mx-auto mt-7 max-w-[640px] rounded-[12px] bg-[#f0f1ff] px-5 py-4 text-[14px] font-medium leading-6 text-[#475467]">
                {data.releaseAt ? `Thời điểm dự kiến công bố: ${new Date(data.releaseAt).toLocaleString("vi-VN")}` : "Bạn có thể quay lại trang này để kiểm tra khi có kết quả."}
              </div>
            </>
          ) : (
            <>
              <div className={`mx-auto flex size-16 items-center justify-center rounded-[16px] ${passed ? "bg-[#eaf8f0] text-[#087443]" : "bg-[#fff1f0] text-[#b42318]"}`}>
                {passed ? <Trophy className="size-8" strokeWidth={1.8} /> : <Target className="size-8" strokeWidth={1.8} />}
              </div>
              <h1 className="mt-6 text-[27px] font-bold tracking-[-0.025em]">
                {passed ? "Chúc mừng! Bạn đã đạt" : "Kết quả: Chưa đạt"}
              </h1>
              <p className="mx-auto mt-3 max-w-[600px] text-[15px] font-medium leading-7 text-[#475467]">
                Kết quả kỳ thi của bạn đã được công bố.
              </p>
              <div className="mx-auto mt-8 grid max-w-[690px] grid-cols-1 gap-4 text-center sm:grid-cols-2">
                <div className="rounded-[14px] bg-[#f0f1ff] px-6 py-6">
                  <p className="text-[14px] font-medium text-[#475467]">Điểm số</p>
                  <p className="mt-3 text-[30px] font-bold leading-none tracking-[-0.035em] text-[#101828]">{data.summary?.score}</p>
                </div>
                <div className="rounded-[14px] bg-[#f0f1ff] px-6 py-6">
                  <p className="text-[14px] font-medium text-[#475467]">Số câu trả lời đúng</p>
                  <p className="mt-3 text-[30px] font-bold leading-none tracking-[-0.035em] text-[#101828]">{data.summary?.correctQuestions}/{data.summary?.totalQuestions}</p>
                </div>
              </div>
            </>
          )}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={() => void refetch()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#dce5ff] bg-white px-5 text-[14px] font-semibold text-[#0758d9] hover:bg-[#f4f7ff]">
              <RefreshCcw className="size-4" /> Cập nhật kết quả
            </button>
            {published && (
              <Link href={`/examination/result/${sessionId}/review`} className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#dce5ff] bg-[#eef3ff] px-5 text-[14px] font-semibold text-[#0758d9] hover:bg-[#e4edff]">
                Xem lại bài thi
              </Link>
            )}
            <Link href="/examination" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0758d9] px-5 text-[14px] font-semibold text-white hover:bg-[#064fc3]">
              <Home className="size-4" /> Danh sách kỳ thi
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
