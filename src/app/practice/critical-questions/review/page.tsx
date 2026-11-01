
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  RefreshCcw,
} from "lucide-react";

import { RequireAuth } from "@/components/require-auth";
import { useLicenseByCode } from "@/features/license/use-license";
import { CriticalQuestionSessionContent } from "@/features/practice/components/critical-questions/critical-question-session-content";
import {
  useCriticalQuestionSession,
  useSaveCriticalQuestionCursor,
  useStartCriticalQuestionSession,
  useSubmitCriticalQuestionAnswer,
  useToggleCriticalQuestionBookmark,
} from "@/features/practice/use-critical-question-session";
import {
  useLicenseHasHydrated,
  useLicenseStore,
} from "@/stores/license-store";

export default function CriticalQuestionReviewPage() {
  return (
    <RequireAuth>
      <CriticalQuestionReviewPageContent />
    </RequireAuth>
  );
}

function CriticalQuestionReviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const sessionId =
    searchParams.get("sessionId")?.trim() ?? "";

  const sessionQuery =
    useCriticalQuestionSession(
      sessionId || undefined
    );

  const {
    mutate: submitAnswer,
    isPending: isAnswering,
  } = useSubmitCriticalQuestionAnswer();

  const {
    mutate: saveCursor,
    isPending: isSavingCursor,
  } = useSaveCriticalQuestionCursor();

  const {
    mutate: toggleBookmark,
    isPending: isUpdatingBookmark,
  } = useToggleCriticalQuestionBookmark();

  const {
    mutate: startSession,
    isPending: isStartingReview,
  } = useStartCriticalQuestionSession();

  const session =
    sessionQuery.data;

  useEffect(() => {
    if (hydrated && !selectedLicense) {
      router.replace("/");
    }
  }, [hydrated, selectedLicense, router]);

  useEffect(() => {
    if (
      hydrated &&
      selectedLicense &&
      !sessionId
    ) {
      router.replace(
        "/practice/critical-questions"
      );
    }
  }, [
    hydrated,
    selectedLicense,
    router,
    sessionId,
  ]);

  function handlePositionChange(
    position: number
  ) {
    if (
      !session ||
      session.status !== "IN_PROGRESS" ||
      isSavingCursor
    ) {
      return;
    }

    const question =
      session.questions.find(
        (item) =>
          item.position === position
      );

    if (!question) {
      return;
    }

    saveCursor({
      sessionId: session.sessionId,
      payload: {
        questionId:
          question.questionId,
      },
    });
  }

  function handleAnswer(
    questionId: number,
    selectedAnswer: string
  ) {
    if (
      !session ||
      session.status !== "IN_PROGRESS" ||
      isAnswering
    ) {
      return;
    }

    submitAnswer({
      licenseClass:
        session.licenseClass,
      sessionId:
        session.sessionId,
      questionId,
      selectedAnswer,
    });
  }

  function handleBookmark(
    questionId: number
  ) {
    if (
      !session ||
      isUpdatingBookmark
    ) {
      return;
    }

    const question =
      session.questions.find(
        (item) =>
          item.questionId ===
          questionId
      );

    if (!question) {
      return;
    }

    toggleBookmark({
      sessionId:
        session.sessionId,

      chapterId:
        question.chapterId,

      questionId,

      payload: {
        licenseClass:
          session.licenseClass,

        bookmarked:
          !question.bookmarked,
      },
    });
  }

  function handleReviewAgain() {
    if (
      !session ||
      isStartingReview
    ) {
      return;
    }

    startSession(
      {
        licenseClass:
          session.licenseClass,

        mode: "REVIEW",

        restart: true,
      },
      {
        onSuccess: (
          nextSession
        ) => {
          router.replace(
            `/practice/critical-questions/review?sessionId=${encodeURIComponent(
              nextSession.sessionId
            )}`
          );
        },
      }
    );
  }


  if (!hydrated) {
    return <CriticalQuestionReviewSkeleton />;
  }

  if (!selectedLicense || !sessionId) {
    return null;
  }

  if (isCatalogLoading) {
    return <CriticalQuestionReviewSkeleton />;
  }

  if (isCatalogError) {
    return (
      <CriticalQuestionReviewError
        title="Không thể tải danh mục GPLX"
        message="Không lấy được thông tin hạng GPLX từ Practice Service. Vui lòng thử lại."
        retrying={isCatalogLoading}
        onBack={() =>
          router.push(
            "/practice/critical-questions"
          )
        }
        onRetry={() =>
          void refetchCatalog()
        }
      />
    );
  }

  if (!isCatalogReady) {
    return <CriticalQuestionReviewSkeleton />;
  }

  if (!license) {
    return (
      <CriticalQuestionReviewError
        title="Không tìm thấy hạng GPLX"
        message="Hạng GPLX đang sử dụng không có trong danh mục Practice hiện tại. Vui lòng thử tải lại."
        retrying={false}
        onBack={() =>
          router.push(
            "/practice/critical-questions"
          )
        }
        onRetry={() =>
          void refetchCatalog()
        }
      />
    );
  }


  if (
    sessionQuery.isLoading
  ) {
    return (
      <CriticalQuestionReviewSkeleton />
    );
  }

  if (
    sessionQuery.isError ||
    !session
  ) {
    return (
      <CriticalQuestionReviewError
        retrying={
          sessionQuery.isFetching
        }
        onBack={() =>
          router.push(
            "/practice/critical-questions"
          )
        }
        onRetry={() =>
          void sessionQuery.refetch()
        }
      />
    );
  }

  return (
    <CriticalQuestionSessionContent
      key={session.sessionId}
      session={session}
      pendingAnswer={isAnswering}
      updatingBookmark={
        isUpdatingBookmark
      }
      startingReview={
        isStartingReview
      }
      onExit={() =>
        router.push(
          "/practice/critical-questions"
        )
      }
      onPositionChange={
        handlePositionChange
      }
      onSelectAnswer={
        handleAnswer
      }
      onToggleBookmark={
        handleBookmark
      }
      onReviewAgain={
        handleReviewAgain
      }
    />
  );
}

