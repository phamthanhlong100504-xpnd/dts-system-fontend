"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RequireAuth } from "@/components/require-auth";
import { HistoryContent } from "@/features/history/components/history-content";
import { resolveHistoryResultPath } from "@/features/history/history-navigation";
import type { HistoryListItem } from "@/features/history/history-types";
import { getHistoryDetail } from "@/features/result/result-service";
import { useLicenseHasHydrated, useLicenseStore } from "@/stores/license-store";

export default function HistoryPage() {
  return <RequireAuth><HistoryPageContent /></RequireAuth>;
}

function HistoryPageContent() {
  const router = useRouter();
  const licenseHydrated = useLicenseHasHydrated();
  const selectedLicense = useLicenseStore(state => state.selectedLicense);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const resolvingRef = useRef(false);

  useEffect(() => {
    if (licenseHydrated && !selectedLicense) router.replace("/");
  }, [licenseHydrated, selectedLicense, router]);

  if (!licenseHydrated || !selectedLicense) return null;

  async function handleViewResult(item: HistoryListItem) {
    if (resolvingRef.current || !resolveHistoryResultPath(item)) return;
    resolvingRef.current = true;
    setResolvingId(item.resultId);
    try {
      // Result ID để kiểm tra ownership; nguồn thực sẽ tự tải khi tới trang kết quả.
      const detail = await getHistoryDetail(item.resultId);
      if (detail.id !== item.resultId || detail.targetType !== "EXAM") {
        throw new Error("Dữ liệu kết quả không khớp.");
      }
      const path = resolveHistoryResultPath(detail);
      if (!path) throw new Error("Kết quả này hiện chưa thể xem.");
      router.push(path);
    } catch {
      toast.error("Không mở được kết quả lúc này. Vui lòng thử lại.");
    } finally {
      resolvingRef.current = false;
      setResolvingId(null);
    }
  }

  return <main className="min-h-[calc(100vh-122px)] bg-[#f7f6fb] text-[#101828]">
    <HistoryContent key={selectedLicense} licenseClass={selectedLicense} onViewResult={handleViewResult} resolvingId={resolvingId} />
  </main>;
}
