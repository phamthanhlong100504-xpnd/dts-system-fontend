"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ListChecks,
  RotateCcw,
} from "lucide-react";

interface WrongQuestionSummaryContentProps {
  licenseClass: string;

  totalQuestions: number;
  answeredQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  remainingCount: number;

  retrying?: boolean;

  onBackToPractice: () => void;
  onReviewRemaining: () => void;
}

export function WrongQuestionSummaryContent({
  licenseClass,
  totalQuestions,
  answeredQuestions,
  correctCount,
  wrongCount,
  unansweredCount,
  remainingCount,
  retrying = false,
  onBackToPractice,
  onReviewRemaining,
}: WrongQuestionSummaryContentProps) {
  const correctPercent =
    answeredQuestions > 0
      ? Math.round((correctCount / answeredQuestions) * 100)
      : 0;

  return (
    <main className="font-dts min-h-screen bg-[#f7f6fb] text-[#101828]">
      <div className="px-5 pt-7 lg:px-[1cm]">
        <button
          type="button"
          onClick={onBackToPractice}
          className="inline-flex items-center gap-2 rounded-[8px] py-2 text-[13px] font-medium text-[#667085] transition hover:text-[#0758d9]"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Quay về Ôn luyện
        </button>
      </div>

      <div className="mx-auto flex w-full justify-center px-6 pb-16 pt-[2.2cm]">
        <section className="w-full max-w-[860px] rounded-[20px] border border-[#dedfea] bg-white px-8 py-10 text-center shadow-[0_4px_16px_rgba(31,41,55,0.055)] sm:px-11 sm:py-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-[16px] bg-[#eaf8f0] text-[#087443]">
            <CheckCircle2 className="size-8" strokeWidth={1.9} />
          </div>

          <span className="mt-6 inline-flex rounded-[7px] bg-[#eef2ff] px-3 py-1.5 text-[13px] font-semibold text-[#0758d9]">
            Hạng {licenseClass}
          </span>

          <h1 className="mt-5 text-[25px] font-bold tracking-[-0.025em] text-[#101828]">
            Hoàn thành phiên ôn lại
          </h1>

          <p className="mx-auto mt-3 max-w-[620px] text-[14px] font-medium leading-[1.7] text-[#667085]">
            Bạn đã hoàn thành phiên ôn các câu cần chú ý. Những câu trả lời đúng đã được loại khỏi danh sách cần ôn.
          </p>

          <div className="mt-8">
            <div className="text-[34px] font-bold tracking-[-0.035em] text-[#101828]">
              {correctCount} / {answeredQuestions || totalQuestions}
            </div>

            <p className="mt-2 text-[14px] font-semibold text-[#087443]">
              {correctPercent}% câu đã trả lời chính xác
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 text-left lg:grid-cols-4">
            <Metric
              icon={<ListChecks className="size-4" />}
              label="Đã trả lời"
              value={`${answeredQuestions}/${totalQuestions}`}
            />

            <Metric
              icon={<CheckCircle2 className="size-4" />}
              label="Trả lời đúng"
              value={String(correctCount)}
              tone="success"
            />

            <Metric
              icon={<CircleAlert className="size-4" />}
              label="Trả lời sai"
              value={String(wrongCount)}
              tone="danger"
            />

            <Metric
              icon={<RotateCcw className="size-4" />}
              label="Còn cần ôn"
              value={String(remainingCount)}
              tone={remainingCount > 0 ? "warning" : "success"}
            />
          </div>

          {unansweredCount > 0 && (
            <p className="mt-5 text-[13px] font-medium text-[#667085]">
              Bạn còn {unansweredCount} câu chưa trả lời trong phiên vừa rồi.
            </p>
          )}

          {remainingCount > 0 ? (
            <div className="mt-9">
              <p className="text-[14px] font-semibold text-[#344054]">
                Bạn còn {remainingCount} câu cần chú ý thêm.
              </p>

              <button
                type="button"
                disabled={retrying}
                onClick={onReviewRemaining}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0758d9] px-6 text-[13px] font-semibold text-white transition hover:bg-[#064fc3] disabled:pointer-events-none disabled:opacity-60"
              >
                <RotateCcw className="size-4" />
                {retrying
                  ? "Đang tạo phiên..."
                  : `Ôn lại ${remainingCount} câu`}
              </button>
            </div>
          ) : (
            <div className="mt-9 rounded-[12px] bg-[#effaf4] px-5 py-4">
              <p className="text-[14px] font-semibold text-[#087443]">
                Tuyệt vời, hiện không còn câu nào cần ôn lại.
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onBackToPractice}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[9px] bg-[#f2f4f7] px-5 text-[13px] font-semibold text-[#344054] transition hover:bg-[#e9edf3]"
            >
              Về trang Ôn luyện
              <ArrowRight className="size-4" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "success" | "danger" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-[#087443]"
      : tone === "danger"
        ? "text-[#b42318]"
        : tone === "warning"
          ? "text-[#c56a00]"
          : "text-[#344054]";

  return (
    <div className="rounded-[12px] bg-[#f6f7fb] px-4 py-4">
      <div className={`flex items-center gap-2 text-[13px] font-semibold ${toneClass}`}>
        {icon}
        {label}
      </div>

      <p className={`mt-3 text-[22px] font-bold leading-none ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}