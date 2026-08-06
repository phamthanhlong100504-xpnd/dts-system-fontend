"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Info, RotateCcw, X } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import {
  useExamResult,
  useFinishExam,
  useStartExamAndGo,
} from "@/features/practice/use-practice";
import type { ExamAnswerResult } from "@/features/practice/practice-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const labels = ["A", "B", "C", "D"];
type Filter = "all" | "correct" | "wrong";

export default function ResultPage() {
  const { examId } = useParams<{ examId: string }>();
  const resultQuery = useExamResult(examId);
  const finishMutation = useFinishExam();
  const startAndGo = useStartExamAndGo();
  const [filter, setFilter] = useState<Filter>("all");

  if (resultQuery.isLoading) {
    return (
      <RequireAuth>
        <div className="mx-auto max-w-2xl space-y-4 py-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      </RequireAuth>
    );
  }

  const result = resultQuery.data;

  if (resultQuery.isError || !result) {
    return (
      <RequireAuth>
        <div className="mx-auto max-w-2xl space-y-4 py-8 text-center">
          <p className="text-sm text-destructive">Không tải được kết quả.</p>
          <p className="text-sm text-muted-foreground">
            Bài thi có thể chưa được nộp.
          </p>
          <Button
            onClick={() =>
              finishMutation.mutate(examId, {
                onSuccess: () => resultQuery.refetch(),
              })
            }
            disabled={finishMutation.isPending}
          >
            {finishMutation.isPending ? "Đang nộp..." : "Nộp bài ngay"}
          </Button>
        </div>
      </RequireAuth>
    );
  }

  const isExam = result.mode === "EXAM";
  const answers = result.answers ?? [];
  const filtered =
    filter === "correct"
      ? answers.filter((a) => a.isCorrect)
      : filter === "wrong"
        ? answers.filter((a) => !a.isCorrect)
        : answers;

  return (
    <RequireAuth>
      <div className="mx-auto max-w-2xl space-y-5 py-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Kết quả bài thi</h1>
          <p className="text-sm text-muted-foreground">
            Hạng {result.examType} · {isExam ? "Thi thử" : "Luyện tập"} ·{" "}
            {result.durationMinutes} phút
          </p>
        </div>

        {/* Điểm tổng */}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="text-5xl font-bold tracking-tight">
              {result.score ?? 0}
              <span className="text-xl font-semibold text-muted-foreground">
                /100
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {isExam && (
                <Badge
                  variant={result.passed ? "default" : "destructive"}
                  className={cn(
                    !result.passed &&
                      "bg-destructive/10 text-destructive hover:bg-destructive/10"
                  )}
                >
                  {result.passed ? "Đạt" : "Không đạt"}
                </Badge>
              )}
              <Badge variant="outline">
                Đúng {result.correctCount ?? 0}/{result.totalQuestions ?? 0}
              </Badge>
              <Badge variant="outline">
                Sai {result.wrongCount ?? 0}
              </Badge>
            </div>
            {isExam && !result.passed && (
              <p className="text-sm text-muted-foreground">
                Quy định: đạt ≥ 21/25 câu và không sai câu điểm liệt.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Filter */}
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as Filter)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Tất cả ({answers.length})</TabsTrigger>
            <TabsTrigger value="correct">
              Đúng ({answers.filter((a) => a.isCorrect).length})
            </TabsTrigger>
            <TabsTrigger value="wrong">
              Sai ({answers.filter((a) => !a.isCorrect).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Chi tiết từng câu */}
        <div className="space-y-4">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Không có câu nào trong mục này.
            </p>
          )}
          {filtered.map((a, i) => (
            <AnswerRow key={a.questionId ?? i} answer={a} />
          ))}
        </div>

        {/* Hành động */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button
            onClick={() =>
              startAndGo.mutate({
                examType: result.examType ?? "B2",
                totalQuestions: result.totalQuestions,
                durationMinutes: result.durationMinutes,
                mode: result.mode ?? "EXAM",
              })
            }
            disabled={startAndGo.isPending}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {startAndGo.isPending ? "Đang tạo..." : "Làm lại"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/practice">Về trang luyện tập</Link>
          </Button>
        </div>
      </div>
    </RequireAuth>
  );
}

function AnswerRow({ answer }: { answer: ExamAnswerResult }) {
  const answered = (answer.selectedAnswer ?? "") !== "";
  const correct = answer.isCorrect;
  const hasExplanation = !!answer.explanation?.trim();
  const options = answer.options ?? [];

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <p className="flex-1 text-sm font-medium leading-relaxed">
            {answer.questionText}
          </p>
          <Badge
            variant={correct ? "default" : "destructive"}
            className={cn(
              "shrink-0",
              correct &&
                "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10",
              !correct &&
                "bg-destructive/10 text-destructive hover:bg-destructive/10"
            )}
          >
            {correct ? (
              <>
                <Check className="mr-1 h-3 w-3" /> Đúng
              </>
            ) : (
              <>
                <X className="mr-1 h-3 w-3" /> Sai
              </>
            )}
          </Badge>
        </div>

        {answer.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={answer.imageUrl}
            alt=""
            className="mt-1 max-h-52 rounded-lg border"
          />
        )}

        {!answered && (
          <p className="text-xs font-medium text-amber-600">
            Chưa trả lời — tính là sai
          </p>
        )}

        <div className="space-y-1.5">
          {options.map((opt, i) => {
            const label = opt.label ?? labels[i] ?? String.fromCharCode(65 + i);
            const isCorrectOpt = answer.correctAnswer === label;
            const isWrongSel =
              answered && answer.selectedAnswer === label && !isCorrectOpt;
            return (
              <div
                key={label ?? i}
                className={cn(
                  "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                  isCorrectOpt && "border-emerald-500/60 bg-emerald-50 text-emerald-900",
                  isWrongSel && "border-destructive/60 bg-destructive/5 text-destructive",
                  !isCorrectOpt && !isWrongSel && "border-border"
                )}
              >
                <span className="font-semibold text-muted-foreground">
                  {label}
                </span>
                <span className="leading-relaxed">{opt.text}</span>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground">
          Đáp án đúng:{" "}
          <span className="font-semibold text-foreground">
            {answer.correctAnswer}
          </span>
          {answered && answer.selectedAnswer !== answer.correctAnswer && (
            <>
              {" "}· Bạn chọn:{" "}
              <span className="font-semibold text-destructive">
                {answer.selectedAnswer}
              </span>
            </>
          )}
        </p>

        {hasExplanation && (
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              Giải thích chi tiết
            </p>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {answer.explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
