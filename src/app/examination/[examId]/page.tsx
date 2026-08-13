"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStartExamSessionAndGo } from "@/features/examination/use-examination";
import { AlertCircle, Clock, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ExamWaitingRoom() {
  const { examId } = useParams() as { examId: string };
  const startMutation = useStartExamSessionAndGo();

  const handleStart = () => {
    startMutation.mutate({ examId });
  };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <Card className="rounded-2xl border shadow-sm">
        <CardContent className="p-8 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">Kỳ thi Chính thức</h1>
            <p className="text-muted-foreground">ID Kỳ thi: {examId}</p>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Quy chế thi đặc biệt lưu ý
            </h3>
            <ul className="space-y-2 text-sm text-destructive/90 list-disc list-inside">
              <li>Bài thi sẽ tự động nộp khi hết thời gian quy định.</li>
              <li>Hệ thống có thể cảnh báo hoặc tự động thu bài nếu bạn cố tình chuyển tab.</li>
              <li>Không được phép thoát giữa chừng khi chưa nộp bài.</li>
            </ul>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              className="px-12 font-bold bg-primary text-primary-foreground text-lg h-14"
              onClick={handleStart}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? "Đang chuẩn bị đề..." : "Tôi đã hiểu, Bắt đầu thi"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
