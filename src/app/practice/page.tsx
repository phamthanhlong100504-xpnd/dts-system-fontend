
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  Ban,
  BookOpen,
  Clock3,
  FileQuestion,
  Layers3,
  Lightbulb,
  ListChecks,
  RotateCcw,
} from "lucide-react";

import { RequireAuth } from "@/components/require-auth";
import { useLicenseByCode } from "@/features/license/use-license";
import { useMe } from "@/features/auth/use-auth";
import { PracticeModeDialog } from "@/features/practice/components/practice-mode-dialog";
import { getPresetExamCounts } from "@/features/practice/preset-exam-types";
import type {
  ExamMode,
  ExamSessionResponse,
} from "@/features/practice/practice-service";
import { useCriticalOverview } from "@/features/practice/use-critical-overview";
import { usePresetExamSets } from "@/features/practice/use-preset-exams";
import {
  practiceKeys,
  useActiveExam,
  useQuestionStats,
} from "@/features/practice/use-practice";
import { useWrongQuestionsOverview } from "@/features/practice/use-wrong-questions";
import { ApiError, practiceApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLicenseStore } from "@/stores/license-store";

interface ExamConfigResponse {
  examType: string;
  totalQuestions: number;
  durationMinutes: number;
  passingScore: number;
  criticalQuestionCount: number;
}

function getProfileSelectedLicenseClass(profile: unknown) {
  if (
    !profile ||
    typeof profile !== "object" ||
    !("selectedLicenseClass" in profile)
  ) {
    return null;
  }

  const value = (
    profile as {
      selectedLicenseClass?: unknown;
    }
  ).selectedLicenseClass;

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  return value
    .trim()
    .toUpperCase();
}

function useExamConfig(examType?: string) {
  const normalizedExamType =
    examType
      ?.trim()
      .toUpperCase() ?? "";

  return useQuery({
    queryKey: [
      "practice",
      "exam-config",
      normalizedExamType,
    ] as const,

    queryFn: () =>
      practiceApi.get<ExamConfigResponse>(
        `/v1/exams/config?examType=${encodeURIComponent(
          normalizedExamType
        )}`
      ),

    enabled:
      Boolean(
        normalizedExamType
      ),

    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

function useStartPracticeExamAndGo() {
  const router =
    useRouter();

  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      examType,
      mode,
    }: {
      examType: string;
      mode: ExamMode;
    }) =>
      practiceApi.post<ExamSessionResponse>(
        "/v1/exams",
        {
          examType,
          mode,
        }
      ),

    onSuccess: (session) => {
      if (!session.examId) {
        toast.error(
          "Backend không trả về mã bài thi"
        );

        return;
      }

      queryClient.setQueryData(
        practiceKeys.session(
          session.examId
        ),
        session
      );

      if (session.examType) {
        void queryClient.invalidateQueries({
          queryKey:
            practiceKeys.activeExam(
              session.examType
            ),
        });
      }

      router.push(
        `/practice/exam/${session.examId}`
      );
    },

    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Không thể bắt đầu bài thi"
      );
    },
  });
}

export default function PracticePage() {
  return (
    <RequireAuth>
      <PracticeLicenseGate />
    </RequireAuth>
  );
}

function PracticeLicenseGate() {
  const router =
    useRouter();

  const meQuery =
    useMe();

  const selectedLicense =
    useLicenseStore(
      (state) =>
        state.selectedLicense
    );

  const setSelectedLicense =
    useLicenseStore(
      (state) =>
        state.setSelectedLicense
    );

  const clearSelectedLicense =
    useLicenseStore(
      (state) =>
        state.clearSelectedLicense
    );

  const backendLicense =
    getProfileSelectedLicenseClass(
      meQuery.data
    );

  useEffect(() => {
    if (
      meQuery.isLoading ||
      meQuery.isError
    ) {
      return;
    }

    if (!backendLicense) {
      if (selectedLicense) {
        clearSelectedLicense();
      }

      router.replace("/");

      return;
    }

    if (
      selectedLicense !==
      backendLicense
    ) {
      setSelectedLicense(
        backendLicense
      );
    }
  }, [
    backendLicense,
    clearSelectedLicense,
    meQuery.isError,
    meQuery.isLoading,
    router,
    selectedLicense,
    setSelectedLicense,
  ]);

  if (meQuery.isLoading) {
    return null;
  }

  if (meQuery.isError) {
    return (
      <PracticeLoadError
        message="Không tải được hạng GPLX từ tài khoản của bạn."
        onRetry={() =>
          void meQuery.refetch()
        }
      />
    );
  }

  if (!backendLicense) {
    return null;
  }

  return (
    <PracticeHub
      licenseCode={
        backendLicense
      }
    />
  );
}

