
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { RequireAuth } from "@/components/require-auth";
import { ChaptersContent } from "@/features/practice/components/chapters/chapters-content";
import type { ChapterLearningProgress } from "@/features/practice/chapter-overview-types";
import { useLicenseByCode } from "@/features/license/use-license";
import {
  useLicenseHasHydrated,
  useLicenseStore,
} from "@/stores/license-store";

export default function ChaptersPage() {
  return (
    <RequireAuth>
      <ChaptersPageContent />
    </RequireAuth>
  );
}

function ChaptersPageContent() {
  const router = useRouter();

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

  function openChapter(
    chapter: ChapterLearningProgress
  ) {
    router.push(
      `/practice/chapter/${chapter.chapterId}`
    );
  }

  if (!hasHydrated || isCatalogLoading) {
    return (
      <ChaptersPageSkeleton />
    );
  }

  if (!selectedLicense) {
    return null;
  }

  if (isCatalogError) {
    return (
      <ChaptersCatalogError
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
      <ChaptersPageSkeleton />
    );
  }

  if (!license) {
    return (
      <ChaptersCatalogError
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

  return (
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
        <Link
          href="/practice"
          className="
            inline-flex
            items-center
            gap-2
            py-1
            text-[14px]
            font-semibold
            text-[#667085]
            transition
            hover:text-[#0758d9]
          "
        >
          <ArrowLeft
            className="size-4"
            strokeWidth={2}
          />

          Quay lại Ôn luyện
        </Link>

        <section
          className="
            mx-auto
            mt-5
            w-full
            max-w-[1240px]
          "
        >
          <ChaptersContent
            licenseClass={
              license.code
            }
            onStartChapter={
              openChapter
            }
            onResumeChapter={
              openChapter
            }
            onReviewChapter={
              openChapter
            }
          />
        </section>
      </div>
    </main>
  );
}

function ChaptersPageSkeleton() {
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
            h-7
            w-36
            animate-pulse
            rounded-[8px]
            bg-[#e9ebf1]
          "
        />

        <div
          className="
            mx-auto
            mt-5
            w-full
            max-w-[1240px]
          "
        >
          <div
            className="
              h-9
              w-60
              animate-pulse
              rounded-[8px]
              bg-[#e4e6ed]
            "
          />

          <div
            className="
              mt-2
              h-5
              w-[420px]
              max-w-full
              animate-pulse
              rounded-[6px]
              bg-[#ebedf2]
            "
          />

          <div
            className="
              mt-6
              h-[104px]
              animate-pulse
              rounded-[18px]
              border
              border-[#e4e5ec]
              bg-white
              p-5
            "
          >
            <div
              className="
                h-5
                w-44
                rounded
                bg-[#eceef4]
              "
            />

            <div
              className="
                mt-6
                h-2
                rounded-full
                bg-[#eceef4]
              "
            />
          </div>

          <div
            className="
              mt-[0.9cm]
              grid
              grid-cols-1
              gap-[0.9cm]
              lg:grid-cols-2
            "
          >
            {Array.from({
              length: 4,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="
                    min-h-[238px]
                    animate-pulse
                    rounded-[18px]
                    border
                    border-[#e4e5ec]
                    bg-white
                    p-5
                  "
                >
                  <div
                    className="
                      h-7
                      w-24
                      rounded-[7px]
                      bg-[#eceef4]
                    "
                  />

                  <div
                    className="
                      mt-4
                      h-5
                      w-[72%]
                      rounded
                      bg-[#eceef4]
                    "
                  />

                  <div
                    className="
                      mt-6
                      h-4
                      w-[48%]
                      rounded
                      bg-[#f0f1f5]
                    "
                  />

                  <div
                    className="
                      mt-4
                      h-2
                      rounded-full
                      bg-[#eceef4]
                    "
                  />

                  <div
                    className="
                      mt-6
                      ml-auto
                      h-10
                      w-36
                      rounded-[10px]
                      bg-[#e8ebf2]
                    "
                  />
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ChaptersCatalogError({
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

        <p className="mt-2 text-[12px] font-medium text-[#667085]">
          {message}
        </p>

        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="h-9 rounded-[9px] bg-[#f2f4f7] px-4 text-[11px] font-semibold text-[#475467]"
          >
            Quay lại
          </button>

          <button
            type="button"
            onClick={onRetry}
            className="h-9 rounded-[9px] bg-[#0758d9] px-4 text-[11px] font-semibold text-white"
          >
            Thử lại
          </button>
        </div>
      </div>
    </main>
  );
}
