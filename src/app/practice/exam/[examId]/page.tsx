"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Send,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

interface QuestionItem {
  id: number;
  text: string;
  isCritical?: boolean;
  options: string[];
}

const MOCK_QUESTIONS: QuestionItem[] = [
  {
    id: 1,
    text: "Khi di chuyển trên đường cao tốc, người lái xe phải tuân thủ quy tắc nào sau đây?",
    options: [
      "Cho xe chạy trên làn đường dừng xe khẩn cấp.",
      "Chỉ được cho xe chạy trên các làn đường theo quy định, tuân thủ tốc độ tối đa và tối thiểu.",
      "Vượt xe về phía bên phải nếu thấy trống.",
      "Quay đầu xe ở bất kỳ nơi nào có khoảng trống.",
    ],
  },
  {
    id: 2,
    text: "Hành vi điều khiển xe cơ giới chạy quá tốc độ quy định, giành đường vượt ẩu có bị nghiêm cấm không?",
    isCritical: true,
    options: [
      "Bị nghiêm cấm tùy theo tuyến đường.",
      "Bị nghiêm cấm hoàn toàn.",
      "Không bị nghiêm cấm nếu không gây tai nạn.",
      "Tùy thuộc vào thời gian trong ngày.",
    ],
  },
  {
    id: 3,
    text: "Biển nào dưới đây báo hiệu đường dành cho xe ô tô?",
    options: [
      "Biển 1 (Biển R.403a).",
      "Biển 2 (Biển R.403b).",
      "Biển 3 (Biển R.404).",
      "Cả Biển 1 và Biển 2.",
    ],
  },
  {
    id: 4,
    text: "Người điều khiển xe mô hai bánh, xe gắn máy có được phép sử dụng ô, dù, điện thoại di động khi đang lái xe không?",
    isCritical: true,
    options: [
      "Được phép nếu sử dụng tai nghe bluetooth.",
      "Không được phép.",
      "Được phép nếu chạy tốc độ chậm.",
      "Được phép khi vắng người.",
    ],
  },
];

export default function StudentExamRunnerPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(22 * 60); // 22 minutes
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.warning("Hết giờ làm bài! Bài thi sẽ tự động được nộp.");
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const currentQ = MOCK_QUESTIONS[currentIndex];
  const answeredCount = Object.keys(userAnswers).length;

  const handleSelectOption = (optionIndex: number) => {
    setUserAnswers({ ...userAnswers, [currentIndex]: optionIndex });
  };

  const handleSubmit = () => {
    if (answeredCount < MOCK_QUESTIONS.length) {
      if (!window.confirm(`Bạn mới làm ${answeredCount}/${MOCK_QUESTIONS.length} câu. Bạn có chắc muốn nộp bài?`)) {
        return;
      }
    }
    setIsSubmitting(true);
    toast.success("Đã nộp bài thi thành công!");
    setTimeout(() => router.push(`/practice/result/${examId}`), 1000);
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-between">
      {/* Top Fixed Header */}
      <header className="bg-card border-b px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/practice/exams")} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-base text-foreground leading-tight">
              Kỳ thi sát hạch lý thuyết GPLX Hạng B2 — Bộ đề {examId}
            </h1>
            <p className="text-xs text-muted-foreground">Thời gian làm bài: 22 phút · 35 câu hỏi</p>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold px-3 py-1.5 rounded-lg border bg-background"
          >
            {isPaused ? <Play className="h-4 w-4 text-emerald-500" /> : <Pause className="h-4 w-4" />}
            {isPaused ? "Tiếp tục" : "Tạm dừng"}
          </button>

          <div className="flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/30 px-4 py-1.5 rounded-full font-mono font-bold text-base">
            <Clock className="h-4 w-4 animate-pulse" />
            {formattedTime}
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 font-bold bg-primary">
            <Send className="h-4 w-4" /> Nộp bài
          </Button>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="container mx-auto max-w-6xl py-6 px-4 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Question Card */}
        <div className="lg:col-span-8 space-y-4 flex flex-col justify-between">
          <Card className="rounded-2xl shadow-sm border flex-1 flex flex-col">
            <CardContent className="p-6 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-bold text-xs">
                    CÂU HỎI {currentIndex + 1} / {MOCK_QUESTIONS.length}
                  </Badge>
                  {currentQ.isCritical && (
                    <Badge variant="destructive" className="gap-1 font-bold">
                      <AlertTriangle className="h-3.5 w-3.5" /> CÂU ĐIỂM LIỆT
                    </Badge>
                  )}
                </div>

                <h2 className="text-lg font-bold text-foreground leading-relaxed">
                  {currentQ.text}
                </h2>
              </div>

              {/* Options Radio List */}
              <div className="space-y-3 my-6">
                {currentQ.options.map((optText, optIdx) => {
                  const isSelected = userAnswers[currentIndex] === optIdx;
                  const label = String.fromCharCode(65 + optIdx);
                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm font-semibold ring-1 ring-primary"
                          : "border-border bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                      <span className="font-bold text-sm text-muted-foreground">{label}.</span>
                      <p className="text-sm text-foreground flex-1 leading-relaxed">{optText}</p>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Câu trước
                </Button>
                <span className="text-xs text-muted-foreground font-semibold">
                  Đã trả lời {answeredCount}/{MOCK_QUESTIONS.length} câu
                </span>
                <Button
                  disabled={currentIndex === MOCK_QUESTIONS.length - 1}
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="gap-2"
                >
                  Câu tiếp <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Question Navigator Grid Sidebar */}
        <div className="lg:col-span-4">
          <Card className="rounded-2xl shadow-sm border">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground">Danh sách câu hỏi</h3>
                <span className="text-xs font-semibold text-primary">{answeredCount}/{MOCK_QUESTIONS.length} hoàn thành</span>
              </div>

              {/* Grid 35 squares */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {MOCK_QUESTIONS.map((q, idx) => {
                  const isAnswered = userAnswers[idx] !== undefined;
                  const isCurrent = currentIndex === idx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center relative transition-all ${
                        isCurrent
                          ? "ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground shadow-md scale-105"
                          : isAnswered
                          ? "bg-emerald-500 text-white font-extrabold"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {idx + 1}
                      {q.isCritical && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full" title="Câu điểm liệt" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
                  <span>Đã trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-muted shrink-0" />
                  <span>Chưa trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-destructive shrink-0" />
                  <span>Câu điểm liệt (Cần lưu ý)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
