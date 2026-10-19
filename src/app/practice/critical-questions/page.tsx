
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { RequireAuth } from "@/components/require-auth";
import { CriticalQuestionsContent } from "@/features/practice/components/critical-questions/critical-questions-content";
import type { CriticalQuestionSessionMode } from "@/features/practice/critical-session-types";
import { useStartCriticalQuestionSession } from "@/features/practice/use-critical-question-session";
import { useLicenseByCode } from "@/features/license/use-license";
import {
  useLicenseHasHydrated,
  useLicenseStore,
} from "@/stores/license-store";

export default function CriticalQuestionsPage() {
  return (
    <RequireAuth>
      <CriticalQuestionsPageContent />
    </RequireAuth>
  );
}

function CriticalQuestionsPageContent() {
  const router = useRouter();

  const hydrated = useLicenseHasHydrated();

  const selectedLicense = useLicenseStore(
    (state) => state.selectedLicense
  );

  const {
    license,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    isCatalogReady,
    refetch: refetchCatalog,
  } = useLicenseByCode(selectedLicense);

  const startMutation = useStartCriticalQuestionSession();


  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!selectedLicense) {
      router.replace("/");
    }
  }, [hydrated, selectedLicense, router]);


  function handleStartStudy(
    mode: CriticalQuestionSessionMode
  ) {
    if (
      !isCatalogReady ||
      !license ||
      startMutation.isPending
    ) {
      return;
    }

    startMutation.mutate(
      {
        licenseClass: license.code,
        mode,
        restart: false,
      },
      {
        onSuccess: (session) => {
          router.push(
            `/practice/critical-questions/review?sessionId=${encodeURIComponent(
              session.sessionId
            )}`
          );
        },
      }
    );
  }

  if (!hydrated) {
    return <CriticalQuestionsPageSkeleton />;
  }

  if (!selectedLicense) {
    return null;
  }

  if (isCatalogLoading) {
    return <CriticalQuestionsPageSkeleton />;
  }

  if (isCatalogError) {
    return (
      <CriticalQuestionsCatalogError
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
    return <CriticalQuestionsPageSkeleton />;
  }

  if (!license) {
    return (
      <CriticalQuestionsCatalogError
        title="Không tìm thấy hạng GPLX"
        message="Hạng GPLX đang sử dụng không có trong danh mục Practice hiện tại. Vui lòng tải lại hoặc quay về Ôn luyện."
        onRetry={() => {
          void refetchCatalog();
        }}
        onBack={() => {
          router.push("/practice");
        }}
      />
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#f7f6fb]">
      <CriticalQuestionsContent
        licenseClass={license.code}
        starting={startMutation.isPending}
        onStartStudy={handleStartStudy}
      />
    </main>
  );
}

function CriticalQuestionsPageSkeleton() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#f7f6fb]">
      <div className="w-full pb-14 pt-7">
        <div className="px-5 lg:px-[1cm]">
          <div className="h-5 w-36 animate-pulse rounded bg-[#e9edf5]" />
        </div>

        <div className="mx-auto mt-5 w-full max-w-[1240px] px-6">
          <div className="h-8 w-52 animate-pulse rounded bg-[#e9edf5]" />

          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-[#e9edf5]" />

          <div className="mx-auto mt-8 h-[390px] w-full max-w-[860px] animate-pulse rounded-[18px] border border-[#dedfea] bg-white" />
        </div>
      </div>
    </main>
  );
}

function CriticalQuestionsCatalogError({
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
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#f7f6fb] px-6">
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
