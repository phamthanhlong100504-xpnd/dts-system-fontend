"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useExamSessionInfo, useExamPaper, useSaveAnswer, useSubmitExam } from "@/features/examination/use-examination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function ExamRunPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  
  const { data: sessionInfo, isLoading: loadingSession } = useExamSessionInfo(sessionId);
  const { data: paper, isLoading: loadingPaper } = useExamPaper(sessionId);
  const submitExam = useSubmitExam();
  const saveAnswer = useSaveAnswer();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Prevent tab switch logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.error("Bạn đã chuyển tab! Hành vi này đã được ghi lại.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  if (loadingSession || loadingPaper) return <div className="p-8 text-center text-muted-foreground">Đang tải đề thi...</div>;
  if (!sessionInfo || !paper) return <div className="p-8 text-center text-muted-foreground">Không tìm thấy thông tin phiên thi.</div>;

  const currentQuestion = paper[currentIndex];
  
  const handleSelect = (questionId: string, answerId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
    saveAnswer.mutate({ sessionId, payload: { questionId, selectedAnswer: answerId } });
  };

  const handleSubmit = () => {
    if (confirm("Bạn có chắc chắn muốn nộp bài? Bài thi không thể sửa lại sau khi nộp.")) {
      submitExam.mutate(sessionId);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 flex flex-col min-h-screen">
      <header className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm mb-6 shrink-0">
        <div>
          <h2 className="font-bold text-xl">Kỳ thi Chính thức</h2>
          <p className="text-sm text-muted-foreground">Tuân thủ nghiêm ngặt quy chế phòng thi</p>
        </div>
        <div className="flex gap-4 items-center">
          <Button variant="destructive" onClick={handleSubmit} disabled={submitExam.isPending} size="lg" className="font-bold">
            {submitExam.isPending ? "Đang nộp..." : "Nộp bài thi"}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          {currentQuestion ? (
            <Card className="rounded-2xl shadow-sm border h-full">
              <CardContent className="p-8 space-y-6">
                <div className="font-bold text-xl">Câu {currentIndex + 1}: {currentQuestion.questionText}</div>
                {currentQuestion.imageUrl && (
                  <img src={currentQuestion.imageUrl} alt="Question" className="max-w-full h-auto rounded-xl shadow-sm" />
                )}
                <div className="space-y-3 pt-4">
                  {currentQuestion.options?.map((opt: any, i: number) => {
                    const optionId = opt.id?.toString() || ['A','B','C','D'][i];
                    const isSelected = answers[currentQuestion.id] === optionId;
                    return (
                      <div 
                        key={i} 
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 ${isSelected ? 'border-primary bg-primary/10 shadow-sm' : 'hover:bg-muted/50 border-border'}`}
                        onClick={() => handleSelect(currentQuestion.id, optionId)}
                      >
                        <span className="font-bold mr-3 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-background border">{optionId}</span> 
                        {opt.text || opt.label}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>Loading...</div>
          )}
        </div>
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-80 shrink-0 bg-card border rounded-2xl p-6 shadow-sm h-fit">
          <h3 className="font-bold mb-4 text-center border-b pb-2">Danh sách câu hỏi</h3>
          <div className="grid grid-cols-5 gap-2">
            {paper.map((q: any, i: number) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold border transition-all
                    ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}
                    ${isAnswered ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background hover:bg-muted'}
                  `}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
