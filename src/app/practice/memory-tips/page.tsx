"use client";

import { RequireAuth } from "@/components/require-auth";
import { MemoryTipsContent } from "@/features/practice/components/memory-tips/memory-tips-content";

export default function MemoryTipsPage() {
  return (
    <RequireAuth>
      <main className="min-h-[calc(100vh-64px)] bg-[#f7f6fb]">
        <MemoryTipsContent />
      </main>
    </RequireAuth>
  );
}