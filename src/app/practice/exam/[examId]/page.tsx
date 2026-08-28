"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Pause,
  Play,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAuth } from "@/components/require-auth";
import { MediaImage } from "@/components/ui/media-image";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  useExamStore,
  useHasExamHydrated,
  type AnswerFeedback,
} from "@/stores/exam-store";
import {
  useExamSession,
  useFinishExam,
  useSubmitAnswer,
} from "@/features/practice/use-practice";
import type {
  Question,
  QuestionOption,
  SubmitAnswerRequest,
} from "@/features/practice/practice-service";
import { ApiError } from "@/lib/api";

const labels = ["A", "B", "C", "D"];

interface OptionView {
  label: string;
  text: string;
}

/** Options backend trả về có thể là mảng string hoặc mảng {label, text} — chuẩn hóa về 1 dạng. */
function normalizeOptions(q: Question): OptionView[] {
  const raw = Array.isArray(q.options) ? (q.options as unknown[]) : [];
  return raw.map((opt, i) => {
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

/**
 * Màn hình làm bài thi / luyện tập — dùng dữ liệu THẬT từ session:
 * - Ưu tiên session đang làm trong exam-store (started qua useStartExamAndGo, persist khi refresh).
 * - Nếu store không khớp → fallback lấy lại session qua API (resume / vào trực tiếp).
 * - Danh sách câu hỏi (preview) luôn hiển thị ĐỦ số câu của đề trong mọi trường hợp.
 * - EXAM: ghi đáp án lên server, không hiện đáp án đúng.
 * - PRACTICE: submit từng câu → hiện đúng/sai + giải thích ngay.
 * - Nộp bài → finishExam → sang trang kết quả.
 */
export default function StudentExamRunnerPage() {
  const router = useRouter();
  const { examId } = useParams<{ examId: string }>();

  const hydrated = useHasExamHydrated();
  const store = useExamStore();
  const storeMatches =
    hydrated && store.examId === examId && store.questions.length > 0;

  // Fallback khi store không khớp (vào trực tiếp / resume) — chỉ dùng sau khi store đã hydrate
  const sessionQuery = useExamSession(examId);
  const apiFallback = hydrated ? sessionQuery.data : null;

  const session = storeMatches ? store : apiFallback;
  const questions: Question[] = session?.questions ?? [];
  const sessionKey = session?.examId ?? null;
  const isPractice = session?.mode === "PRACTICE";
  const status = session?.status;
  const found = !!sessionKey && questions.length > 0;

  const submitAnswerMutation = useSubmitAnswer();
  const finishMutation = useFinishExam();

  // -------- Local state (được khởi tạo 1 lần khi session xác định) --------
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, AnswerFeedback>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const initKeyRef = useRef<string | null>(null);
  const submittedRef = useRef(false);

  const answeredCount = questions.filter(
    (q) => answers[String(q.id)] != null
  ).length;

  const handleSubmit = useCallback(
    (origin: "manual" | "timeout" = "manual") => {
      if (finishMutation.isPending) return;
      const unanswered = questions.length - answeredCount;
      if (origin === "manual" && unanswered > 0) {
        if (
          !window.confirm(
            `Bạn mới trả lời ${answeredCount}/${questions.length} câu. Bạn có chắc muốn nộp bài?`
          )
        ) {
          return;
        }
      }
      finishMutation.mutate(examId, {
        onError: () => {
          // Hết giờ nhưng server đã tự chấm (TIMEOUT) → finish fail, sang kết quả luôn.
          if (origin === "timeout") {
            router.push(`/practice/result/${examId}`);
          }
        },
      });
    },
    [finishMutation, questions.length, answeredCount, examId, router]
  );

  const handleSelectOption = (q: Question, label: string) => {
    const questionId = q.id;
    if (questionId == null) return;
    // PRACTICE: khóa câu ngay sau khi đã chọn (chờ feedback đúng/sai)
    if (isPractice && answers[String(questionId)] != null) return;
    if (finishMutation.isPending) return;

    const answerLabel = label as SubmitAnswerRequest["selectedAnswer"];
    const payload: SubmitAnswerRequest = {
      questionId: String(questionId),
      selectedAnswer: answerLabel,
    };

    setAnswers((prev) => ({ ...prev, [String(questionId)]: label }));
    if (storeMatches) store.setAnswer(questionId, label);

    if (isPractice) {
      submitAnswerMutation.mutate(
        { examId, payload },
        {
          onSuccess: (res) => {
            if (res.isCorrect != null) {
              const fb: AnswerFeedback = {
                isCorrect: !!res.isCorrect,
                correctAnswer: res.correctAnswer ?? "",
                explanation: res.explanation ?? "",
              };
              setFeedback((prev) => ({ ...prev, [String(questionId)]: fb }));
              if (storeMatches) store.setFeedback(questionId, fb);
            }
          },
          onError: (err) => {
            // revert đáp án để người dùng chọn lại
            setAnswers((prev) => {
              const next = { ...prev };
              delete next[String(questionId)];
              return next;
            });
            if (storeMatches) store.setAnswer(questionId, "");
            toast.error(
              err instanceof ApiError
                ? err.message
                : "Không lưu được đáp án. Thử lại."
            );
          },
        }
      );
    } else {
      submitAnswerMutation.mutate(
        { examId, payload },
        {
          onError: (err) => {
            setAnswers((prev) => {
              const next = { ...prev };
              delete next[String(questionId)];
              return next;
            });
            if (storeMatches) store.setAnswer(questionId, "");
            toast.error(
              err instanceof ApiError
                ? err.message
                : "Không lưu được đáp án. Thử lại."
            );
          },
        }
      );
    }
  };

  // -------- Effects --------
  // Khởi tạo answers/feedback/timer đúng 1 lần cho session hiện tại
  useEffect(() => {
    if (!found || initKeyRef.current === sessionKey) return;
    initKeyRef.current = sessionKey;
    submittedRef.current = false;
    setAnswers(storeMatches ? { ...store.answers } : {});
    setFeedback(storeMatches ? { ...store.feedback } : {});
    setCurrentIndex(storeMatches ? store.currentIndex : 0);
    const expires = session?.expiresAt
      ? new Date(session.expiresAt).getTime()
      : null;
    const duration = (session?.durationMinutes ?? 0) * 60;
    setTimeLeft(
      expires
        ? Math.max(0, Math.floor((expires - Date.now()) / 1000))
        : duration
    );
    setIsPaused(false);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey, found]);

  // Bài đã kết thúc (COMPLETED/TIMEOUT) → đưa sang trang kết quả
  useEffect(() => {
    if (found && (status === "COMPLETED" || status === "TIMEOUT")) {
      router.replace(`/practice/result/${examId}`);
    }
  }, [found, status, examId, router]);

  // Đếm ngược (setTimeout nối tiếp, tránh drift của setInterval)
  useEffect(() => {
    if (isPaused || !ready || !sessionKey || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, isPaused, ready, sessionKey]);

  // Hết giờ → tự nộp
  useEffect(() => {
    if (ready && sessionKey && timeLeft === 0 && !submittedRef.current) {
      submittedRef.current = true;
      handleSubmit("timeout");
    }
  }, [timeLeft, ready, sessionKey, handleSubmit]);

  // -------- Loading / Not found --------
  if (!hydrated) {
    return (
      <RequireAuth>
        <RunnerSkeleton />
      </RequireAuth>
    );
  }
  if (!found) {
    if (sessionQuery.isLoading) {
      return (
        <RequireAuth>
          <RunnerSkeleton />
        </RequireAuth>
      );
    }
    return (
      <RequireAuth>
        <div className="container mx-auto max-w-xl py-20 px-4 text-center space-y-4">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="text-xl font-bold">Không tìm thấy bài thi</h1>
          <p className="text-sm text-muted-foreground">
            Bài thi <span className="font-semibold">{examId}</span> không tồn tại
            hoặc đã kết thúc. Hãy bắt đầu một bài thi mới từ màn hình luyện thi.
          </p>
          <Button onClick={() => router.push("/practice")}>
            Về trang luyện thi
          </Button>
        </div>
      </RequireAuth>
    );
  }

  const q = questions[currentIndex];
  const qId = String(q.id);
  const selected = answers[qId];
  const fb = feedback[qId];
  const practiceLocked = isPractice && selected != null;
  const practiceAnswered = practiceLocked && fb != null;
  const opts = normalizeOptions(q);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  return (
    <RequireAuth>
      <div className="min-h-screen bg-muted/20 flex flex-col justify-between">
      {/* Top Fixed Header */}
      <header className="bg-card border-b px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/practice")}
            className="h-9 w-9 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-bold text-base text-foreground leading-tight truncate">
              Kỳ thi sát hạch lý thuyết GPLX Hạng {session?.examType || "B2"} — Bộ
              đề {examId}
            </h1>
            <p className="text-xs text-muted-foreground">
              Thời gian làm bài: {session?.durationMinutes ?? 0} phút ·{" "}
              {questions.length} câu hỏi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold px-3 py-1.5 rounded-lg border bg-background"
          >
            {isPaused ? (
              <Play className="h-4 w-4 text-emerald-500" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
            {isPaused ? "Tiếp tục" : "Tạm dừng"}
          </button>

          <div className="flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/30 px-4 py-1.5 rounded-full font-mono font-bold text-base">
            <Clock className="h-4 w-4 animate-pulse" />
            {formattedTime}
          </div>

          <Button
            onClick={() => handleSubmit("manual")}
            disabled={finishMutation.isPending}
            className="gap-2 font-bold bg-primary"
          >
            {finishMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {finishMutation.isPending ? "Đang nộp..." : "Nộp bài"}
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
                    CÂU HỎI {currentIndex + 1} / {questions.length}
                  </Badge>
                  {q.isCritical && (
                    <Badge variant="destructive" className="gap-1 font-bold">
                      <AlertTriangle className="h-3.5 w-3.5" /> CÂU ĐIỂM LIỆT
                    </Badge>
                  )}
                </div>

                <h2 className="text-lg font-bold text-foreground leading-relaxed">
                  {q.questionText}
                </h2>

                {q.imageUrl && (
                  <MediaImage
                    src={q.imageUrl}
                    alt=""
                    className="mt-2 max-h-52 rounded-lg border"
                  />
                )}
              </div>

              {/* Options List */}
              <div className="space-y-3 my-6">
                {opts.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Câu hỏi này chưa có đáp án.
                  </p>
                )}
                {opts.map((o) => {
                  const isSelected = selected === o.label;
                  let style =
                    "border-border bg-card hover:bg-muted/30 cursor-pointer";
                  let dotStyle =
                    "border-muted-foreground bg-background text-transparent";
                  let textStyle = "text-foreground";

                  if (practiceLocked && fb) {
                    style = "border-border opacity-60 cursor-default";
                    if (o.label === fb.correctAnswer) {
                      style =
                        "border-emerald-500/60 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium cursor-default";
                      dotStyle = "bg-emerald-500 text-white border-emerald-500";
                    } else if (isSelected && o.label !== fb.correctAnswer) {
                      style =
                        "border-destructive/60 bg-destructive/10 text-destructive dark:text-red-400 font-medium cursor-default";
                      dotStyle =
                        "bg-destructive text-white border-destructive";
                    }
                  } else if (isSelected) {
                    style = `border-primary bg-primary/5 shadow-sm ring-1 ring-primary ${
                      practiceLocked ? "cursor-default" : "cursor-pointer"
                    }`;
                    dotStyle = "border-primary bg-primary text-white";
                    textStyle = "font-semibold text-foreground";
                  }

                  return (
                    <div
                      key={o.label}
                      onClick={() => handleSelectOption(q, o.label)}
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${style}`}
                    >
                      <div
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${dotStyle}`}
                      >
                        {isSelected && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <span className="font-bold text-sm text-muted-foreground">
                        {o.label}.
                      </span>
                      <p
                        className={`text-sm flex-1 leading-relaxed ${textStyle}`}
                      >
                        {o.text}
                      </p>
                      {practiceAnswered &&
                        o.label === fb.correctAnswer && (
                          <Check className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />
                        )}
                      {practiceAnswered &&
                        isSelected &&
                        o.label !== fb.correctAnswer && (
                          <X className="ml-auto h-4 w-4 shrink-0 text-destructive" />
                        )}
                    </div>
                  );
                })}
              </div>

              {/* PRACTICE feedback: đáp án đúng + giải thích */}
              {practiceAnswered && (
                <div
                  className={`rounded-xl border p-4 text-sm ${
                    fb.isCorrect
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-destructive/40 bg-destructive/10"
                  }`}
                >
                  <p
                    className={`flex items-center gap-1.5 font-semibold ${
                      fb.isCorrect
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-destructive dark:text-red-400"
                    }`}
                  >
                    {fb.isCorrect ? (
                      <>
                        <Check className="h-4 w-4" /> Chính xác!
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" /> Sai.
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Đáp án đúng:{" "}
                    <span className="font-semibold text-foreground">
                      {fb.correctAnswer}
                    </span>
                    {selected !== fb.correctAnswer && (
                      <>
                        {" "}
                        · Bạn chọn:{" "}
                        <span className="font-semibold text-destructive">
                          {selected}
                        </span>
                      </>
                    )}
                  </p>
                  {fb.explanation && (
                    <div className="mt-3 rounded-xl bg-muted/50 p-3">
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Info className="h-3.5 w-3.5" />
                        Giải thích chi tiết
                      </p>
                      <p className="whitespace-pre-line leading-relaxed text-foreground/90">
                        {fb.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => i - 1)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Câu trước
                </Button>
                <span className="text-xs text-muted-foreground font-semibold">
                  Đã trả lời {answeredCount}/{questions.length} câu
                </span>
                <Button
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex((i) => i + 1)}
                  className="gap-2"
                >
                  Câu tiếp <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Question Navigator Grid Sidebar — hiển thị ĐỦ số câu */}
        <div className="lg:col-span-4">
          <Card className="rounded-2xl shadow-sm border">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground">
                  Danh sách câu hỏi
                </h3>
                <span className="text-xs font-semibold text-primary">
                  {answeredCount}/{questions.length} hoàn thành
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {questions.map((question, idx) => {
                  const isAnswered = answers[String(question.id)] != null;
                  const isCurrent = currentIndex === idx;
                  return (
                    <button
                      key={question.id ?? idx}
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
                      {question.isCritical && (
                        <span
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full"
                          title="Câu điểm liệt"
                        />
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
    </RequireAuth>
  );
}

function RunnerSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl py-6 px-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-4">
        <Skeleton className="h-14" />
        <Skeleton className="h-40" />
        <Skeleton className="h-24" />
        <Skeleton className="h-12" />
      </div>
      <div className="lg:col-span-4">
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
