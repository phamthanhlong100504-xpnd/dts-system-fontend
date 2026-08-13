"use client";

import { useParams } from "next/navigation";
import { useExamResultData } from "@/features/examination/use-examination";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Home } from "lucide-react";
import Link from "next/link";

export default function ExamResultPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const { data: result, isLoading } = useExamResultData(sessionId) as any;

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Đang tải kết quả...</div>;
  if (!result) return <div className="p-12 text-center text-muted-foreground">Không tìm thấy kết quả.</div>;

  const isPassed = result.passed;

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 flex flex-col items-center min-h-screen">
      <Card className="w-full rounded-3xl border shadow-sm mt-8">
        <CardContent className="p-12 space-y-8 flex flex-col items-center text-center">
          {isPassed ? (
            <div className="h-28 w-28 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-16 w-16" />
            </div>
          ) : (
            <div className="h-28 w-28 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <XCircle className="h-16 w-16" />
            </div>
          )}

          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              {isPassed ? "Chúc mừng bạn đã ĐẠT!" : "Rất tiếc, bạn KHÔNG ĐẠT"}
            </h1>
            <p className="text-muted-foreground text-lg">
              Kết quả thi chính thức của bạn đã được lưu vào hệ thống.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 w-full max-w-md pt-4">
            <div className="bg-muted/30 p-6 rounded-2xl border flex flex-col items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground mb-1">Điểm số</span>
              <span className="text-4xl font-black text-foreground">{result.score || result.correctCount || 0}</span>
              <span className="text-sm text-muted-foreground mt-1">/ {result.totalQuestions || 0}</span>
            </div>
            <div className="bg-muted/30 p-6 rounded-2xl border flex flex-col items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground mb-1">Trạng thái</span>
              <span className={`text-2xl font-black mt-2 ${isPassed ? 'text-emerald-600' : 'text-destructive'}`}>
                {isPassed ? 'ĐẠT' : 'TRƯỢT'}
              </span>
            </div>
          </div>

          <div className="pt-8">
            <Link href="/">
              <Button size="lg" className="gap-2 font-bold px-8 h-12 text-base">
                <Home className="h-5 w-5" />
                Về trang chủ
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
