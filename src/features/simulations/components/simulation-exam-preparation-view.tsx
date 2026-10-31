"use client";
import { useState } from "react";
import styles from "./simulation-exam-layout.module.css";
import textStyles from "./simulation-text-layout.module.css";
import { SimulationFeedbackModal } from "./simulation-feedback-modal";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Eye,
  Flag,
  Layers3,
  Loader2,
  Play,
  Shuffle,
  ListOrdered,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExamPreparation } from "../simulation-exam-types";
import type { LearningLoadState } from "../simulation-learning-types";
import { learningStyles } from "./learning-ui";
import {
  ExamBadge,
  ExamLoad,
  ExamShell,
  examBody,
  examCard,
  examTitle,
} from "./simulation-exam-ui";
export function SimulationExamPreparationView({
  state,
  busy = false,
  busyLabel = "Đang tạo bài thi…",
  onBack,
  onStart,
  onResume,
  onCancelActive,
  onRetry,
  mode = "RANDOM",
  canStart = true,
  startNotice,
  onAcceptVersion,
}: {
  state: LearningLoadState<ExamPreparation>;
  busy?: boolean;
  busyLabel?: string;
  onBack?: () => void;
  onStart?: () => void;
  onResume?: () => void;
  onCancelActive?: () => void;
  onRetry?: () => void;
  mode?: "RANDOM" | "PRESET";
  canStart?: boolean;
  startNotice?: string | null;
  onAcceptVersion?: () => void;
}) {
  const data = state.status === "ready" ? state.data : null;
  const presetMode = mode === "PRESET";
  const [noticeRevision, setNoticeRevision] = useState(0);
  return (
    <ExamShell
      title={
        presetMode
          ? data?.preset
            ? `Thi thử mô phỏng – ${data.preset.title}`
            : "Thi thử mô phỏng theo bộ đề"
          : "Thi thử mô phỏng ngẫu nhiên"
      }
      description={
        presetMode
          ? "Chuẩn bị bài thi thử với các tình huống theo bộ đề đã chọn."
          : "Luyện phản xạ qua bài thi thử với các tình huống mô phỏng giao thông được chọn ngẫu nhiên."
      }
      back={presetMode ? "Quay lại danh sách bộ đề" : "Quay lại Ôn luyện"}
      onBack={onBack}
    >
      {!data ? (
        <ExamLoad state={state} onRetry={onRetry} />
      ) : (
        <div className="space-y-[1cm]">
          <SimulationFeedbackModal
            key={`${startNotice ?? "none"}:${noticeRevision}`}
            message={startNotice}
            title="Thông báo bộ đề"
            action={
              onAcceptVersion
                ? {
                    label: "Xem phiên bản hiện tại",
                    onClick: onAcceptVersion,
                    disabled: busy,
                  }
                : !canStart && onRetry
                  ? {
                      label: "Kiểm tra lại bộ đề",
                      onClick: onRetry,
                      disabled: busy,
                    }
                  : undefined
            }
          />
          {data.activeSession && (
            <section
              className={cn(
                examCard,
                "flex flex-wrap items-center justify-between gap-5 border-[#b8cef4]",
              )}
            >
              <div className={textStyles.headingDescription}>
                <h2 className={examTitle}>
                  <Play className="size-5 text-[#0758d9]" />
                  Bạn có bài thi đang làm
                </h2>
                <p className={examBody}>
                  {data.activeSession.mode === "PRESET"
                    ? data.activeSession.preset.title
                    : "Thi thử mô phỏng ngẫu nhiên"}{" "}
                  · Đã hoàn thành {data.activeSession.completedScenarios}/
                  {data.activeSession.policy.totalScenarios} tình huống. Tiếp
                  tục bài thi với phản ứng đã được lưu.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy || !onCancelActive}
                  onClick={onCancelActive}
                  className={learningStyles.secondary}
                >
                  Hủy bài đang làm
                </button>
                <button
                  type="button"
                  disabled={busy || !onResume}
                  onClick={onResume}
                  className={learningStyles.primary}
                >
                  Tiếp tục làm bài <ArrowRight className="size-4" />
                </button>
              </div>
            </section>
          )}
          <section className={examCard}>
            <div className={textStyles.headingDescription}>
              <h2 className={examTitle}>
                <ClipboardList className="size-5 text-[#0758d9]" />
                Thông tin bài thi thử
              </h2>
              <p className={examBody}>
                Cấu trúc bài thi và hình thức chọn tình huống.
              </p>
            </div>
            <div className={styles.infoGrid}>
              {[
                {
                  Icon: Layers3,
                  label: "Số lượng tình huống",
                  value: `${data.policy.totalScenarios} tình huống`,
                  text: "Mỗi tình huống chỉ xuất hiện một lần trong bài.",
                },
                {
                  Icon: Trophy,
                  label: "Điểm tối đa",
                  value: `${data.policy.maxTotalScore} điểm`,
                  text: `Mỗi tình huống tối đa ${data.policy.maxScenarioScore} điểm.`,
                },
                {
                  Icon: presetMode ? ListOrdered : Shuffle,
                  label: "Hình thức chọn đề",
                  value: presetMode ? "Bộ đề cố định" : "Ngẫu nhiên",
                  text: "Thứ tự tình huống được giữ nguyên trong suốt bài thi.",
                },
              ].map(({ Icon, label, value, text }) => (
                <article key={label} className={styles.infoCard}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[14.5px] font-medium text-[#475467]">
                      {label}
                    </span>
                    <Icon className="size-5 shrink-0 text-[#0758d9]" />
                  </div>
                  <h3
                    className={cn(
                      "mt-[1cm] text-[22px] font-semibold text-[#0758d9]",
                      styles.infoValue,
                    )}
                  >
                    {value}
                  </h3>
                  <p className={cn(examBody, "mt-[1cm]")}>{text}</p>
                </article>
              ))}
            </div>
          </section>
          <section>
            <div className={textStyles.headingDescription}>
              <h2 className={examTitle}>Cách thực hiện bài thi thử</h2>
              <p className={examBody}>
                Bốn bước để hoàn thành bài thi mô phỏng.
              </p>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  Icon: Play,
                  title: "Bắt đầu bài thi",
                  text: presetMode
                    ? "Mở bài thi theo đúng thứ tự tình huống của bộ đề đã chọn."
                    : "Hệ thống tạo bài thi từ ngân hàng tình huống đã công bố.",
                },
                {
                  Icon: Eye,
                  title: "Quan sát video",
                  text: "Theo dõi lần lượt các tình huống giao thông trong bài.",
                },
                {
                  Icon: Flag,
                  title: "Nhấn Space",
                  text: "Nhấn phím hoặc nút Phát hiện nguy hiểm khi phát hiện dấu hiệu nguy hiểm.",
                },
                {
                  Icon: Trophy,
                  title: "Xem kết quả",
                  text: "Xem tổng điểm và phân tích từng tình huống sau khi hoàn thành bài.",
                },
              ].map(({ Icon, title, text }, i) => (
                <article
                  key={title}
                  className={cn(examCard, styles.stepCard, "flex flex-col")}
                >
                  <div className={styles.stepHeader}>
                    <span className="flex size-10 items-center justify-center rounded-[11px] bg-[#eef2ff] text-[#0758d9]">
                      <Icon className="size-5" />
                    </span>
                    <p className={styles.stepLabel}>Bước {i + 1}</p>
                    <span aria-hidden="true" />
                  </div>
                  <div className={cn(textStyles.headingDescription, "mt-5")}>
                    <h3 className={styles.stepTitle}>{title}</h3>
                    <p className={examBody}>{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className={cn(examCard, "bg-[#f0f4ff]")}>
            <h2 className={examTitle}>
              <BookOpen className="size-5 text-[#0758d9]" />
              Lưu ý khi thi thử
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                "Không hiển thị gợi ý, dấu hiệu nguy hiểm hoặc điểm trong quá trình làm bài.",
                "Mỗi tình huống chỉ ghi nhận phản ứng đầu tiên.",
                `Điểm mỗi tình huống từ 0 đến ${data.policy.maxScenarioScore}, theo thời điểm phản ứng.`,
                "Kết quả và phân tích chỉ hiển thị khi toàn bộ bài thi đã được xác nhận hoàn thành.",
              ].map((t) => (
                <p
                  key={t}
                  className={cn(
                    examBody,
                    "flex items-start gap-3 rounded-[10px] bg-white p-4",
                  )}
                >
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#0758d9]" />
                  {t}
                </p>
              ))}
            </div>
            <div className="mt-5">
              <ExamBadge>
                Ngưỡng đạt: {data.policy.passingScore}/
                {data.policy.maxTotalScore} điểm
              </ExamBadge>
            </div>
          </section>
          <div className="flex flex-col items-center gap-5 text-center">
            <p className={examBody}>
              Hãy sẵn sàng quan sát và phản ứng với các tình huống giao thông.
            </p>
            <button
              type="button"
              onClick={onStart}
              disabled={busy || !onStart || !!data.activeSession || !canStart}
              className={cn(learningStyles.primary, "min-h-12 px-7")}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              {busy ? busyLabel : "Bắt đầu thi thử"}
              <ArrowRight className="size-4" />
            </button>
            {startNotice && (
              <button
                type="button"
                onClick={() => setNoticeRevision((n) => n + 1)}
                className={learningStyles.secondary}
              >
                Xem thông báo bộ đề
              </button>
            )}
            {data.preset && (
              <p className={examBody}>
                {data.preset.title} · {data.policy.totalScenarios} tình huống ·
                Tối đa {data.policy.maxTotalScore} điểm
              </p>
            )}
          </div>
        </div>
      )}
    </ExamShell>
  );
}
