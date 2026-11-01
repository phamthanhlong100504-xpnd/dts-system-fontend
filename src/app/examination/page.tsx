"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { RequireAuth } from "@/components/require-auth";
import { OfficialExamsContent } from "@/features/examination/components/official-exams/official-exams-content";
import type { OfficialExamListItem } from "@/features/examination/official-exam-types";
import {
  useLicenseHasHydrated,
  useLicenseStore,
} from "@/stores/license-store";

export default function ExaminationListPage() {
  return (
    <RequireAuth>
      <ExaminationListContent />
    </RequireAuth>
  );
}

function ExaminationListContent() {
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

  function handleOpenExam(
    exam: OfficialExamListItem
  ) {
    router.push(`/examination/${exam.examId}?examVersionId=${encodeURIComponent(exam.examVersionId ?? "")}`);
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#f7f6fb] text-[#101828]">
      <OfficialExamsContent
        licenseClass={selectedLicense}
        onStartExam={handleOpenExam}
      />
    </main>
  );
}