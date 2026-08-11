"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useExamStore, useHasExamHydrated } from "@/stores/exam-store";
import { useExamSession } from "@/features/practice/use-practice";
import { ExamRunner } from "@/features/practice/components/exam-runner";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Màn làm bài. Resume logic:
 * - Store đã có session trùng examId → render ngay từ store (không ghi đè đáp án).
 * - Store khác/trống → lấy GET /exams/{id}: nếu hết hạn/hoàn tất → về kết quả,
 *   ngược lại khởi tạo store từ session.
 * - Luôn fetch session nền để phát hiện bài đã bị server đóng (TIMEOUT).
 */
export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  const hydrated = useHasExamHydrated();
  const storeExamId = useExamStore((s) => s.examId);
  const storeQuestions = useExamStore((s) => s.questions);
  const startSession = useExamStore((s) => s.startSession);
  const clear = useExamStore((s) => s.clear);

  const sessionQuery = useExamSession(hydrated ? examId : "");

  const hasStoreData = storeExamId === examId && storeQuestions.length > 0;

  useEffect(() => {
    const data = sessionQuery.data;
    if (!data || !data.status) return;
    if (data.status !== "IN_PROGRESS") {
      clear();
      router.replace(`/practice/result/${examId}`);
      return;
    }
    // Nạp session vào store nếu store chưa có examId này HOẶC câu hỏi trong store bị rỗng
    if (storeExamId !== examId || !storeQuestions.length) {
      startSession(data);
    }
  }, [sessionQuery.data, storeExamId, storeQuestions.length, examId, router, startSession, clear]);

  if (!hydrated) {
    return (
      <RequireAuth>
        <ExamSkeleton />
      </RequireAuth>
    );
  }

  // Đã có dữ liệu trong store từ trước (vừa tạo xong từ dialog) → render ngay
  if (hasStoreData) {
    return (
      <RequireAuth>
        <ExamRunner examId={examId} />
      </RequireAuth>
    );
  }

  // Khi chưa có dữ liệu store và API gặp lỗi
  if (sessionQuery.isError) {
    return (
      <RequireAuth>
        <div className="mx-auto max-w-2xl space-y-4 py-8 text-center">
          <p className="text-sm text-destructive">
            Không tải được bài thi. Vui lòng kiểm tra lại kết nối.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => sessionQuery.refetch()} variant="default">
              Thử lại
            </Button>
            <Button asChild variant="outline">
              <Link href="/practice">Về trang luyện tập</Link>
            </Button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <ExamSkeleton />
    </RequireAuth>
  );
}

function ExamSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 py-8">
      <Skeleton className="h-24" />
      <Skeleton className="h-40" />
    </div>
  );
}

