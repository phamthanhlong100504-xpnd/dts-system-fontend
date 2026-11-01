"use client";

import { RequireAuth } from "@/components/require-auth";
import { ProfileContent } from "@/features/profile/components/profile-content";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <main className="min-h-[calc(100vh-122px)] bg-[#f7f6fb] text-[#101828] dark:bg-[#101827] dark:text-[#f8fafc]">
        <ProfileContent />
      </main>
    </RequireAuth>
  );
}