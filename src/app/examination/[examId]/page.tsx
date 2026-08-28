"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStartExamSessionAndGo, useAvailableExams } from "@/features/examination/use-examination";
import { AlertCircle, Clock, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MediaImage } from "@/components/ui/media-image";

export default function ExamWaitingRoom() {
  const { examId } = useParams() as { examId: string };
  const startMutation = useStartExamSessionAndGo();

  const handleStart = () => {
    startMutation.mutate({ examId });
  };

  const { data: availableExams } = useAvailableExams();
  const examInfo = availableExams?.content?.find((e: any) => e.id === examId);
  const thumbnailId = examInfo?.metadata?.thumbnailId || examInfo?.thumbnailId;

  return (
    <div className="min-h-screen w-full relative bg-muted">
      <div className="absolute inset-0 z-0 overflow-hidden">
        {thumbnailId ? (
          <MediaImage 
            src={thumbnailId} 
            alt="Exam Background" 
            className="w-full h-full object-cover opacity-60 blur-sm scale-105" 
          />
        ) : (
          <div 
            className="w-full h-full bg-cover bg-center bg-fixed bg-no-repeat"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1920&auto=format&fit=crop')" }}
          />
        )}
      </div>
      <div className="absolute inset-0 z-0 bg-background/80 backdrop-blur-lg"></div>
      
      <div className="relative z-10 container mx-auto max-w-4xl py-12 px-4 flex flex-col min-h-screen justify-center">
        <Card className="rounded-2xl border shadow-sm bg-card/95 backdrop-blur">
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
    </div>
  );
}