function PracticeHub({
  licenseCode,
}: {
  licenseCode: string;
}) {

  // Identity quyết định hạng đang học; Practice Catalog cung cấp cấu hình hạng.
  const {
    license,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    isCatalogReady,
    refetch: refetchCatalog,
  } = useLicenseByCode(licenseCode);

  const activeExamQuery =
    useActiveExam(
      licenseCode
    );

  const statsQuery =
    useQuestionStats(
      licenseCode
    );

  const presetQuery =
    usePresetExamSets(
      licenseCode
    );

  const wrongQuery =
    useWrongQuestionsOverview(
      licenseCode
    );

  const criticalOverview =
    useCriticalOverview(
      licenseCode
    );

  const examConfigQuery =
    useExamConfig(
      licenseCode
    );

  const startExamMutation =
    useStartPracticeExamAndGo();

  const [
    modeDialogOpen,
    setModeDialogOpen,
  ] =
    useState(false);

  const examConfig =
    examConfigQuery.data;

  async function handleOpenModeDialog() {
    if (examConfig) {
      setModeDialogOpen(
        true
      );

      return;
    }

    const result =
      await examConfigQuery.refetch();

    if (result.data) {
      setModeDialogOpen(
        true
      );
    }
  }

  function handleModeSelect(
    mode: ExamMode
  ) {
    if (
      !examConfig ||
      startExamMutation.isPending
    ) {
      return;
    }

    startExamMutation.mutate({
      examType:
        licenseCode,

      mode,
    });
  }

  const presetCounts =
    useMemo(
      () =>
        getPresetExamCounts(
          presetQuery.data
            ?.items ?? []
        ),
      [
        presetQuery.data
          ?.items,
      ]
    );

  // Giữ nguyên các hook dữ liệu đã có và chỉ chặn hiển thị khi
  // danh mục GPLX chưa được xác nhận từ Practice backend.
  if (isCatalogLoading) {
    return null;
  }

  if (isCatalogError) {
    return (
      <PracticeLoadError
        message="Không tải được danh mục hạng GPLX từ Practice Service."
        onRetry={() => void refetchCatalog()}
      />
    );
  }

  if (!isCatalogReady) {
    return null;
  }

  if (!license) {
    return (
      <PracticeLoadError
        message="Hạng GPLX trong hồ sơ không có trong danh mục Practice hiện tại."
        onRetry={() => void refetchCatalog()}
      />
    );
  }

  const chapterCount =
    Object.values(
      statsQuery.data
        ?.byChapter ?? {}
    ).filter(
      (count) =>
        count > 0
    ).length;

  const wrongQuestionCount =
    wrongQuery.data
      ?.totalWrongQuestions ??
    0;

  const criticalProgress =
    criticalOverview.overview;

  const criticalTotal =
    criticalProgress
      ?.totalQuestions ??
    0;

  const criticalLearned =
    criticalProgress
      ?.learnedQuestions ??
    0;

  const criticalPercent =
    criticalProgress
      ?.completionPercent ??
    0;

  const activeExam =
    activeExamQuery.data;

  const canResume =
    Boolean(
      activeExam?.examId
    ) &&
    (
      activeExam?.status ===
        "IN_PROGRESS" ||
      activeExam?.status ===
        "PAUSED"
    ) &&
    activeExam.examType
      ?.trim()
      .toUpperCase() ===
      licenseCode
        .trim()
        .toUpperCase();

  const activeExamTotal =
    activeExam
      ?.totalQuestions ??
    0;

  const answeredCount =
    activeExam
      ?.answeredCount ??
    0;

  const resumePercent =
    activeExamTotal > 0
      ? Math.min(
          100,
          Math.round(
            (
              answeredCount /
              activeExamTotal
            ) *
              100
          )
        )
      : 0;

  const publishedPresetCount =
    presetQuery.data?.total ??
    presetCounts.total;

  return (
    <div className="font-dts min-h-[calc(100vh-64px)] bg-[#f8f8fc] text-[#101828]">
      <main className="mx-auto w-full max-w-[1240px] px-6 pb-14 pt-8 lg:px-8">
        <section>
          <h1 className="text-[30px] font-bold tracking-[-0.025em] text-[#101828]">
            Ôn luyện
          </h1>

          <p className="mt-1.5 text-[14.5px] font-medium text-[#344054]">
            Hạng{" "}
            {licenseCode} · Học theo cách phù hợp với bạn.
          </p>
        </section>

        {canResume &&
          activeExam && (
            <section className="mt-6">
              <Link
                href={`/practice/exam/${activeExam.examId}`}
                className="group flex min-h-[108px] items-center gap-5 rounded-[16px] border border-[#e1e5ed] bg-white px-5 py-4 shadow-[0_2px_6px_rgba(15,23,42,0.03)] transition hover:border-[#a9bdf0]"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[11px] bg-[#e8edff] text-[#0758d9]">
                  <RotateCcw
                    className="size-[20px]"
                    strokeWidth={
                      2
                    }
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[12.5px] font-bold uppercase tracking-[0.04em] text-[#0758d9]">
                      Tiếp tục gần đây
                    </span>

                    <span className="text-[12.5px] text-[#98a2b3]">
                      •
                    </span>

                    <span className="text-[14.5px] font-medium text-[#475467]">
                      {activeExam.mode ===
                      "PRACTICE"
                        ? "Luyện tập có giải thích"
                        : "Mô phỏng thi thật"}
                    </span>
                  </div>

                  <p className="mt-1 text-[15.5px] font-bold text-[#101828]">
                    Bài hạng{" "}
                    {licenseCode}{" "}
                    {activeExam.status ===
                    "PAUSED"
                      ? "đang tạm dừng"
                      : "đang làm"}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-3">
                    <span className="text-[14.5px] font-medium text-[#344054]">
                      {
                        answeredCount
                      }
                      /
                      {
                        activeExamTotal
                      }{" "}
                      câu
                    </span>

                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[#e5e9f7]">
                      <div
                        className="h-full rounded-full bg-[#0758d9]"
                        style={{
                          width:
                            `${resumePercent}%`,
                        }}
                      />
                    </div>

                    <span className="text-[12.5px] font-semibold text-[#0758d9]">
                      {
                        resumePercent
                      }
                      %
                    </span>
                  </div>
                </div>

                <span className="hidden h-10 shrink-0 items-center gap-2 rounded-[9px] bg-[#0758d9] px-5 text-[14.5px] font-semibold text-white transition group-hover:bg-[#064fc3] sm:flex">
                  Tiếp tục

                  <ArrowRight className="size-4" />
                </span>
              </Link>
            </section>
          )}

        <PracticeSection
          className={cn(
            canResume
              ? "mt-8"
              : "mt-7"
          )}
          title="Thi thử"
          accent="#0758d9"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <ExamFeatureCard>
              <FeatureIcon>
                <FileQuestion className="size-[20px]" />
              </FeatureIcon>

              <h3 className="mt-4 text-[19px] font-bold text-[#101828]">
                Thi thử ngẫu nhiên
              </h3>

              <p className="mt-2 text-[14.5px] font-medium leading-6 text-[#344054]">
                Tạo một đề mới theo cấu trúc thi của hạng{" "}
                {licenseCode}.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {examConfigQuery.isLoading ? (
                  <MetaChip>
                    Đang tải cấu hình đề...
                  </MetaChip>
                ) : examConfigQuery.isError ||
                  !examConfig ? (
                  <MetaChip>
                    Không tải được cấu hình đề
                  </MetaChip>
                ) : (
                  <>
                    <MetaChip>
                      <FileQuestion className="size-3.5" />

                      {
                        examConfig.totalQuestions
                      }{" "}
                      câu
                    </MetaChip>

                    <MetaChip>
                      <Clock3 className="size-3.5" />

                      {
                        examConfig.durationMinutes
                      }{" "}
                      phút
                    </MetaChip>
                  </>
                )}
              </div>

              <div className="mt-auto flex justify-center pt-6">
                <button
                  type="button"
                  onClick={() =>
                    void handleOpenModeDialog()
                  }
                  disabled={
                    examConfigQuery.isFetching
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#0758d9] px-6 text-[14.5px] font-semibold text-white shadow-[0_2px_5px_rgba(7,88,217,0.15)] transition hover:bg-[#064fc3] hover:shadow-[0_3px_8px_rgba(7,88,217,0.2)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {examConfigQuery.isFetching
                    ? "Đang tải cấu hình..."
                    : examConfigQuery.isError ||
                        !examConfig
                      ? "Tải lại cấu hình"
                      : "Bắt đầu thi thử"}

                  <ArrowRight className="size-4" />
                </button>
              </div>
            </ExamFeatureCard>

            <ExamFeatureCard>
              <FeatureIcon>
                <Layers3 className="size-[20px]" />
              </FeatureIcon>

              <h3 className="mt-4 text-[19px] font-bold text-[#101828]">
                Bộ đề có sẵn
              </h3>

              <p className="mt-2 text-[14.5px] font-medium leading-6 text-[#344054]">
                Luyện tập với các bộ đề đã được chuẩn bị sẵn theo hạng{" "}
                {licenseCode}.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {presetQuery.isLoading ? (
                  <MetaChip>
                    Đang tải bộ đề...
                  </MetaChip>
                ) : presetQuery.isError ? (
                  <MetaChip>
                    Không tải được bộ đề
                  </MetaChip>
                ) : publishedPresetCount >
                  0 ? (
                  <>
                    <MetaChip>
                      <Layers3 className="size-3.5" />

                      {
                        publishedPresetCount
                      }{" "}
                      bộ đề
                    </MetaChip>

                    <MetaChip>
                      <ListChecks className="size-3.5" />

                      Đã hoàn thành{" "}
                      {
                        presetCounts.completed
                      }
                      /
                      {
                        publishedPresetCount
                      }
                    </MetaChip>
                  </>
                ) : (
                  <MetaChip>
                    Chưa có bộ đề được phát hành
                  </MetaChip>
                )}
              </div>

              <div className="mt-auto flex justify-center pt-6">
                <Link
                  href="/practice/exams"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#e9edff] px-6 text-[14.5px] font-semibold text-[#27364f] transition hover:bg-[#dfe5ff] hover:text-[#0758d9]"
                >
                  Xem bộ đề

                  <ListChecks className="size-4" />
                </Link>
              </div>
            </ExamFeatureCard>
          </div>
        </PracticeSection>

        <PracticeSection
          className="mt-9"
          title="Ôn tập"
          accent="#5c50e6"
        >
          <div className="grid gap-5 md:grid-cols-3">
            <CompactFeatureCard
              icon={
                <BookOpen className="size-[20px]" />
              }
              title="Ôn theo chương"
              description="Học kiến thức theo từng chương."
              supportingText={
                statsQuery.isLoading
                  ? "Đang tải nội dung..."
                  : statsQuery.isError
                    ? "Không tải được dữ liệu"
                    : chapterCount >
                        0
                      ? `${chapterCount} chương`
                      : "Chưa có chương phù hợp"
              }
              href="/practice/chapters"
              action="Bắt đầu ôn"
            />

            <CompactFeatureCard
              icon={
                <ListChecks className="size-[20px]" />
              }
              title="Câu đã làm sai"
              description="Luyện lại những câu bạn từng trả lời sai."
              supportingText={
                wrongQuery.isLoading
                  ? "Đang tải dữ liệu..."
                  : wrongQuery.isError
                    ? "Không tải được dữ liệu"
                    : wrongQuestionCount >
                        0
                      ? `${wrongQuestionCount} câu cần ôn`
                      : "Chưa có câu sai cần ôn"
              }
              href="/practice/wrong"
              action="Ôn lại"
            />

            <CompactFeatureCard
              tone="critical"
              icon={
                <AlertTriangle className="size-[20px]" />
              }
              title="Câu điểm liệt"
              description="Những câu cần đặc biệt chú ý khi ôn thi."
              supportingText={
                criticalOverview.isError
                  ? "Không tải được tiến độ"
                  : undefined
              }
              href="/practice/critical-questions"
              action="Luyện câu điểm liệt"
              progress={
                criticalOverview.isLoading ||
                criticalOverview.isError ||
                !criticalProgress
                  ? undefined
                  : {
                      label:
                        `${criticalLearned} / ${criticalTotal} đã học`,

                      percent:
                        criticalPercent,
                    }
              }
            />
          </div>
        </PracticeSection>

        <PracticeSection
          className="mt-9"
          title="Học nhanh"
          accent="#087f8d"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <QuickCard
              eyebrow="HÌNH ẢNH TRỰC QUAN"
              eyebrowTone="teal"
              title="Biển báo giao thông"
              description="Ghi nhớ biển báo theo từng nhóm."
              href="/practice/traffic-signs"
              action="Học biển báo"
              visual={
                <div className="flex items-center gap-4 rounded-[13px] bg-[#f0f1ff] px-4 py-3">
                  <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full border-[3px] border-[#e32636] text-[#e32636]">
                    <Ban
                      className="size-[22px]"
                      strokeWidth={
                        2.5
                      }
                    />
                  </span>

                  <span className="flex size-[29px] shrink-0 rotate-45 items-center justify-center border-2 border-[#e29d00] bg-[#ffd338]">
                    <AlertTriangle className="size-[13px] -rotate-45 text-[#26334a]" />
                  </span>

                  <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[#3975df] text-white">
                    <ArrowUp
                      className="size-[20px]"
                      strokeWidth={
                        2.5
                      }
                    />
                  </span>
                </div>
              }
            />

            <QuickCard
              eyebrow="KINH NGHIỆM THI"
              eyebrowTone="purple"
              title="Mẹo ghi nhớ"
              description="Tổng hợp những kiến thức và mẹo thường gặp khi ôn thi."
              href="/practice/memory-tips"
              action="Xem mẹo"
              visual={
                <span className="flex size-[54px] items-center justify-center rounded-[13px] bg-[#ddd9ff] text-[#5b4ee8]">
                  <Lightbulb
                    className="size-[24px]"
                    strokeWidth={
                      2
                    }
                  />
                </span>
              }
            />
          </div>
        </PracticeSection>
      </main>

      {examConfig && (
        <PracticeModeDialog
          open={
            modeDialogOpen
          }
          onOpenChange={
            setModeDialogOpen
          }
          license={
            license
          }
          totalQuestions={
            examConfig.totalQuestions
          }
          durationMinutes={
            examConfig.durationMinutes
          }
          onModeSelect={
            handleModeSelect
          }
          pending={
            startExamMutation.isPending
          }
        />
      )}
    </div>
  );
}

function PracticeLoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="font-dts flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#f8f8fc] px-6">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#fff0ef] text-[#d92d20]">
          <AlertTriangle className="size-6" />
        </span>

        <h1 className="mt-4 text-[20px] font-bold text-[#101828]">
          Không tải được dữ liệu
        </h1>

        <p className="mt-2 text-[14.5px] font-medium leading-6 text-[#475467]">
          {message}
        </p>

        <button
          type="button"
          onClick={
            onRetry
          }
          className="mt-5 h-10 rounded-[10px] bg-[#0758d9] px-5 text-[13.5px] font-semibold text-white transition hover:bg-[#064fc3]"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}

function PracticeSection({
  title,
  accent,
  className,
  children,
}: {
  title: string;
  accent: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        className
      }
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className="h-[22px] w-1.5 rounded-full"
          style={{
            backgroundColor:
              accent,
          }}
        />

        <h2 className="text-[22px] font-bold text-[#101828]">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function ExamFeatureCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <article className="flex min-h-[255px] flex-col rounded-[16px] border border-[#e1e5ed] bg-white p-6 shadow-[0_2px_6px_rgba(15,23,42,0.025)]">
      {children}
    </article>
  );
}

function FeatureIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#e9edff] text-[#0758d9]">
      {children}
    </span>
  );
}

function MetaChip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex min-h-7 items-center gap-1.5 rounded-[7px] bg-[#f0f2ff] px-2.5 py-1 text-[12.5px] font-semibold text-[#27364f]">
      {children}
    </span>
  );
}

