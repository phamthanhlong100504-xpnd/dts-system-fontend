"use client";

import { useEffect } from "react";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { RequireAuth } from "@/components/require-auth";
import { OfficialExamWaitingRoomContent } from "@/features/examination/components/official-exam-waiting-room/official-exam-waiting-room-content";
import { useStartExamSessionAndGo } from "@/features/examination/use-examination";
import {
  useLicenseHasHydrated,
  useLicenseStore,
} from "@/stores/license-store";

export default function ExamWaitingRoom() {
  return (
    <RequireAuth>
      <ExamWaitingRoomContent />
    </RequireAuth>
  );
}

function ExamWaitingRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { examId } = useParams<{
    examId: string;
  }>();

  const licenseHydrated =
    useLicenseHasHydrated();

  const selectedLicense =
    useLicenseStore(
      (state) => state.selectedLicense
    );

  const startMutation =
    useStartExamSessionAndGo();

  useEffect(() => {
    if (
      licenseHydrated &&
      !selectedLicense
    ) {
      router.replace("/");
    }
  }, [
    licenseHydrated,
    selectedLicense,
    router,
  ]);

  if (
    !licenseHydrated ||
    !selectedLicense ||
    !examId
  ) {
    return null;
  }

  function handleStart(examVersionId?: string) {
    if (startMutation.isPending) return;
    startMutation.mutate({ examId, examVersionId: examVersionId || searchParams.get("examVersionId") || undefined });
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#f7f6fb] text-[#101828]">
      <OfficialExamWaitingRoomContent
        examId={examId}
        examVersionId={searchParams.get("examVersionId") || undefined}
        licenseClass={selectedLicense}
        onStart={handleStart}
        isStarting={
          startMutation.isPending
        }
      />
    </main>
  );
}