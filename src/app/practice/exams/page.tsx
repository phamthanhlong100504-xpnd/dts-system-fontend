
"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import {
  ArrowLeft,
} from "lucide-react";

import { RequireAuth } from "@/components/require-auth";
import { useLicenseByCode } from "@/features/license/use-license";
import { PracticeModeDialog } from "@/features/practice/components/practice-mode-dialog";
import { PresetExamsContent } from "@/features/practice/components/preset-exams/preset-exams-content";

import type {
  ExamMode,
} from "@/features/practice/practice-service";

import type {
  PresetExamSet,
} from "@/features/practice/preset-exam-types";

import {
  useStartPresetExam,
} from "@/features/practice/use-preset-exams";

import {
  useLicenseHasHydrated,
  useLicenseStore,
} from "@/stores/license-store";

export default function PresetExamsPage() {
  return (
    <RequireAuth>
      <PresetExamsPageContent />
    </RequireAuth>
  );
}

function PresetExamsPageContent() {
  const router =
    useRouter();

  const [
    selectedPresetExam,
    setSelectedPresetExam,
  ] =
    useState<PresetExamSet | null>(
      null
    );

  const startPresetExam =
    useStartPresetExam();

  const hasHydrated =
    useLicenseHasHydrated();

  const selectedLicense =
    useLicenseStore(
      (state) =>
        state.selectedLicense
    );

  const {
    license,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    isCatalogReady,
    refetch: refetchCatalog,
  } = useLicenseByCode(selectedLicense);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!selectedLicense) {
      router.replace("/");
    }
  }, [
    hasHydrated,
    selectedLicense,
    router,
  ]);

  function handlePresetExamStart(
    exam: PresetExamSet
  ) {
    setSelectedPresetExam(
      exam
    );
  }

  function handlePresetExamResume(
    exam: PresetExamSet
  ) {
    const sessionId =
      exam.latestAttempt
        ?.sessionId;

    if (!sessionId) {
      return;
    }

    router.push(
      `/practice/exam/${sessionId}`
    );
  }

  function handleModeSelect(
    mode: ExamMode
  ) {
    if (
      !selectedPresetExam ||
      !license ||
      !isCatalogReady ||
      startPresetExam.isPending
    ) {
      return;
    }

    startPresetExam.mutate({
      presetExamSetId:
        selectedPresetExam.id,

      mode,
    });
  }

  if (!hasHydrated) {
    return (
      <PresetExamsPageSkeleton />
    );
  }

  if (!selectedLicense) {
    return null;
  }

  if (isCatalogLoading) {
    return (
      <PresetExamsPageSkeleton />
    );
  }

  if (isCatalogError) {
    return (
      <PresetExamsCatalogError
        title="Không thể tải danh mục GPLX"
        message="Không lấy được thông tin hạng GPLX từ Practice Service. Vui lòng thử lại."
        onRetry={() => {
          void refetchCatalog();
        }}
        onBack={() => {
          router.push("/practice");
        }}
      />
    );
  }

  if (!isCatalogReady) {
    return (
      <PresetExamsPageSkeleton />
    );
  }

  if (!license) {
    return (
      <PresetExamsCatalogError
        title="Không tìm thấy hạng GPLX"
        message="Hạng GPLX đang sử dụng không tồn tại trong danh mục Practice hiện tại. Vui lòng thử tải lại."
        onRetry={() => {
          void refetchCatalog();
        }}
        onBack={() => {
          router.push("/practice");
        }}
      />
    );
  }

  const selectedExamDurationMinutes =
    selectedPresetExam
      ? Math.max(
          1,
          Math.ceil(
            selectedPresetExam.durationSeconds /
              60
          )
        )
      : undefined;

  return (
    <>
      <main
        className="
          font-dts
          min-h-[calc(100vh-64px)]
          bg-[#f7f6fb]
          text-[#101828]
        "
      >
        <div
          className="
            w-full
            px-6
            pb-16
            pt-6
            lg:px-[38px]
          "
        >
          {/* Back */}
          <Link
            href="/practice"
            className="
              inline-flex
              items-center
              gap-2
              rounded-[8px]
              px-2
              py-1.5
              text-[14.5px]
              font-semibold
              text-[#344054]
              transition
              hover:bg-[#eef1f7]
              hover:text-[#101828]
            "
          >
            <ArrowLeft
              className="size-4"
              strokeWidth={2}
            />

            Quay lại Ôn luyện
          </Link>

          {/* Content */}
          <section
            className="
              mx-auto
              mt-5
              w-full
              max-w-[1240px]
            "
          >
            <PresetExamsContent
              licenseClass={
                license.code
              }
              pendingExamId={
                startPresetExam.isPending
                  ? selectedPresetExam
                      ?.id
                  : null
              }
              onStartExam={
                handlePresetExamStart
              }
              onResumeExam={
                handlePresetExamResume
              }
            />
          </section>
        </div>
      </main>

      <PracticeModeDialog
        open={
          selectedPresetExam !==
          null
        }
        onOpenChange={(
          open
        ) => {
          if (
            !open &&
            !startPresetExam.isPending
          ) {
            setSelectedPresetExam(
              null
            );
          }
        }}
        license={license}
        totalQuestions={
          selectedPresetExam
            ?.totalQuestions
        }
        durationMinutes={
          selectedExamDurationMinutes
        }
        pending={
          startPresetExam.isPending
        }
        onModeSelect={
          handleModeSelect
        }
      />
    </>
  );
}

/* ========================================================= */
/* Initial hydration skeleton                                */
/* ========================================================= */

function PresetExamsPageSkeleton() {
  return (
    <main
      className="
        font-dts
        min-h-[calc(100vh-64px)]
        bg-[#f7f6fb]
      "
    >
      <div
        className="
          w-full
          px-6
          pb-16
          pt-6
          lg:px-[38px]
        "
      >
        <div
          className="
            h-8
            w-40
            animate-pulse
            rounded-[8px]
            bg-[#e9ebf1]
          "
        />

        <div
          className="
            mx-auto
            mt-6
            w-full
            max-w-[1240px]
          "
        >
          <div
            className="
              flex
              items-end
              justify-between
              gap-6
            "
          >
            <div>
              <div
                className="
                  h-10
                  w-56
                  animate-pulse
                  rounded-[8px]
                  bg-[#e4e6ed]
                "
              />

              <div
                className="
                  mt-2
                  h-5
                  w-80
                  animate-pulse
                  rounded-[6px]
                  bg-[#ebedf2]
                "
              />
            </div>

            <div
              className="
                hidden
                h-9
                w-52
                animate-pulse
                rounded-full
                bg-[#e8ebf2]
                sm:block
              "
            />
          </div>

          <div
            className="
              mt-6
              flex
              gap-2.5
            "
          >
            {Array.from({
              length: 4,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="
                    h-9
                    w-28
                    animate-pulse
                    rounded-full
                    bg-[#e8ebf2]
                  "
                />
              )
            )}
          </div>

          <div
            className="
              mt-7
              grid
              grid-cols-1
              gap-9
              md:grid-cols-2
              lg:grid-cols-3
            "
          >
            {Array.from({
              length: 6,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="
                    min-h-[230px]
                    animate-pulse
                    rounded-[18px]
                    border
                    border-[#e4e5ec]
                    bg-white
                    p-5
                  "
                >
                  <div className="h-7 w-16 rounded-[7px] bg-[#eceef4]" />

                  <div className="mt-4 h-5 w-[78%] rounded bg-[#eceef4]" />

                  <div className="mt-3 h-4 w-[50%] rounded bg-[#f0f1f5]" />

                  <div className="mt-8 h-[48px] rounded-[11px] bg-[#f0f2f7]" />

                  <div className="mt-4 h-10 w-36 rounded-[10px] bg-[#e8ebf2]" />
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function PresetExamsCatalogError({
  title,
  message,
  onRetry,
  onBack,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <main className="font-dts flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#f7f6fb] px-6">
      <div className="w-full max-w-[460px] rounded-[16px] border border-[#e3e6ed] bg-white px-6 py-10 text-center">
        <h1 className="text-[16px] font-bold text-[#101828]">
          {title}
        </h1>

        <p className="mt-2 text-[12.5px] font-medium text-[#475467]">
          {message}
        </p>

        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="h-9 rounded-[9px] bg-[#f2f4f7] px-4 text-[11.5px] font-semibold text-[#344054]"
          >
            Quay lại
          </button>

          <button
            type="button"
            onClick={onRetry}
            className="h-9 rounded-[9px] bg-[#0758d9] px-4 text-[11.5px] font-semibold text-white"
          >
            Thử lại
          </button>
        </div>
      </div>
    </main>
  );
}
