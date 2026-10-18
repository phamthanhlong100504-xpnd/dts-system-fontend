"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { RequireAuth } from "@/components/require-auth";
import { ResultAnalyticsContent } from "@/features/result-analytics/components/result-analytics-content";
import { useLicenseHasHydrated, useLicenseStore } from "@/stores/license-store";

export default function ResultsPage() {
  return (
    <RequireAuth>
      <ResultsPageContent />
    </RequireAuth>
  );
}

function ResultsPageContent() {
  const router = useRouter();
  const licenseHydrated = useLicenseHasHydrated();
  const selectedLicense = useLicenseStore((state) => state.selectedLicense);

  useEffect(() => {
    if (licenseHydrated && !selectedLicense) router.replace("/");
  }, [licenseHydrated, selectedLicense, router]);

  if (!licenseHydrated || !selectedLicense) return null;

  function handleOpenHistory() {
    router.push("/practice/history");
  }

  return (
    <main className="min-h-[calc(100vh-122px)] bg-[#f7f6fb] text-[#101828]">
      <ResultAnalyticsContent
        licenseClass={selectedLicense}
        onOpenHistory={handleOpenHistory}
      />
    </main>
  );
}