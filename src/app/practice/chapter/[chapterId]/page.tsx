
"use client";

import { useEffect } from "react";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { RequireAuth } from "@/components/require-auth";
import { ChapterSessionContent } from "@/features/practice/components/chapters/chapter-session-content";
import { CHAPTER_META } from "@/features/practice/practice-service";
import { useChapterSessionQuestions } from "@/features/practice/use-chapter-session";
import { useLicenseByCode } from "@/features/license/use-license";
import {
  useLicenseHasHydrated,
  useLicenseStore,
} from "@/stores/license-store";

export default function ChapterPage() {
  return (
    <RequireAuth>
      <ChapterPageContent />
    </RequireAuth>
  );
}

function ChapterPageContent() {
  const params = useParams<{
    chapterId: string;
  }>();

  const router = useRouter();
  const searchParams = useSearchParams();

  const fromProgress =
    searchParams.get("from") === "progress";

  const returnHref = fromProgress
    ? "/progress"
    : "/practice/chapters";

  const hasHydrated =
    useLicenseHasHydrated();

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

  const chapterId = Number(params.chapterId);

  const validChapterId =
    Number.isInteger(chapterId) &&
    chapterId >= 1 &&
    chapterId <= 6;

  const questionsQuery =
    useChapterSessionQuestions(
      validChapterId && isCatalogReady
        ? chapterId
        : undefined,
      isCatalogReady
        ? license?.code
        : undefined
    );

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!selectedLicense) {
      router.replace("/");
      return;
    }

    if (!validChapterId) {
      router.replace(returnHref);
    }
  }, [
    hasHydrated,
    router,
    selectedLicense,
    validChapterId,
    returnHref,
  ]);

  if (
    !hasHydrated ||
    isCatalogLoading
  ) {
    return <ChapterPageSkeleton />;
  }

  if (
    !selectedLicense ||
    !validChapterId
  ) {
    return null;
  }

  if (isCatalogError) {
    return (
      <ChapterLoadError
        title="Không thể tải danh mục GPLX"
        message="Không lấy được thông tin hạng GPLX từ Practice Service. Vui lòng thử lại."
        onRetry={() => {
          void refetchCatalog();
        }}
        onBack={() => {
          router.push(returnHref);
        }}
      />
    );
  }

  if (!isCatalogReady) {
    return <ChapterPageSkeleton />;
  }

  if (!license) {
    return (
      <ChapterLoadError
        title="Không tìm thấy hạng GPLX"
        message="Hạng GPLX đang sử dụng không có trong danh mục Practice hiện tại. Vui lòng tải lại hoặc quay về Ôn luyện."
        onRetry={() => {
          void refetchCatalog();
        }}
        onBack={() => {
          router.push(
            fromProgress
              ? "/progress"
              : "/practice"
          );
        }}
      />
    );
  }

  if (questionsQuery.isLoading) {
    return <ChapterPageSkeleton />;
  }

  if (questionsQuery.isError) {
    return (
      <ChapterLoadError
        onRetry={() => {
          void questionsQuery.refetch();
        }}
        onBack={() => {
          router.push(returnHref);
        }}
      />
    );
  }

  const questions =
    questionsQuery.data ?? [];

  if (questions.length === 0) {
    return (
      <ChapterNotAvailable
        onBack={() => {
          router.replace(returnHref);
        }}
      />
    );
  }

  const chapterTitle =
    CHAPTER_META[String(chapterId)]?.name ??
    `Chương ${chapterId}`;

  return (
    <ChapterSessionContent
      licenseClass={license.code}
      chapterId={chapterId}
      chapterTitle={chapterTitle}
      questions={questions}
      onChangeChapter={(nextChapterId) => {
        const path =
          `/practice/chapter/${nextChapterId}`;

        router.push(
          fromProgress
            ? `${path}?from=progress`
            : path
        );
      }}
    />
  );
}

function ChapterPageSkeleton() {
  return (
    <main className="font-dts min-h-screen bg-[#f7f6fb]">
      <div className="h-16 animate-pulse border-b border-[#e8ebf1] bg-white" />

      <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-5 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[620px] animate-pulse rounded-[16px] border border-[#e4e6ed] bg-white" />
        <div className="h-[360px] animate-pulse rounded-[16px] border border-[#e4e6ed] bg-white" />
      </div>
    </main>
  );
}

function ChapterLoadError({
  onRetry,
  onBack,
  title = "Không thể tải câu hỏi",
  message = "Không lấy được dữ liệu từ Practice Service.",
}: {
  onRetry: () => void;
  onBack: () => void;
  title?: string;
  message?: string;
}) {
  return (
    <main className="font-dts flex min-h-screen items-center justify-center bg-[#f7f6fb] px-6">
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

function ChapterNotAvailable({
  onBack,
}: {
  onBack: () => void;
}) {
  return (
    <main className="font-dts flex min-h-screen items-center justify-center bg-[#f7f6fb] px-6">
      <div className="w-full max-w-[460px] rounded-[16px] border border-[#e3e6ed] bg-white px-6 py-10 text-center">
        <h1 className="text-[16px] font-bold text-[#101828]">
          Chương này không thuộc hạng GPLX đang học
        </h1>

        <button
          type="button"
          onClick={onBack}
          className="mt-4 h-9 rounded-[9px] bg-[#0758d9] px-4 text-[11px] font-semibold text-white"
        >
          Quay lại danh sách chương
        </button>
      </div>
    </main>
  );
}
