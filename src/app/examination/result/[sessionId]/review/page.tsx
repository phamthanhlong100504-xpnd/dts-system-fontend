"use client";

import { useParams, useRouter } from "next/navigation";
import { useExamReview } from "@/features/examination/use-examination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/utils";

export default function ExamReviewPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const { data: review, isLoading, error } = useExamReview(sessionId) as any;

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Đang tải chi tiết bài làm...</div>;
  if (error) {
    const errorMessage = error?.message || error?.response?.data?.message || "Đã xảy ra lỗi khi tải kết quả.";
    return (
      <div className="p-12 text-center text-destructive">
        <h2 className="text-xl font-bold mb-2">Lỗi</h2>
        <p>{errorMessage}</p>
        <Button className="mt-4" onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }
  if (!review) return <div className="p-12 text-center text-muted-foreground">Không tìm thấy chi tiết bài làm.</div>;

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      <div className="bg-background border-b sticky top-0 z-10 shadow-sm">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">Xem lại chi tiết bài làm</h1>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-emerald-600">Đúng: {review.correctCount}</span>
            <span className="text-muted-foreground">/</span>
            <span>Tổng: {review.totalQuestions}</span>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        {review.questions?.map((q: any, index: number) => {
          const isCorrect = q.isCorrect;
          
          return (
            <Card key={q.id} className={cn("overflow-hidden border-l-4", isCorrect ? "border-l-emerald-500" : "border-l-destructive")}>
              <CardHeader className="bg-muted/50 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      Câu {index + 1}
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </CardTitle>
                    <div className="text-sm prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: q.content }} />
                  </div>
                </div>
                {q.mediaFileIds && q.mediaFileIds.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {q.mediaFileIds.map((mediaId: string) => (
                      <MediaImage key={mediaId} src={mediaId} className="w-full h-auto rounded-lg border" />
                    ))}
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="pt-6 space-y-3">
                {q.options?.map((opt: any) => {
                  let userSelectedValues: string[] = [];
                  if (q.userAnswer && q.userAnswer.value) {
                    if (typeof q.userAnswer.value === 'string') {
                      userSelectedValues = q.userAnswer.value.split(",");
                    } else if (Array.isArray(q.userAnswer.value)) {
                      userSelectedValues = q.userAnswer.value.map(String);
                    }
                  }

                  const isSelected = userSelectedValues.includes(opt.id);
                  const isOptionCorrect = opt.isCorrect;
                  
                  let bgClass = "bg-background border";
                  if (isOptionCorrect && isSelected) {
                    bgClass = "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800";
                  } else if (isOptionCorrect && !isSelected) {
                    bgClass = "bg-emerald-50/50 border-emerald-200 border-dashed dark:bg-emerald-950/20 dark:border-emerald-800";
                  } else if (!isOptionCorrect && isSelected) {
                    bgClass = "bg-destructive/10 border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40";
                  }

                  return (
                    <div key={opt.id} className={cn("p-4 rounded-lg flex gap-3 transition-colors", bgClass)}>
                      <div className="flex-1 text-sm" dangerouslySetInnerHTML={{ __html: opt.content }} />
                      <div className="flex items-center gap-2">
                        {isOptionCorrect && <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded dark:bg-emerald-900 dark:text-emerald-300">Đáp án đúng</span>}
                        {isSelected && <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-300">Bạn chọn</span>}
                      </div>
                    </div>
                  );
                })}

                {q.explanation && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-2">Giải thích:</h4>
                    <div className="text-sm text-blue-900/80 dark:text-blue-200" dangerouslySetInnerHTML={{ __html: q.explanation }} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
