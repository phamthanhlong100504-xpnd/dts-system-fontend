"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useUpdateQuestion } from "@/features/admin/use-admin-content";
import { contentBuilderApi } from "@/lib/api";

interface OptionItem {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

const LABELS = ["A", "B", "C", "D", "E", "F"];

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.id as string;

  const updateMutation = useUpdateQuestion();

  const [loading, setLoading] = useState(true);
  const [questionTitle, setQuestionTitle] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [chapterId, setChapterId] = useState(1);
  const [questionType, setQuestionType] = useState("SINGLE_CHOICE");
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>("");

  const isPublished = currentStatus === "PUBLISHED";

  // Tải dữ liệu câu hỏi từ API
  useEffect(() => {
    if (!questionId) return;
    setLoading(true);
    contentBuilderApi
      .get<any>(`/v1/questions/${questionId}?includeOptions=true`)
      .then((q: any) => {
        setQuestionTitle(q.content || "");
        setExplanation(q.explanations?.text || "");
        setIsCritical(Boolean(q.metadata?.isCritical));
        setChapterId(q.metadata?.chapterId || 1);
        setQuestionType(q.type || "SINGLE_CHOICE");
        setCurrentStatus(q.status || "");
        const rawOptions: any[] = Array.isArray(q.options) ? q.options : [];
        setOptions(
          rawOptions.map((opt: any, idx: number) => ({
            id: opt.id || String(idx),
            label: LABELS[idx] || String(idx + 1),
            text: opt.content || "",
            isCorrect: Boolean(opt.isCorrect),
          }))
        );
      })
      .catch(() => {
        toast.error("Không thể tải câu hỏi. Kiểm tra kết nối hoặc đăng nhập lại.");
      })
      .finally(() => setLoading(false));
  }, [questionId]);

  const addOption = () => {
    if (options.length >= 6) { toast.error("Tối đa 6 đáp án"); return; }
    setOptions([...options, { id: Date.now().toString(), label: LABELS[options.length] || `${options.length + 1}`, text: "", isCorrect: false }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) { toast.error("Cần ít nhất 2 đáp án"); return; }
    setOptions(options.filter((o) => o.id !== id));
  };

  const setCorrect = (id: string) => {
    setOptions(options.map((o) => ({ ...o, isCorrect: o.id === id })));
  };

  const handleSave = (status: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    if (!questionTitle.trim()) { toast.error("Vui lòng nhập nội dung câu hỏi"); return; }
    if (options.length > 0 && !options.some((o) => o.isCorrect)) {
      toast.error("Vui lòng chọn ít nhất một đáp án đúng");
      return;
    }

    updateMutation.mutate(
      {
        id: questionId,
        content: questionTitle,
        type: questionType,
        status,
        isCritical,
        chapterId,
        explanation,
        options: options.map((o, idx) => ({ content: o.text, isCorrect: o.isCorrect, sortOrder: idx + 1 })),
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật câu hỏi thành công!");
          router.push("/admin/questions");
        },
        onError: () => {
          toast.error("Cập nhật thất bại. Vui lòng thử lại.");
        },
      }
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-9 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/questions">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa câu hỏi</h1>
          <p className="text-sm text-muted-foreground font-mono">{questionId}</p>
        </div>
      </div>

      {isPublished && (
        <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 rounded-md shadow-sm dark:bg-amber-950/40 dark:text-amber-300">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertTriangle className="h-5 w-5" />
            <span>Câu hỏi này đã xuất bản!</span>
          </div>
          <p className="text-sm ml-7">
            Để bảo toàn lịch sử dữ liệu, bạn không thể chỉnh sửa nội dung hay đáp án của câu hỏi này. Bạn chỉ có thể Lưu trữ (Archive) nó.
          </p>
        </div>
      )}

      {/* Question Content */}
      <Card>
        <CardHeader><CardTitle className="text-base">Nội dung câu hỏi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={questionTitle}
            onChange={(e) => setQuestionTitle(e.target.value)}
            placeholder="Nhập nội dung câu hỏi..."
            className="min-h-[100px] text-sm resize-none"
            disabled={isPublished}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Chương</label>
              <Input
                type="number"
                min={1}
                max={9}
                value={chapterId}
                onChange={(e) => setChapterId(Number(e.target.value))}
                className="h-9"
                disabled={isPublished}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Câu hỏi điểm liệt</label>
              <button
                type="button"
                onClick={() => !isPublished && setIsCritical(!isCritical)}
                className={`flex items-center gap-2 h-9 w-full px-3 rounded-md border text-sm transition-colors ${
                  isCritical
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-input bg-background text-muted-foreground"
                } ${isPublished ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isPublished}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {isCritical ? "Điểm liệt — Bật" : "Điểm liệt — Tắt"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Đáp án ({options.length})</CardTitle>
          {!isPublished && (
            <Button variant="outline" size="sm" onClick={addOption} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Thêm đáp án
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {options.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Chưa có đáp án. Nhấn "Thêm đáp án" để bắt đầu.</p>
          )}
          {options.map((opt) => (
            <div
              key={opt.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                opt.isCorrect ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" : "border-border"
              } ${isPublished ? "opacity-75 bg-muted/30" : ""}`}
            >
              <button
                type="button"
                onClick={() => !isPublished && setCorrect(opt.id)}
                className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  opt.isCorrect ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground hover:border-emerald-400"
                } ${isPublished ? "cursor-not-allowed" : ""}`}
                disabled={isPublished}
              >
                {opt.isCorrect && <CheckCircle className="h-3 w-3 text-white" />}
              </button>
              <span className="text-sm font-bold text-muted-foreground w-5 shrink-0 mt-0.5">{opt.label}.</span>
              <Input
                value={opt.text}
                onChange={(e) => setOptions(options.map((o) => o.id === opt.id ? { ...o, text: e.target.value } : o))}
                className="h-8 text-sm border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none disabled:opacity-100 disabled:cursor-not-allowed"
                placeholder="Nhập nội dung đáp án..."
                disabled={isPublished}
              />
              {!isPublished && (
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Explanation */}
      <Card>
        <CardHeader><CardTitle className="text-base">Giải thích đáp án</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Nhập giải thích cho đáp án đúng..."
            className="min-h-[80px] text-sm resize-none disabled:opacity-75 disabled:cursor-not-allowed"
            disabled={isPublished}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-4">
        <Link href="/admin/questions">
          <Button variant="outline" disabled={updateMutation.isPending}>Hủy</Button>
        </Link>
        {!isPublished ? (
          <>
            <Button
              variant="outline"
              onClick={() => handleSave("DRAFT")}
              disabled={updateMutation.isPending}
              className="gap-2"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Lưu nháp
            </Button>
            <Button
              onClick={() => handleSave("PUBLISHED")}
              disabled={updateMutation.isPending}
              className="gap-2"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Xuất bản
            </Button>
          </>
        ) : (
          <Button
            onClick={() => handleSave("ARCHIVED")}
            disabled={updateMutation.isPending}
            variant="destructive"
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            Lưu trữ (Archive)
          </Button>
        )}
      </div>
    </div>
  );
}
