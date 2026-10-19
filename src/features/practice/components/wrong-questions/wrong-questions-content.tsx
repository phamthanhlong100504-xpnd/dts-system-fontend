"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CircleDashed,
  RefreshCcw,
} from "lucide-react";

import { useWrongQuestionsOverview } from "@/features/practice/use-wrong-questions";

interface WrongQuestionsContentProps {
  licenseClass: string;
  onStartReview: () => void;
}

export function WrongQuestionsContent({
  licenseClass,
  onStartReview,
}: WrongQuestionsContentProps) {
  const overviewQuery = useWrongQuestionsOverview(licenseClass);

  return (
    <div className="font-dts w-full pb-14 pt-7 text-[#101828]">
      <div className="px-5 lg:px-[1cm]">
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 rounded-[8px] py-2 text-[13.5px] font-medium text-[#475467] transition hover:text-[#0758d9]"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Quay lại Ôn luyện
        </Link>
      </div>

      <div className="mx-auto mt-5 w-full px-6 lg:w-[calc(100%-13cm)] lg:px-0">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.025em] text-[#101828]">
            Ôn lại câu đã sai
          </h1>

          <p className="mt-2 text-[14.5px] font-medium leading-6 text-[#475467]">
            Luyện lại những câu bạn từng trả lời sai trong hạng{" "}
            <strong className="font-semibold text-[#27364f]">
              {licenseClass}.
            </strong>
          </p>
        </div>

        <div className="mt-8">
          {overviewQuery.isLoading && <WrongQuestionsSkeleton />}

          {overviewQuery.isError && (
            <WrongQuestionsError
              onRetry={() => {
                void overviewQuery.refetch();
              }}
            />
          )}

          {overviewQuery.data &&
            !overviewQuery.isError &&
            (overviewQuery.data.hasWrongQuestions ? (
              <WrongQuestionsSummary
                totalWrongQuestions={overviewQuery.data.totalWrongQuestions}
                onStartReview={onStartReview}
              />
            ) : (
              <WrongQuestionsEmpty />
            ))}
        </div>
      </div>
    </div>
  );
}

function WrongQuestionsSummary({
  totalWrongQuestions,
  onStartReview,
}: {
  totalWrongQuestions: number;
  onStartReview: () => void;
}) {
  return (
    <section className="min-h-[330px] rounded-[18px] border border-[#dedfea] bg-white px-9 py-9 shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
      <div className="flex size-12 items-center justify-center rounded-[11px] bg-[#eef3ff] text-[#0758d9]">
        <CircleDashed className="size-[22px]" strokeWidth={2} />
      </div>

      <div className="mt-7 flex items-baseline gap-2.5">
        <strong className="text-[34px] font-bold leading-none tracking-[-0.035em] text-[#101828]">
          {totalWrongQuestions}
        </strong>

        <span className="text-[16px] font-semibold text-[#27364f]">
          câu cần ôn lại
        </span>
      </div>

      <p className="mt-5 max-w-[760px] text-[14.5px] font-medium leading-[1.7] text-[#344054]">
        Những câu bạn từng trả lời sai trong quá trình luyện tập sẽ được tổng hợp tại đây để bạn ôn lại.
      </p>

      <div className="mt-7 flex justify-center">
        <button
          type="button"
          onClick={onStartReview}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0758d9] px-6 text-[13.5px] font-semibold text-white transition hover:bg-[#064fc3]"
        >
          Bắt đầu ôn lại
          <ArrowRight className="size-4" strokeWidth={2.2} />
        </button>
      </div>
    </section>
  );
}

function WrongQuestionsEmpty() {
  return (
    <section className="min-h-[330px] rounded-[18px] border border-[#dedfea] bg-white px-9 py-9 shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
      <div className="flex size-12 items-center justify-center rounded-[11px] bg-[#eef3ff] text-[#0758d9]">
        <CircleDashed className="size-[22px]" strokeWidth={2} />
      </div>

      <div className="mt-7">
        <h2 className="text-[21px] font-bold text-[#101828]">
          Chưa có câu cần ôn lại
        </h2>

        <p className="mt-4 max-w-[760px] text-[14.5px] font-medium leading-[1.7] text-[#475467]">
          Khi bạn trả lời sai trong quá trình luyện tập, các câu cần ôn lại sẽ được tổng hợp tại đây.
        </p>
      </div>

      <div className="mt-7 flex justify-center">
        <Link
          href="/practice"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0758d9] px-6 text-[13.5px] font-semibold text-white transition hover:bg-[#064fc3]"
        >
          Tiếp tục ôn luyện
          <ArrowRight className="size-4" strokeWidth={2.2} />
        </Link>
      </div>
    </section>
  );
}

function WrongQuestionsError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <section className="min-h-[260px] rounded-[18px] border border-[#fecdca] bg-white px-9 py-9 shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
      <h2 className="text-[18px] font-bold text-[#b42318]">
        Không tải được câu đã sai
      </h2>

      <p className="mt-3 text-[14.5px] font-medium leading-6 text-[#475467]">
        Không thể tải thông tin ôn lại ở thời điểm hiện tại.
      </p>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[9px] bg-[#f2f4f7] px-5 text-[13.5px] font-semibold text-[#27364f] transition hover:bg-[#e9edf3]"
        >
          <RefreshCcw className="size-4" />
          Thử lại
        </button>
      </div>
    </section>
  );
}

function WrongQuestionsSkeleton() {
  return (
    <div className="h-[330px] animate-pulse rounded-[18px] border border-[#dedfea] bg-white" />
  );
}