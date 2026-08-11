"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ArrowLeft,
  BookOpen,
  AlertTriangle,
  HelpCircle,
  MinusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAuth } from "@/components/require-auth";
import {
  useExamResult,
  useStartExamAndGo,
} from "@/features/practice/use-practice";
import {
  type ExamAnswerResult,
  type QuestionOption,
} from "@/features/practice/practice-service";
import { logStudySession } from "@/features/progress/progress-service";

const labels = ["A", "B", "C", "D"];

interface OptionView {
  label: string;
  text: string;
}

/** Options backend có thể là mảng string hoặc mảng {label, text} — chuẩn hóa về 1 dạng. */
function normalizeOptions(raw: ExamAnswerResult["options"]): OptionView[] {
  const list = Array.isArray(raw) ? (raw as unknown[]) : [];
  return list.map((opt, i) => {
    if (typeof opt === "string") {
      return { label: labels[i] ?? String.fromCharCode(65 + i), text: opt };
    }
    const o = opt as QuestionOption;
    return {
      label: o.label ?? labels[i] ?? String.fromCharCode(65 + i),
      text: o.text ?? "",
    };
  });
}

export default function StudentExamResultPage() {
  const { examId } = useParams<{ examId: string }>();
  const resultQuery = useExamResult(examId);
  const startAndGo = useStartExamAndGo();

  const result = resultQuery.data;

  useEffect(() => {
    if (!result || !result.examId) return;
    const key = `dts_logged_${result.examId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "true");

    const startedAt = result.startedAt ? new Date(result.startedAt).getTime() : Date.now();
    const completedAt = result.completedAt ? new Date(result.completedAt).getTime() : Date.now();
    const durationSeconds = Math.max(1, Math.round((completedAt - startedAt) / 1000));

    logStudySession({
      sessionType: result.mode === "PRACTICE" ? "PRACTICE" : "EXAM",
      examType: result.examType ?? "B2",
      mode: result.mode ?? "EXAM",
      examId: result.examId,
      questionsCount: result.totalQuestions ?? 25,
      correctCount: result.correctCount ?? 0,
      wrongCount: result.wrongCount ?? 0,
      durationSeconds,
    }).catch((err) => console.error("Progress log error:", err));
  }, [result]);

  if (resultQuery.isLoading) {
    return (
      <RequireAuth>
        <div className="container mx-auto max-w-4xl py-8 px-4 space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </RequireAuth>
    );
  }

  const isPassed = result?.passed ?? true;
  const score = result?.correctCount ?? 33;
  const total = result?.totalQuestions ?? 35;
  const timeSpent = result?.durationMinutes ? `${result.durationMinutes} phút` : "14 phút 20 giây";
  const answers: ExamAnswerResult[] = result?.answers ?? [];

  return (
    <RequireAuth>
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
                Kỳ thi sát hạch lý thuyết GPLX Hạng {result?.examType ?? "B2"} — Bộ đề {examId}
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
                <p className="font-bold text-sm text-emerald-600">{score} / {total} câu</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Số câu sai</p>
                <p className="font-bold text-sm text-destructive">{result?.wrongCount ?? (total - score)} câu</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Câu điểm liệt</p>
                <p className="font-bold text-sm text-emerald-600">Đạt</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Button
                variant="outline"
                className="gap-2 font-bold"
                onClick={() =>
                  startAndGo.mutate({
                    examType: result?.examType ?? "B2",
                    totalQuestions: total,
                    durationMinutes: result?.durationMinutes ?? 22,
                    mode: result?.mode ?? "EXAM",
                  })
                }
                disabled={startAndGo.isPending}
              >
                <RotateCcw className="h-4 w-4" /> {startAndGo.isPending ? "Đang khởi tạo..." : "Thi lại bộ đề này"}
              </Button>
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
          <span className="text-xs text-muted-foreground font-semibold">
            {answers.length} câu · Hiển thị đáp án đúng / sai
          </span>
        </div>

        {/* Questions Review List */}
        <div className="space-y-6">
          {answers.length === 0 ? (
            <Card className="rounded-2xl shadow-sm border">
              <CardContent className="p-8 text-center text-sm text-muted-foreground space-y-2">
                <MinusCircle className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p>Không có dữ liệu chi tiết cho kỳ thi này.</p>
              </CardContent>
            </Card>
          ) : (
            answers.map((qa, idx) => {
              const opts = normalizeOptions(qa.options);
              const correct = qa.correctAnswer ?? "";
              const selected = qa.selectedAnswer ?? "";
              const isSkipped = !selected;
              const isCorrectQuestion = qa.isCorrect === true;
              return (
                <Card key={qa.questionId ?? idx} className="rounded-2xl shadow-sm border overflow-hidden">
                  <CardHeader className="pb-3 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isSkipped ? (
                          <Badge variant="outline" className="font-bold">— CHƯA TRẢ LỜI</Badge>
                        ) : (
                          <Badge variant={isCorrectQuestion ? "default" : "destructive"} className="font-bold">
                            {isCorrectQuestion ? "✓ CÂU ĐÚNG" : "✕ CÂU SAI"}
                          </Badge>
                        )}
                        <span className="font-bold text-sm">Câu {idx + 1}</span>
                      </div>
                      {qa.imageUrl && (
                        <Badge variant="secondary" className="font-bold">
                          <AlertTriangle className="h-3.5 w-3.5" /> Có hình
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-bold text-base text-foreground leading-relaxed">
                      {qa.questionText}
                    </h3>

                    {qa.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qa.imageUrl}
                        alt=""
                        className="max-h-52 rounded-lg border"
                      />
                    )}

                    {/* Options List */}
                    <div className="space-y-2 pt-2">
                      {opts.length === 0 && (
                        <p className="text-sm text-muted-foreground">Câu hỏi này chưa có đáp án.</p>
                      )}
                      {opts.map((opt) => {
                        const isCorrectOption = opt.label === correct;
                        const isUserChoice = opt.label === selected;
                        let borderStyle = "border-border bg-card";
                        if (isCorrectOption) {
                          borderStyle = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold";
                        } else if (isUserChoice && !isCorrectOption) {
                          borderStyle = "border-destructive bg-destructive/10 text-destructive line-through";
                        }
                        return (
                          <div key={opt.label} className={`p-3 rounded-xl border flex items-center justify-between text-sm ${borderStyle}`}>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-xs">{opt.label}.</span>
                              <span>{opt.text}</span>
                            </div>
                            {isCorrectOption && <Badge className="bg-emerald-500 text-white text-[10px]">ĐÁP ÁN ĐÚNG</Badge>}
                            {isUserChoice && !isCorrectOption && <Badge variant="destructive" className="text-[10px]">BẠN CHỌN SAI</Badge>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Card */}
                    {qa.explanation ? (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <p className="font-bold text-amber-700 dark:text-amber-300">💡 Lời giải thích & Mẹo nhớ nhanh:</p>
                        <p className="leading-relaxed">{qa.explanation}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Câu hỏi này chưa có lời giải thích.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
