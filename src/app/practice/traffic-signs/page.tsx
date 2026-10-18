"use client";

import { useState } from "react";

import { RequireAuth } from "@/components/require-auth";
import { TrafficSignDetailDrawer } from "@/features/practice/components/traffic-signs/traffic-sign-detail-drawer";
import { TrafficSignsContent } from "@/features/practice/components/traffic-signs/traffic-signs-content";
import type { TrafficSign } from "@/features/practice/traffic-sign-types";

export default function TrafficSignsPage() {
  return (
    <RequireAuth>
      <TrafficSignsPageContent />
    </RequireAuth>
  );
}

function TrafficSignsPageContent() {
  const [selectedSign, setSelectedSign] = useState<TrafficSign | null>(null);

  return (
    <>
      <main className="min-h-[calc(100vh-64px)] bg-[#f7f6fb]">
        <TrafficSignsContent onOpenDetail={setSelectedSign} />
      </main>

      <TrafficSignDetailDrawer
        open={selectedSign !== null}
        sign={selectedSign}
        onClose={() => setSelectedSign(null)}
      />
    </>
  );
}
