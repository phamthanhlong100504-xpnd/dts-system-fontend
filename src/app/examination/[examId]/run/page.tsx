"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useExamSessionInfo, useExamPaper, useSaveAnswer, useSubmitExam, useAvailableExams } from "@/features/examination/use-examination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { MediaImage } from "@/components/ui/media-image";

export default function ExamRunPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const params = useParams();
  const urlExamId = params?.examId as string;
  const { data: availableExams } = useAvailableExams();
  
  const { data: sessionInfo, isLoading: loadingSession } = useExamSessionInfo(sessionId);
  const { data: paper, isLoading: loadingPaper } = useExamPaper(sessionId);
  const submitExam = useSubmitExam();
  const saveAnswer = useSaveAnswer();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [hasInitialized, setHasInitialized] = useState(false);
  const [violationReason, setViolationReason] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const tabSwitchCountRef = useRef(0);
  const [isFullscreenWarning, setIsFullscreenWarning] = useState(false);
  const hasEnforcedFullscreen = useRef(false);

  // Initialize answers from paper if any exist
  useEffect(() => {
    if (paper && paper.length > 0 && !hasInitialized) {
      const initialAnswers: Record<string, string[]> = {};
      paper.forEach((q: any) => {
        const qId = (q.questionId || q.id) as string;
        if (q.selectedAnswer && qId) {
          if (typeof q.selectedAnswer === "string") {
            initialAnswers[qId] = q.selectedAnswer.split(",");
          } else if (Array.isArray(q.selectedAnswer)) {
            initialAnswers[qId] = q.selectedAnswer.map(String);
          } else if (q.selectedAnswer.value) {
            initialAnswers[qId] = Array.isArray(q.selectedAnswer.value) ? q.selectedAnswer.value : String(q.selectedAnswer.value).split(",");
          } else if (q.selectedAnswer.values) {
            initialAnswers[qId] = q.selectedAnswer.values.map(String);
          }
        }
      });
      setAnswers(initialAnswers);
    }
  }, [paper, hasInitialized]);

  // Initialize and tick timer
  useEffect(() => {
    if (sessionInfo?.remainingSeconds !== undefined && timeLeft === null) {
      setTimeLeft(sessionInfo.remainingSeconds);
    }
  }, [sessionInfo, timeLeft]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return prev;
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          toast.info("Hết thời gian làm bài, hệ thống đang tự động nộp bài!");
          if (!submitExam.isPending) {
            submitExam.mutate(sessionId);
          }
          return 0;
        }
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, submitExam.isPending, sessionId, submitExam]);

  // Fullscreen requirement
  useEffect(() => {
    if (!sessionInfo?.examRule?.requireFullscreen) return;
    
    const checkFullscreen = () => {
      if (!document.fullscreenElement) {
        setIsFullscreenWarning(true);
      } else {
        setIsFullscreenWarning(false);
      }
    };
    
    document.addEventListener("fullscreenchange", checkFullscreen);
    if (!document.fullscreenElement) setIsFullscreenWarning(true);
    hasEnforcedFullscreen.current = true;
    
    return () => document.removeEventListener("fullscreenchange", checkFullscreen);
  }, [sessionInfo?.examRule]);

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen().catch(err => {
      toast.error(`Không thể vào chế độ toàn màn hình: ${err.message}`);
    });
  };

  // Prevent tab switch and devtools logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (sessionInfo?.examRule?.preventTabSwitch) {
          tabSwitchCountRef.current += 1;
          const maxSwitches = sessionInfo.examRule.maxTabSwitchCount || 0;
          
          if (tabSwitchCountRef.current > maxSwitches) {
            setViolationReason(`Bạn đã chuyển tab ${tabSwitchCountRef.current} lần (Tối đa: ${maxSwitches}). Bài thi đã bị khóa do vi phạm quy chế.`);
            toast.error("Phát hiện hành vi rời khỏi bài thi vượt quá số lần cho phép!");
            if (!submitExam.isPending) {
              submitExam.mutate(sessionId);
            }
          } else {
            toast.warning(`Cảnh báo chuyển tab lần ${tabSwitchCountRef.current}/${maxSwitches}. Không được rời khỏi màn hình thi!`);
          }
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" || 
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
        (e.ctrlKey && (e.key === "U" || e.key === "u"))
      ) {
        e.preventDefault();
        setViolationReason("Không được phép mở công cụ phát triển (DevTools).");
        toast.error("Phát hiện hành vi gian lận!");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error("Hành vi gian lận: Không được phép sử dụng chuột phải.");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [sessionInfo?.examRule, sessionId, submitExam.isPending, submitExam]);

  if (loadingSession || loadingPaper) return <div className="p-8 text-center text-muted-foreground">Đang tải đề thi...</div>;
  if (!sessionInfo || !paper) return <div className="p-8 text-center text-muted-foreground">Không tìm thấy thông tin phiên thi.</div>;

  const currentQuestion = paper[currentIndex];
  
  const isMultipleChoice = currentQuestion?.type === "MULTIPLE_CHOICE" || currentQuestion?.questionType === "MULTIPLE_CHOICE" || currentQuestion?.type === "MULTIPLE";

  const handleSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => {
      const currentSelection = prev[questionId] || [];
      let newSelection: string[];
      
      if (isMultipleChoice) {
        if (currentSelection.includes(optionId)) {
          newSelection = currentSelection.filter(id => id !== optionId);
        } else {
          newSelection = [...currentSelection, optionId];
        }
      } else {
        newSelection = [optionId];
      }
      
      saveAnswer.mutate({
        sessionId,
        payload: {
          answers: [
            {
              questionId,
              selectedAnswer: {
                type: isMultipleChoice ? 'multiple_choice' : 'single_choice',
                value: newSelection.join(","),
              },
            },
          ],
        },
      });
      return { ...prev, [questionId]: newSelection };
    });

    if (!isMultipleChoice) {
      if (currentIndex < paper.length - 1) {
        setTimeout(() => {
          setCurrentIndex(prev => Math.min(prev + 1, paper.length - 1));
        }, 300);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < paper.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleSubmit = () => {
    if (confirm("Bạn có chắc chắn muốn nộp bài? Bài thi không thể sửa lại sau khi nộp.")) {
      submitExam.mutate(sessionId);
    }
  };

  // Use sessionInfo's examId if available, fallback to url param
  const actualExamId = sessionInfo?.examId || urlExamId;
  const examInfo = availableExams?.content?.find((e: any) => e.id === actualExamId);
  const thumbnailId = examInfo?.metadata?.thumbnailId || examInfo?.thumbnailId;

  return (
    <div className="min-h-screen w-full relative bg-muted">
      {violationReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-lg border-destructive">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-destructive">Vi Phạm Quy Chế Thi</h2>
              <p className="text-muted-foreground">{violationReason}</p>
              <p className="text-sm font-medium">Hệ thống đã khóa bài thi. Bài thi sẽ tự động được nộp.</p>
              <Button 
                variant="destructive" 
                className="w-full mt-4" 
                onClick={() => {
                  if (!submitExam.isPending) submitExam.mutate(sessionId);
                }}
                disabled={submitExam.isPending}
              >
                {submitExam.isPending ? "Đang nộp bài..." : "Nộp bài ngay"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      {isFullscreenWarning && !violationReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-lg border-primary">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🖥️</span>
              </div>
              <h2 className="text-xl font-bold text-primary">Yêu cầu Toàn màn hình</h2>
              <p className="text-muted-foreground">Quy chế thi yêu cầu bạn phải làm bài ở chế độ toàn màn hình để đảm bảo tính công bằng.</p>
              <Button onClick={enterFullscreen} className="w-full mt-4">
                Bật Toàn Màn Hình
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className={`absolute inset-0 z-0 overflow-hidden ${violationReason ? 'blur-sm pointer-events-none' : ''}`}>
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
      
      <div className="relative z-10 container mx-auto max-w-6xl py-8 px-4 flex flex-col min-h-screen">
        <header className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/90 backdrop-blur p-4 rounded-xl border shadow-sm mb-6 shrink-0">
        <div>
          <h2 className="font-bold text-xl">Kỳ thi Chính thức</h2>
          <p className="text-sm text-muted-foreground">Tuân thủ nghiêm ngặt quy chế phòng thi</p>
        </div>
        
        {timeLeft !== null && (
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs uppercase font-bold text-muted-foreground mb-1">Thời gian còn lại</span>
            <div className={`font-mono text-2xl font-bold px-4 py-1.5 rounded-lg border ${timeLeft < 60 ? 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse' : 'bg-muted border-border'}`}>
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}

        <div className="flex gap-4 items-center">
          <Button variant="destructive" onClick={handleSubmit} disabled={submitExam.isPending || (timeLeft !== null && timeLeft <= 0)} size="lg" className="font-bold">
            {submitExam.isPending ? "Đang nộp..." : "Nộp bài thi"}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          {paper.length === 0 ? (
            <Card className="rounded-2xl shadow-sm border h-full flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="text-xl font-bold text-muted-foreground">Bài thi này chưa có câu hỏi nào</div>
                <p className="text-sm text-muted-foreground">Vui lòng liên hệ quản trị viên để cập nhật đề thi.</p>
              </div>
            </Card>
          ) : currentQuestion ? (
            <Card className="rounded-2xl shadow-sm border h-full">
              <CardContent className="p-8 space-y-6">
                <div className="font-bold text-xl">Câu {currentIndex + 1}: {currentQuestion.content || currentQuestion.questionText}</div>
                {currentQuestion.imageUrl && (
                  <MediaImage src={currentQuestion.imageUrl} alt="Question" className="max-w-full max-h-52 rounded-xl shadow-sm border" />
                )}
                <div className="space-y-3 pt-4">
                  {currentQuestion.options?.map((opt: any, i: number) => {
                    const optionId = opt.id?.toString();
                    const optionLabel = ['A','B','C','D','E','F'][i] || (i + 1).toString();
                    const qId = (currentQuestion.questionId || currentQuestion.id) as string;
                    const isSelected = (answers[qId] || []).includes(optionId);
                    return (
                      <div 
                        key={i} 
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 ${isSelected ? 'border-primary bg-primary/10 shadow-sm' : 'hover:bg-muted/50 border-border'}`}
                        onClick={() => handleSelect(qId, optionId)}
                      >
                        <span className={`font-bold mr-3 inline-flex items-center justify-center w-8 h-8 rounded-lg border ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                          {optionLabel}
                        </span> 
                        {opt.text || opt.label}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <div className="border-t p-4 bg-muted/20 flex justify-between rounded-b-2xl">
                <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
                  Câu trước
                </Button>
                <Button variant="outline" onClick={handleNext} disabled={currentIndex === paper.length - 1}>
                  Câu sau
                </Button>
              </div>
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
              const qId = (q.questionId || q.id) as string;
              const isAnswered = answers[qId] && answers[qId].length > 0;
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={qId}
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
    </div>
  );
}
