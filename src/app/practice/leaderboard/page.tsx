"use client";

import {
  useEffect,
} from "react";
import {
  useRouter,
} from "next/navigation";

import { RequireAuth } from "@/components/require-auth";
import { LeaderboardContent } from "@/features/leaderboard/components/leaderboard-content";
import {
  useLicenseHasHydrated,
  useLicenseStore,
} from "@/stores/license-store";

export default function LeaderboardPage() {
  return (
    <RequireAuth>
      <LeaderboardPageContent />
    </RequireAuth>
  );
}

function LeaderboardPageContent() {
  const router =
    useRouter();

  const licenseHydrated =
    useLicenseHasHydrated();

  const selectedLicense =
    useLicenseStore(
      (state) =>
        state.selectedLicense
    );

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
    !selectedLicense
  ) {
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-122px)] bg-[#f7f6fb] text-[#101828]">
      <LeaderboardContent
        licenseClass={
          selectedLicense
        }
      />
    </main>
  );
}