"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useExamStore } from "@/stores/exam-store";
import { useFinishExam, useSubmitAnswer } from "@/features/practice/use-practice";
import { ExamTimer } from "./exam-timer";
import { QuestionCard } from "./question-card";
import { QuestionNav } from "./question-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiError } from "@/lib/api";

/**
 * Màn làm bài dùng chung cho cả Luyện tập (PRACTICE) và Thi thử (EXAM).
 * Trạng thái câu hỏi/đáp án/feedback lấy từ exam-store (persist → resume khi refresh).
 */
export function ExamRunner({ examId }: { examId: string }) {
  const mode = useExamStore((s) => s.mode);
  const examType = useExamStore((s) => s.examType);
  const questions = useExamStore((s) => s.questions);
  const answers = useExamStore((s) => s.answers);
  const feedback = useExamStore((s) => s.feedback);
  const currentIndex = useExamStore((s) => s.currentIndex);
  const expiresAt = useExamStore((s) => s.expiresAt);
  const setCurrentIndex = useExamStore((s) => s.setCurrentIndex);
  const setAnswer = useExamStore((s) => s.setAnswer);
  const setFeedback = useExamStore((s) => s.setFeedback);

  const submitMutation = useSubmitAnswer();
  const finishMutation = useFinishExam();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const submitPendingRef = useRef(false);
  const finishQueuedRef = useRef(false);
  const expiredRef = useRef(false);

  if (!questions.length) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-8">
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const isExam = mode === "EXAM";
  const q = questions[Math.min(currentIndex, questions.length - 1)];
  const qKey = q.id != null ? String(q.id) : "";
  const answeredCount = Object.keys(answers).length;
  const total = questions.length;
  const qFeedback = isExam ? null : (feedback[qKey] ?? null);
  const isLast = currentIndex === total - 1;

  function submitAnswerFor(label: string) {
    const qid = q.id;
    if (qid == null) return;
    if (!isExam && qFeedback) return; // PRACTICE: đã trả lời xong
    setAnswer(qid, label);
    submitPendingRef.current = true;
    submitMutation.mutate(
      {
        examId,
        payload: {
          questionId: String(qid),
          selectedAnswer: label as "A" | "B" | "C" | "D",
        },
      },
      {
        onSuccess: (res) => {
          if (!isExam) {
            setFeedback(qid, {
              isCorrect: res.isCorrect ?? false,
              correctAnswer: res.correctAnswer ?? "",
              explanation: res.explanation ?? "",
            });
          }
        },
        onError: (err) =>
          toast.error(
            err instanceof ApiError ? err.message : "Không lưu được đáp án"
          ),
        onSettled: () => {
          submitPendingRef.current = false;
          if (finishQueuedRef.current) {
            finishQueuedRef.current = false;
            doFinish();
          }
        },
      }
    );
  }

  function doFinish() {
    if (submitPendingRef.current) {
      finishQueuedRef.current = true;
      return;
    }
    finishMutation.mutate(examId);
  }

  function handleTimerExpire() {
    if (expiredRef.current) return;
    expiredRef.current = true;
    doFinish();
  }

  function goPrev() {
    setCurrentIndex(Math.max(currentIndex - 1, 0));
  }

  function goNext() {
    setCurrentIndex(Math.min(currentIndex + 1, total - 1));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isExam ? "default" : "secondary"}>
          {isExam ? "Thi thử" : "Luyện tập"}
        </Badge>
        <Badge variant="outline">Hạng {examType}</Badge>
        <span className="ml-auto text-sm text-muted-foreground">
          {answeredCount}/{total} câu
        </span>
        {isExam && expiresAt && (
          <ExamTimer expiresAt={expiresAt} onExpire={handleTimerExpire} />
        )}
        <Button
          size="sm"
          variant={isExam ? "default" : "outline"}
          onClick={() => (isExam ? setConfirmOpen(true) : doFinish())}
          disabled={finishMutation.isPending}
        >
          {finishMutation.isPending
            ? "Đang nộp..."
            : isExam
              ? "Nộp bài"
              : "Kết thúc"}
        </Button>
      </div>

      <Progress
        value={(answeredCount / Math.max(total, 1)) * 100}
        className="h-2"
      />

      <QuestionCard
        question={q}
        index={currentIndex}
        total={total}
        mode={isExam ? "EXAM" : "PRACTICE"}
        selectedAnswer={answers[qKey]}
        feedback={qFeedback}
        disabled={submitMutation.isPending}
        onSelect={submitAnswerFor}
      />

      {/* PRACTICE: sau khi trả lời hiện nút đi tiếp */}
      {!isExam && qFeedback && (
        <Button
          className="w-full"
          onClick={isLast ? doFinish : goNext}
          disabled={finishMutation.isPending}
        >
          {isLast ? "Xem kết quả" : "Câu tiếp theo"}
        </Button>
      )}

      {/* Điều hướng */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          Trước
        </Button>
        {isExam ? (
          <Button
            variant="outline"
            size="sm"
            onClick={isLast ? () => setConfirmOpen(true) : goNext}
          >
            {isLast ? "Nộp bài" : "Sau"}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={goNext}
            disabled={isLast}
          >
            Sau
          </Button>
        )}
      </div>

      {isExam && (
        <QuestionNav
          total={total}
          currentIndex={currentIndex}
          isAnswered={(i) => {
            const id = questions[i]?.id;
            return id != null && !!answers[String(id)];
          }}
          onJump={setCurrentIndex}
        />
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nộp bài?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đã trả lời {answeredCount}/{total} câu. Những câu chưa trả lời
              sẽ bị tính là sai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục làm bài</AlertDialogCancel>
            <AlertDialogAction onClick={doFinish}>Nộp bài</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