function CompactFeatureCard({
  icon,
  title,
  description,
  supportingText,
  href,
  action,
  tone = "default",
  progress,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  supportingText?: string;
  href: string;
  action: string;
  tone?: "default" | "critical";
  progress?: {
    label: string;
    percent: number;
  };
}) {
  const critical =
    tone === "critical";

  return (
    <article className="flex min-h-[230px] flex-col rounded-[16px] border border-[#e1e5ed] bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.025)]">
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-[10px]",

          critical
            ? "bg-[#fff5e6] text-[#d97706]"
            : "bg-[#e9edff] text-[#0758d9]"
        )}
      >
        {icon}
      </span>

      <h3 className="mt-4 text-[17px] font-bold text-[#101828]">
        {title}
      </h3>

      {supportingText && (
        <span className="mt-2 inline-flex w-fit rounded-[7px] bg-[#f0f2ff] px-2.5 py-1 text-[12.5px] font-medium text-[#344054]">
          {
            supportingText
          }
        </span>
      )}

      <p className="mt-2.5 text-[14.5px] font-medium leading-6 text-[#344054]">
        {description}
      </p>

      {progress && (
        <div className="mt-3 flex items-center gap-3">
          <span
            className={cn(
              "shrink-0 text-[12.5px] font-semibold",

              critical
                ? "text-[#c66700]"
                : "text-[#344054]"
            )}
          >
            {
              progress.label
            }
          </span>

          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e6e9f4]">
            <div
              className={cn(
                "h-full rounded-full",

                critical
                  ? "bg-[#e99000]"
                  : "bg-[#0758d9]"
              )}
              style={{
                width:
                  `${Math.min(
                    100,

                    Math.max(
                      0,
                      progress.percent
                    )
                  )}%`,
              }}
            />
          </div>
        </div>
      )}

      <Link
        href={
          href
        }
        className={cn(
          "mt-auto inline-flex items-center gap-1.5 pt-5 text-[14.5px] font-semibold",

          critical
            ? "text-[#c66700]"
            : "text-[#0758d9]"
        )}
      >
        {action}

        <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

