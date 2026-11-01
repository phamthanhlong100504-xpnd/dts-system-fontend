
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, RefreshCcw } from "lucide-react";

import { RequireAuth } from "@/components/require-auth";
import { useLicenseByCode } from "@/features/license/use-license";
import { WrongQuestionSessionContent } from "@/features/practice/components/wrong-questions/wrong-question-session-content";
import { WrongQuestionSummaryContent } from "@/features/practice/components/wrong-questions/wrong-question-summary-content";
import {
  useFinishWrongQuestionSession,
  useSaveWrongQuestionCursor,
  useStartWrongQuestionSession,
  useSubmitWrongQuestionAnswer,
  useToggleWrongQuestionBookmark,
  useWrongQuestionSession,
} from "@/features/practice/use-wrong-question-session";
import {
  useLicenseHasHydrated,
  useLicenseStore,
} from "@/stores/license-store";

export default function WrongQuestionReviewPage() {
  return (
    <RequireAuth>
      <WrongQuestionReviewPageContent />
    </RequireAuth>
  );
}

function WrongQuestionReviewPageContent() {
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

  const licenseCode =
    isCatalogReady ? license?.code ?? "" : "";

  const sessionId =
    searchParams.get("sessionId")?.trim() ?? "";

  const autoStartedRef = useRef(false);

  const sessionQuery = useWrongQuestionSession(
    sessionId || undefined
  );

  const {
    mutateAsync: startSession,
    isPending: isStarting,
    isError: isStartError,
  } = useStartWrongQuestionSession();

  const {
    mutate: submitAnswer,
    isPending: isAnswering,
  } = useSubmitWrongQuestionAnswer();

  const {
    mutate: saveCursor,
    isPending: isSavingCursor,
  } = useSaveWrongQuestionCursor();

  const {
    mutate: finishSession,
    isPending: isFinishing,
  } = useFinishWrongQuestionSession();

  const {
    mutate: toggleBookmark,
    isPending: isUpdatingBookmark,
  } = useToggleWrongQuestionBookmark();

  useEffect(() => {
    if (hydrated && !selectedLicense) {
      router.replace("/");
    }
  }, [hydrated, selectedLicense, router]);

  useEffect(() => {
    if (
      !hydrated ||
      !isCatalogReady ||
      !licenseCode ||
      sessionId ||
      autoStartedRef.current
    ) {
      return;
    }

    autoStartedRef.current = true;

    void startSession({
      licenseClass: licenseCode,
    })
      .then((session) => {
        if (!session?.sessionId) {
          return;
        }

        router.replace(
          `/practice/wrong/review?sessionId=${encodeURIComponent(
            session.sessionId
          )}`
        );
      })
      .catch(() => {
        autoStartedRef.current = false;
      });
  }, [
    hydrated,
    isCatalogReady,
    licenseCode,
    router,
    sessionId,
    startSession,
  ]);

  const session = sessionQuery.data;

  const bookmarkedQuestionIds = useMemo(
    () =>
      session?.questions
        .filter((question) => question.bookmarked)
        .map((question) => question.questionId) ?? [],
    [session?.questions]
  );

  function startAnotherReview() {
    if (
      !isCatalogReady ||
      !licenseCode ||
      isStarting
    ) {
      return;
    }

    void startSession({
      licenseClass: licenseCode,
    })
      .then((nextSession) => {
        if (!nextSession?.sessionId) {
          return;
        }

        router.replace(
          `/practice/wrong/review?sessionId=${encodeURIComponent(
            nextSession.sessionId
          )}`
        );
      })
      .catch(() => undefined);
  }

  function handlePositionChange(position: number) {
    if (!session || isSavingCursor) {
      return;
    }

    const question = session.questions.find(
      (item) => item.position === position
    );

    if (!question) {
      return;
    }

    saveCursor({
      sessionId: session.sessionId,
      questionId: question.questionId,
    });
  }

  function handleAnswer(
    questionId: number,
    selectedAnswer: string
  ) {
    if (!session || isAnswering) {
      return;
    }

    submitAnswer({
      sessionId: session.sessionId,
      payload: {
        questionId,
        selectedAnswer,
      },
    });
  }

  function handleBookmark(questionId: number) {
    if (!session || isUpdatingBookmark) {
      return;
    }

    const question = session.questions.find(
      (item) => item.questionId === questionId
    );

    if (!question) {
      return;
    }

    toggleBookmark({
      sessionId: session.sessionId,
      licenseClass: session.licenseClass,
      chapterId: question.chapterId,
      questionId,
      bookmarked: !question.bookmarked,
    });
  }

  function handleFinish() {
    if (!session || isFinishing) {
      return;
    }

    finishSession(session.sessionId);
  }

  function handleRetry() {
    if (sessionId) {
      void sessionQuery.refetch();
      return;
    }

    autoStartedRef.current = false;
    startAnotherReview();
  }

  if (!hydrated) {
    return <WrongQuestionReviewSkeleton />;
  }

  if (!selectedLicense) {
    return null;
  }

  if (isCatalogLoading) {
    return <WrongQuestionReviewSkeleton />;
  }

  if (isCatalogError) {
    return (
      <WrongQuestionReviewError
        title="Không thể tải danh mục GPLX"
        message="Không lấy được thông tin hạng GPLX từ Practice Service. Vui lòng thử lại."
        onBack={() =>
          router.push("/practice/wrong")
        }
        onRetry={() => {
          void refetchCatalog();
        }}
        retrying={false}
      />
    );
  }

  if (!isCatalogReady) {
    return <WrongQuestionReviewSkeleton />;
  }

  if (!license) {
    return (
      <WrongQuestionReviewError
        title="Không tìm thấy hạng GPLX"
        message="Hạng GPLX đang học không có trong danh mục Practice hiện tại. Vui lòng thử tải lại."
        onBack={() =>
          router.push("/practice/wrong")
        }
        onRetry={() => {
          void refetchCatalog();
        }}
        retrying={false}
      />
    );
  }

  if (!sessionId) {
    if (isStartError) {
      return (
        <WrongQuestionReviewError
          onBack={() =>
            router.push("/practice/wrong")
          }
          onRetry={handleRetry}
          retrying={isStarting}
        />
      );
    }

    return <WrongQuestionReviewSkeleton />;
  }

  if (
    sessionQuery.isLoading ||
    sessionQuery.isFetching
  ) {
    return <WrongQuestionReviewSkeleton />;
  }

  if (sessionQuery.isError || !session) {
    return (
      <WrongQuestionReviewError
        onBack={() =>
          router.push("/practice/wrong")
        }
        onRetry={handleRetry}
        retrying={sessionQuery.isFetching}
      />
    );
  }

  if (session.status === "COMPLETED") {
    return (
      <WrongQuestionSummaryContent
        licenseClass={session.licenseClass}
        totalQuestions={session.totalQuestions}
        answeredQuestions={session.answeredQuestions}
        correctCount={session.correctCount}
        wrongCount={session.wrongCount}
        unansweredCount={session.unansweredCount}
        remainingCount={session.remainingCount}
        retrying={isStarting}
        onBackToPractice={() =>
          router.push("/practice")
        }
        onReviewRemaining={startAnotherReview}
      />
    );
  }

  return (
    <WrongQuestionSessionContent
      session={session}
      bookmarkedQuestionIds={bookmarkedQuestionIds}
      pendingAnswer={isAnswering}
      submitting={isFinishing}
      onExit={() =>
        router.push("/practice/wrong")
      }
      onSubmit={handleFinish}
      onPositionChange={handlePositionChange}
      onSelectAnswer={handleAnswer}
      onToggleBookmark={handleBookmark}
    />
  );
}

function WrongQuestionReviewSkeleton() {
  return (
    <main className="font-dts min-h-screen bg-[#f7f6fb]">
      <div className="h-[78px] animate-pulse border-b border-[#e8ebf1] bg-white" />

      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-7 px-6 pb-14 pt-[1.5cm] lg:grid-cols-[minmax(0,830px)_360px]">
        <div className="h-[560px] animate-pulse rounded-[16px] border border-[#dedfea] bg-white" />
        <div className="h-[420px] animate-pulse rounded-[16px] border border-[#dedfea] bg-white" />
      </div>
    </main>
  );
}

function WrongQuestionReviewError({
  onBack,
  onRetry,
  retrying,
  title = "Không mở được phiên ôn lại",
  message = "Không thể tải hoặc tạo phiên ôn câu sai ở thời điểm hiện tại.",
}: {
  onBack: () => void;
  onRetry: () => void;
  retrying: boolean;
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
          Quay lại câu đã sai
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
