"use client";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  RotateCcw,
  Target,
  Trophy,
  Video,
} from "lucide-react";
import styles from "./simulation-exam-layout.module.css";
import textStyles from "./simulation-text-layout.module.css";
import { cn } from "@/lib/utils";
import type { LearningLoadState } from "../simulation-learning-types";
import type { ExamResult } from "../simulation-exam-types";
import { learningStyles } from "./learning-ui";
import {
  ExamBadge,
  ExamLoad,
  ExamShell,
  examBody,
  examCard,
  examTitle,
} from "./simulation-exam-ui";
export function SimulationExamResultView({
  state,
  onBack,
  onRetry,
  onNew,
  onReview,
}: {
  state: LearningLoadState<ExamResult>;
  onBack?: () => void;
  onRetry?: () => void;
  onNew?: () => void;
  onReview?: (position: number) => void;
}) {
  const r = state.status === "ready" ? state.data : null;
  return (
    <ExamShell
      title={
        r?.mode === "PRESET"
          ? `Kết quả thi thử – ${r.preset.title}`
          : "Kết quả thi thử mô phỏng"
      }
      back={
        r?.mode === "PRESET" ? "Quay lại danh sách bộ đề" : "Quay lại Ôn luyện"
      }
      description="Xem tổng điểm và kết quả từng tình huống trong bài thi đã hoàn thành."
      onBack={onBack}
      badge={
        r ? (
          <ExamBadge>
            <CheckCircle2 className="size-4" />
            Đã hoàn thành
          </ExamBadge>
        ) : undefined
      }
    >
      {!r ? (
        <ExamLoad state={state} onRetry={onRetry} />
      ) : (
        <div className="space-y-[1cm]">
          <section className={examCard}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className={examTitle}>
                <Trophy className="size-5 text-[#0758d9]" />
                Kết quả bài thi
              </h2>
              <ExamBadge tone={r.passed ? "green" : "red"}>
                {r.passed ? "Đạt" : "Không đạt"}
              </ExamBadge>
            </div>
            <div className="mt-7 grid gap-5 lg:grid-cols-[1.5fr_1fr_1fr]">
              <div className="flex flex-col justify-center rounded-[12px] bg-[#f6f8fe] p-5">
                <p className="text-[36px] font-semibold tracking-tight text-[#0758d9]">
                  {r.totalScore}
                  <span className="ml-2 text-[20px] font-semibold text-[#475467]">
                    / {r.policy.maxTotalScore} điểm
                  </span>
                </p>
                <p className={cn(examBody, "mt-3")}>
                  Ngưỡng đạt: {r.policy.passingScore}/{r.policy.maxTotalScore}{" "}
                  điểm
                </p>
                <div
                  className="mt-5 h-2 overflow-hidden rounded-full bg-[#e4e9f6]"
                  role="meter"
                  aria-label="Tổng điểm bài thi"
                  aria-valuenow={r.totalScore}
                  aria-valuemin={0}
                  aria-valuemax={r.policy.maxTotalScore}
                >
                  <div
                    className="h-full rounded-full bg-[#0758d9]"
                    style={{
                      width: `${(r.totalScore / r.policy.maxTotalScore) * 100}%`,
                    }}
                  />
                </div>
              </div>
              {[
                {
                  Icon: ClipboardCheck,
                  value: `${r.completedScenarios}/${r.policy.totalScenarios}`,
                  label: "Tình huống đã hoàn thành",
                },
                {
                  Icon: Target,
                  value: `${r.policy.maxTotalScore} điểm`,
                  label: "Điểm tối đa của bài thi",
                },
              ].map(({ Icon, value, label }) => (
                <div
                  key={label}
                  className="flex flex-col justify-center rounded-[12px] bg-[#f6f8fe] p-5"
                >
                  <Icon className="mb-5 size-6 text-[#0758d9]" />
                  <p className="text-[22px] font-bold text-[#172335]">
                    {value}
                  </p>
                  <p className={cn(examBody, "mt-2")}>{label}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <div className={textStyles.headingDescription}>
              <h2 className={examTitle}>Kết quả từng tình huống</h2>
              <p className={examBody}>
                Xem điểm phản ứng và mở chi tiết để rút kinh nghiệm.
              </p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {r.items.map((i) => (
                <article
                  key={i.position}
                  className={cn(
                    examCard,
                    "flex flex-wrap items-center gap-4 py-5",
                  )}
                >
                  <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#edf2ff] text-[#0758d9]">
                    <Video className="size-5" />
                  </span>
                  <h3 className="mr-auto text-[16px] font-bold text-[#172335]">
                    Tình huống {String(i.position).padStart(2, "0")}
                  </h3>
                  <ExamBadge>
                    {i.score}/{i.maxScore} điểm
                  </ExamBadge>
                  <button
                    type="button"
                    disabled={!onReview}
                    onClick={() => onReview?.(i.position)}
                    className={learningStyles.back}
                  >
                    Xem chi tiết <ArrowRight className="size-4" />
                  </button>
                </article>
              ))}
            </div>
          </section>
          <div className={styles.resultActions}>
            <button
              type="button"
              onClick={onNew}
              disabled={!onNew}
              className={learningStyles.primary}
            >
              <RotateCcw className="size-4" />
              {r.mode === "PRESET" ? "Làm lại bộ đề" : "Thi thử bài mới"}
            </button>
            <button
              type="button"
              onClick={onBack}
              className={learningStyles.secondary}
            >
              {r.mode === "PRESET"
                ? "Quay lại danh sách bộ đề"
                : "Quay lại Ôn luyện"}
            </button>
          </div>
        </div>
      )}
    </ExamShell>
  );
}