function QuickCard({
  eyebrow,
  eyebrowTone,
  title,
  description,
  href,
  action,
  visual,
}: {
  eyebrow: string;
  eyebrowTone:
    | "teal"
    | "purple";
  title: string;
  description: string;
  href: string;
  action: string;
  visual: React.ReactNode;
}) {
  return (
    <article className="flex min-h-[170px] items-center gap-7 rounded-[16px] border border-[#e1e5ed] bg-white px-6 py-5 shadow-[0_2px_6px_rgba(15,23,42,0.025)]">
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-[12.5px] font-bold uppercase tracking-[0.05em]",

            eyebrowTone ===
              "teal"
              ? "text-[#087f8d]"
              : "text-[#5b4ee8]"
          )}
        >
          {eyebrow}
        </div>

        <h3 className="mt-1.5 text-[17px] font-bold text-[#101828]">
          {title}
        </h3>

        <p className="mt-2 text-[14.5px] font-medium leading-6 text-[#344054]">
          {description}
        </p>

        <Link
          href={
            href
          }
          className={cn(
            "mt-4 inline-flex items-center gap-1.5 text-[14.5px] font-semibold",

            eyebrowTone ===
              "teal"
              ? "text-[#0758d9]"
              : "text-[#5b4ee8]"
          )}
        >
          {action}

          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="flex shrink-0 items-center justify-center">
        {visual}
      </div>
    </article>
  );
}