function CriticalQuestionReviewSkeleton() {
  return (
    <main className="font-dts min-h-screen bg-[#f7f6fb]">
      <div className="h-[78px] animate-pulse border-b border-[#e8ebf1] bg-white" />

      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-7 px-6 pb-14 pt-[1.5cm] lg:grid-cols-[minmax(0,830px)_360px]">
        <div className="h-[590px] animate-pulse rounded-[16px] border border-[#dedfea] bg-white" />
        <div className="h-[420px] animate-pulse rounded-[16px] border border-[#dedfea] bg-white" />
      </div>
    </main>
  );
}

function CriticalQuestionReviewError({
  retrying,
  onBack,
  onRetry,
  title = "Không mở được phiên câu điểm liệt",
  message = "Không thể tải phiên học hoặc ôn lại câu điểm liệt ở thời điểm hiện tại.",
}: {
  retrying: boolean;
  onBack: () => void;
  onRetry: () => void;
  title?: string;
  message?: string;
}) {
  return (
    <main className="font-dts min-h-screen bg-[#f7f6fb] text-[#101828]">
      <div className="px-5 pt-7 lg:px-[1cm]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 py-2 text-[13.5px] font-medium text-[#475467] transition hover:text-[#0758d9]"
        >
          <ArrowLeft className="size-4" />
          Quay lại Câu điểm liệt
        </button>
      </div>

      <div className="mx-auto flex w-full justify-center px-6 pb-16 pt-[3cm]">
        <section className="w-full max-w-[720px] rounded-[18px] border border-[#fecdca] bg-white px-9 py-10 text-center shadow-[0_4px_14px_rgba(31,41,55,0.055)]">
          <div className="mx-auto flex size-14 items-center justify-center rounded-[12px] bg-[#fff1f0] text-[#d92d20]">
            <AlertCircle className="size-6" />
          </div>

          <h1 className="mt-5 text-[21px] font-bold">
            {title}
          </h1>

          <p className="mx-auto mt-3 max-w-[520px] text-[14.5px] font-medium leading-[1.7] text-[#475467]">
            {message}
          </p>

          <button
            type="button"
            disabled={retrying}
            onClick={onRetry}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0758d9] px-6 text-[13.5px] font-semibold text-white transition hover:bg-[#064fc3] disabled:pointer-events-none disabled:opacity-60"
          >
            {retrying ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCcw className="size-4" />
            )}

            Thử lại
          </button>
        </section>
      </div>
    </main>
  );
}
