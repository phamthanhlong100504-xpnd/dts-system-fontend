"use client";

import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  RotateCcw,
  ArrowLeft,
  BookOpen,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, useParams } from "next/navigation";

interface ReviewQuestion {
  id: number;
  text: string;
  isCritical?: boolean;
  options: { label: string; text: string; isCorrect: boolean; isUserChoice: boolean }[];
  explanation: string;
}

const MOCK_REVIEW_QUESTIONS: ReviewQuestion[] = [
  {
    id: 1,
    text: "Khi di chuyển trên đường cao tốc, người lái xe phải tuân thủ quy tắc nào sau đây?",
    options: [
      { label: "A", text: "Cho xe chạy trên làn đường dừng xe khẩn cấp.", isCorrect: false, isUserChoice: false },
      { label: "B", text: "Chỉ được cho xe chạy trên các làn đường theo quy định, tuân thủ tốc độ tối đa và tối thiểu.", isCorrect: true, isUserChoice: true },
      { label: "C", text: "Vượt xe về phía bên phải nếu thấy trống.", isCorrect: false, isUserChoice: false },
      { label: "D", text: "Quay đầu xe ở bất kỳ nơi nào có khoảng trống.", isCorrect: false, isUserChoice: false },
    ],
    explanation: "Theo Luật Giao thông Đường bộ, trên đường cao tốc người điều khiển phương tiện phải tuân thủ làn đường quy định và tốc độ cho phép.",
  },
  {
    id: 2,
    text: "Hành vi điều khiển xe cơ giới chạy quá tốc độ quy định, giành đường vượt ẩu có bị nghiêm cấm không?",
    isCritical: true,
    options: [
      { label: "A", text: "Bị nghiêm cấm tùy theo tuyến đường.", isCorrect: false, isUserChoice: true },
      { label: "B", text: "Bị nghiêm cấm hoàn toàn.", isCorrect: true, isUserChoice: false },
      { label: "C", text: "Không bị nghiêm cấm nếu không gây tai nạn.", isCorrect: false, isUserChoice: false },
      { label: "D", text: "Tùy thuộc vào thời gian trong ngày.", isCorrect: false, isUserChoice: false },
    ],
    explanation: "Chạy quá tốc độ và giành đường vượt ẩu là các hành vi bị nghiêm cấm hoàn toàn theo Điều 8 Luật Giao thông đường bộ.",
  },
];

export default function StudentExamResultPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const score = 33;
  const total = 35;
  const isPassed = score >= 32;
  const timeSpent = "14 phút 20 giây";

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-8">
      {/* Back Button */}
      <div>
        <Link href="/practice/exams">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Quay về danh sách bài thi
          </Button>
        </Link>
      </div>

      {/* Hero Result Banner */}
      <Card className={`rounded-3xl border-2 shadow-md ${isPassed ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-destructive/30 bg-destructive/5"}`}>
        <CardContent className="p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full shadow-md bg-white dark:bg-card">
            {isPassed ? (
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            ) : (
              <XCircle className="h-12 w-12 text-destructive" />
            )}
          </div>

          <div className="space-y-2">
            <Badge
              className={`text-sm px-4 py-1 font-bold ${
                isPassed ? "bg-emerald-500 text-white" : "bg-destructive text-white"
              }`}
            >
              {isPassed ? "ĐÃ ĐẠT YÊU CẦU SÁT HẠCH" : "KHÔNG ĐẠT YÊU CẦU"}
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              {score} / {total} câu đúng
            </h1>
            <p className="text-sm text-muted-foreground">
              Kỳ thi sát hạch lý thuyết GPLX Hạng B2 — Bộ đề {examId}
            </p>
          </div>

          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-4 border-t border-border/50">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Thời gian làm</p>
              <p className="font-bold text-sm flex items-center justify-center gap-1">
                <Clock className="h-4 w-4 text-primary" /> {timeSpent}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Số câu đúng</p>
              <p className="font-bold text-sm text-emerald-600">33 / 35 câu</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Số câu sai</p>
              <p className="font-bold text-sm text-destructive">2 câu</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Câu điểm liệt</p>
              <p className="font-bold text-sm text-emerald-600">Đạt (2/2)</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Link href={`/practice/exam/${examId}`}>
              <Button variant="outline" className="gap-2 font-bold">
                <RotateCcw className="h-4 w-4" /> Thi lại bộ đề này
              </Button>
            </Link>
            <Link href="/practice/exams">
              <Button className="gap-2 font-bold">
                <BookOpen className="h-4 w-4" /> Làm đề tiếp theo
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Review Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" /> Chi tiết từng câu hỏi & Giải thích
        </h2>
        <span className="text-xs text-muted-foreground font-semibold">Hiển thị đáp án đúng / sai</span>
      </div>

      {/* Questions Review List */}
      <div className="space-y-6">
        {MOCK_REVIEW_QUESTIONS.map((q, idx) => {
          const isCorrectQuestion = q.options.some((o) => o.isCorrect && o.isUserChoice);
          return (
            <Card key={q.id} className="rounded-2xl shadow-sm border overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={isCorrectQuestion ? "default" : "destructive"} className="font-bold">
                      {isCorrectQuestion ? "✓ CÂU ĐÚNG" : "✕ CÂU SAI"}
                    </Badge>
                    <span className="font-bold text-sm">Câu {idx + 1}</span>
                  </div>
                  {q.isCritical && (
                    <Badge variant="destructive" className="gap-1 font-bold">
                      <AlertTriangle className="h-3.5 w-3.5" /> Điểm liệt
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-base text-foreground leading-relaxed">
                  {q.text}
                </h3>

                {/* Options List */}
                <div className="space-y-2 pt-2">
                  {q.options.map((opt) => {
                    let borderStyle = "border-border bg-card";
                    if (opt.isCorrect) {
                      borderStyle = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold";
                    } else if (opt.isUserChoice && !opt.isCorrect) {
                      borderStyle = "border-destructive bg-destructive/10 text-destructive line-through";
                    }
                    return (
                      <div key={opt.label} className={`p-3 rounded-xl border flex items-center justify-between text-sm ${borderStyle}`}>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-xs">{opt.label}.</span>
                          <span>{opt.text}</span>
                        </div>
                        {opt.isCorrect && <Badge className="bg-emerald-500 text-white text-[10px]">ĐÁP ÁN ĐÚNG</Badge>}
                        {opt.isUserChoice && !opt.isCorrect && <Badge variant="destructive" className="text-[10px]">BẠN CHỌN SAI</Badge>}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-bold text-amber-700 dark:text-amber-300">💡 Lời giải thích & Mẹo nhớ nhanh:</p>
                  <p className="leading-relaxed">{q.explanation}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
