
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { RequireAuth } from "@/components/require-auth";
import { ProgressLearningContent } from "@/features/progress-learning/components/progress-learning-content";
import type { LearningChapterProgress } from "@/features/progress-learning/progress-learning-types";
import {
  useLicenseHasHydrated,
  useLicenseStore,
} from "@/stores/license-store";

export default function ProgressPage() {
  return (
    <RequireAuth>
      <ProgressPageContent />
    </RequireAuth>
  );
}

function ProgressPageContent() {
  const router = useRouter();
  const licenseHydrated = useLicenseHasHydrated();
  const selectedLicense = useLicenseStore(
    (state) => state.selectedLicense
  );

  useEffect(() => {
    if (licenseHydrated && !selectedLicense) {
      router.replace("/");
    }
  }, [licenseHydrated, selectedLicense, router]);

  if (!licenseHydrated || !selectedLicense) {
    return null;
  }

  function handleOpenChapter(
    chapter: LearningChapterProgress
  ) {
    router.push(
      `/practice/chapter/${chapter.chapterId}?from=progress`
    );
  }

  function handleOpenReview() {
    router.push("/practice/wrong");
  }

  function handleOpenCritical() {
    router.push("/practice/critical-questions");
  }

  return (
    <main className="min-h-[calc(100vh-122px)] bg-[#f7f6fb] text-[#101828]">
      <ProgressLearningContent
        licenseClass={selectedLicense}
        onOpenChapter={handleOpenChapter}
        onOpenReview={handleOpenReview}
        onOpenCritical={handleOpenCritical}
      />
    </main>
  );
}
