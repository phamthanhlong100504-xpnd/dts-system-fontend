"use client";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Flag,
  FolderOpen,
  GraduationCap,
  Info,
  Gauge,
  Keyboard,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SimulationHintCard } from "./simulation-hint-card";
import textStyles from "./simulation-text-layout.module.css";
import type {
  GuideBankInfo,
  GuideContent,
  GuideMode,
} from "../simulation-guide-types";
import type { GuideReadState } from "../use-simulation-guide";
import {
  BackAction,
  LearningNotice,
  LearningShell,
  learningStyles,
} from "./learning-ui";
export function SimulationGuideView({
  state,
  onBack,
  onStart,
  onRetry,
}: {
  state: GuideReadState;
  onBack?: () => void;
  onStart?: () => void;
  onRetry?: () => void;
}) {
  return (
    <LearningShell
      navigation={<BackAction onClick={onBack}>Quay lại Ôn luyện</BackAction>}
      navigationGap="1cm"
      ariaLabel="Hướng dẫn luyện mô phỏng"
    >
      {state.status === "ready" ? (
        <SimulationGuideContent
          content={state.data.document.content}
          bank={state.data.bank}
          onStart={onStart}
          showIntro={false}
        />
      ) : (
        <>
          {state.status === "loading" ? (
            <GuideSkeleton />
          ) : state.status === "unavailable" ? (
            <LearningNotice
              kind="unavailable"
              message="Hướng dẫn sẽ xuất hiện khi nội dung được công bố."
            />
          ) : state.status === "unpublished" ? (
            <GuideMessage
              title="Chưa có hướng dẫn được công bố"
              description="Nội dung hướng dẫn chưa được phát hành. Bạn có thể quay lại Ôn luyện hoặc tải lại sau."
              onRetry={onRetry}
            />
          ) : (
            <GuideMessage
              title="Không thể tải hướng dẫn mô phỏng"
              description={state.message}
              onRetry={onRetry}
            />
          )}
        </>
      )}
    </LearningShell>
  );
}
/** Same body in student page and Admin preview; plain React text, never injected HTML. */
export function SimulationGuideContent({
  content: d,
  bank,
  onStart,
  showIntro = true,
}: {
  content: GuideContent;
  bank: GuideBankInfo;
  onStart?: () => void;
  showIntro?: boolean;
}) {
  return (
    <div className="font-dts space-y-[1cm] [overflow-wrap:anywhere]">
      {showIntro && (
        <header
          className={cn(textStyles.headingDescription, textStyles.pageIntro)}
        >
          <h1 className={learningStyles.heading}>{d.title}</h1>
          <p className={cn(learningStyles.body, "whitespace-pre-line")}>
            {d.description}
          </p>
        </header>
      )}
      <section
        aria-label="Tổng quan mô phỏng"
        className={cn(learningStyles.card, "flex items-start gap-4 px-6 py-5")}
      >
        <IconTile icon={Info} />
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-line text-[15.5px] font-medium leading-7 text-[#344054]">
            {d.overview.description}
          </p>
          <div className="mt-[1cm] flex flex-wrap gap-[1cm] md:flex-nowrap">
            <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-[8px] bg-[#edf3ff] px-3 py-1.5 text-[14.5px] font-semibold text-[#0758d9]">
              <BookOpen className="size-4" />
              {bank.chapterCount} chương
            </span>
            <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-[8px] bg-[#edf3ff] px-3 py-1.5 text-[14.5px] font-semibold text-[#0758d9]">
              <ClipboardCheck className="size-4" />
              {bank.scenarioCount} tình huống
            </span>
          </div>
        </div>
      </section>
      <section>
        <SectionTitle>{d.steps.title}</SectionTitle>
        <ol className="mt-5 grid gap-x-5 gap-y-[1cm] sm:grid-cols-2 xl:grid-cols-4">
          {d.steps.items.map((item, n) => {
            const Icon = [FolderOpen, Eye, Flag, CheckCircle2][n];
            return (
              <li
                key={item.key}
                className={cn(learningStyles.card, "flex flex-col p-5")}
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-[#edf3ff] text-[14.5px] font-bold text-[#0758d9]">
                    {n + 1}
                  </span>
                  <Icon className="size-5 text-[#0758d9]" aria-hidden="true" />
                </div>
                <div className={textStyles.headingDescription}>
                  <h3 className="text-center text-[18px] font-bold leading-7 text-[#172335]">
                    {item.title}
                  </h3>
                  <p className={cn(learningStyles.body, "whitespace-pre-line")}>
                    {item.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      <section className={cn(learningStyles.card, "p-5 sm:p-6")}>
        <div className={textStyles.headingDescription}>
          <SectionTitle>{d.scoring.title}</SectionTitle>
          <p className={cn(learningStyles.body, "whitespace-pre-line")}>
            {d.scoring.description}
          </p>
        </div>
        <figure className="mt-5 rounded-[14px] bg-[#f3f4ff] p-4 sm:p-5">
          <figcaption className="mb-4 inline-flex items-center gap-2 text-[15.5px] font-semibold text-[#344054]">
            <Gauge
              className="size-4 shrink-0 text-[#0758d9]"
              aria-hidden="true"
            />
            {d.scoring.illustrationTitle}
          </figcaption>
          <div className="overflow-x-auto pb-1">
            <div
              className="grid min-w-[520px] grid-cols-7 gap-1"
              role="img"
              aria-label={bank.scoringLabels.join(" → ")}
            >
              {bank.scoringLabels.map((label, n) => (
                <span
                  key={n}
                  className={cn(
                    "flex min-h-14 items-center justify-center px-2 py-3 text-center text-[14.5px] font-bold leading-6 first:rounded-l-[8px] last:rounded-r-[8px]",
                    [
                      "bg-[#e4e8f6] text-[#344054]",
                      "bg-[#008293] text-white",
                      "bg-[#00728b] text-white",
                      "bg-[#0758d9] text-white",
                      "bg-[#4d4ec9] text-white",
                      "bg-[#6d54db] text-white",
                      "bg-[#e4e8f6] text-[#344054]",
                    ][n],
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </figure>
        <div className="mt-5 grid gap-x-4 gap-y-[1cm] md:grid-cols-3">
          {d.scoring.items.map((item, n) => (
            <article
              key={item.key}
              className="flex items-start gap-3 rounded-[12px] bg-[#f7f8fd] p-4"
            >
              <IconTile icon={[CheckCircle2, Flag, Info][n]} small />
              <div>
                <h3 className="text-[16px] font-bold leading-6 text-[#172335]">
                  {item.title}
                </h3>
                <p
                  className={cn(
                    learningStyles.body,
                    "mt-1 whitespace-pre-line",
                  )}
                >
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section>
        <SectionTitle>{d.recognition.title}</SectionTitle>
        <div className="mt-5 grid gap-x-5 gap-y-[1cm] md:grid-cols-2">
          {d.recognition.items.map((item, n) => (
            <SimulationHintCard
              key={item.key}
              title={item.title}
              text={item.description}
              warning={n === 0}
            />
          ))}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-[14px] border border-[#e0e6f7] bg-[#eef2ff] p-5">
          <GraduationCap className="mt-1 size-5 shrink-0 text-[#0758d9]" />
          <div>
            <h3 className="text-[16px] font-bold text-[#172335]">
              {d.recognition.policy.title}
            </h3>
            <p className={cn(learningStyles.body, "mt-2 whitespace-pre-line")}>
              {d.recognition.policy.description}
            </p>
          </div>
        </div>
      </section>
      <section>
        <SectionTitle>{d.comparison.title}</SectionTitle>
        <div className="mt-5 grid gap-x-5 gap-y-[1cm] md:grid-cols-2">
          <ModeCard mode={d.comparison.practice} icon={SlidersHorizontal} />
          <ModeCard mode={d.comparison.exam} icon={ClipboardCheck} />
        </div>
      </section>
      <section className={cn(learningStyles.card, "p-5 sm:p-6")}>
        <SectionTitle>{d.notes.title}</SectionTitle>
        <ul className="mt-6 space-y-[1cm]">
          {d.notes.items.map((item, n) => (
            <li key={item.key} className="flex items-start gap-4">
              <IconTile small icon={[Eye, Keyboard, Flag, RotateCcw][n]} />
              <div>
                <h3 className="text-[16px] font-bold leading-6 text-[#172335]">
                  {item.title}
                </h3>
                <p
                  className={cn(
                    learningStyles.body,
                    "mt-1 whitespace-pre-line",
                  )}
                >
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col items-start justify-between gap-5 rounded-[18px] border border-[#dce2f7] bg-[#eef2ff] p-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-[18px] font-bold leading-7 text-[#172335]">
            {d.cta.title}
          </h2>
          <p className={cn(learningStyles.body, "mt-2 whitespace-pre-line")}>
            {d.cta.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onStart}
          disabled={!onStart}
          className={cn(learningStyles.primary, "ml-auto shrink-0")}
        >
          {d.cta.buttonLabel}
          <ArrowRight className="size-4" />
        </button>
      </section>
    </div>
  );
}
function ModeCard({
  mode,
  icon: Icon,
}: {
  mode: GuideMode;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <article className={cn(learningStyles.card, "p-6")}>
      <div className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 lg:gap-[1cm]">
        <Icon className="size-5 shrink-0 text-[#0758d9]" aria-hidden="true" />
        <h3 className="whitespace-nowrap text-[16px] font-bold text-[#172335] lg:text-[18px]">
          {mode.title}
        </h3>
        <span
          className={cn(
            learningStyles.badge,
            "px-1.5 text-[11px] uppercase lg:px-2.5 lg:text-[13.5px]",
          )}
        >
          {mode.badge}
        </span>
      </div>
      <ul className="mt-4 space-y-4">
        {mode.items.map((i) => (
          <li key={i.key} className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#0758d9]" />
            <div>
              <p className="text-[15.5px] font-semibold leading-6 text-[#344054]">
                {i.title}
              </p>
              <p
                className={cn(learningStyles.body, "mt-1 whitespace-pre-line")}
              >
                {i.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-[18px] font-bold leading-7 text-[#172335]">
      <span
        className="h-5 w-1 shrink-0 rounded-full bg-[#0758d9]"
        aria-hidden="true"
      />
      {children}
    </h2>
  );
}
function IconTile({
  icon: Icon,
  purple = false,
  small = false,
}: {
  icon: ComponentType<{ className?: string }>;
  purple?: boolean;
  small?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[10px]",
        small ? "size-8" : "size-11",
        purple ? "bg-[#eeeaff] text-[#7350cb]" : "bg-[#edf3ff] text-[#0758d9]",
      )}
    >
      <Icon className={small ? "size-4" : "size-5"} />
    </span>
  );
}
function GuideMessage({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <section
      role="alert"
      className={cn(
        learningStyles.card,
        "mx-auto flex min-h-[320px] max-w-[720px] flex-col items-center justify-center p-8 text-center",
      )}
    >
      <IconTile icon={BookOpen} />
      <div className={cn(textStyles.headingDescription, "mt-5")}>
        <h2 className="text-[18px] font-bold text-[#172335]">{title}</h2>
        <p className={cn(learningStyles.body, "max-w-[560px]")}>
          {description}
        </p>
      </div>
      <button
        type="button"
        disabled={!onRetry}
        onClick={onRetry}
        className={cn(learningStyles.secondary, "mt-6")}
      >
        Thử lại
      </button>
    </section>
  );
}
function GuideSkeleton() {
  return (
    <div
      role="status"
      aria-label="Đang tải hướng dẫn mô phỏng"
      className="space-y-[1cm]"
    >
      <div className={cn(learningStyles.card, "h-28 animate-pulse p-6")}>
        <div className="h-5 w-3/4 rounded bg-[#e8ebf5]" />
        <div className="mt-4 h-4 w-1/2 rounded bg-[#eef0f7]" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((n) => (
          <div
            key={n}
            className={cn(learningStyles.card, "h-52 animate-pulse p-5")}
          >
            <div className="size-8 rounded-full bg-[#e8ebf5]" />
            <div className="mt-6 h-5 w-3/4 rounded bg-[#e8ebf5]" />
            <div className="mt-4 h-16 rounded bg-[#eef0f7]" />
          </div>
        ))}
      </div>
      <div
        className={cn(learningStyles.card, "h-72 animate-pulse bg-[#f1f3fa]")}
      />
    </div>
  );
}
