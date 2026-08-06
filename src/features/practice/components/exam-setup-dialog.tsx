"use client";

import { useState } from "react";
import { useStartExamAndGo } from "@/features/practice/use-practice";
import {
  EXAM_DURATIONS,
  EXAM_TYPES,
  QUESTION_COUNTS,
  type ExamMode,
} from "@/features/practice/practice-service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExamSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ExamMode;
}

/** Dialog cấu hình đề trước khi bắt đầu: hạng bằng, số câu, thời gian. */
export function ExamSetupDialog({
  open,
  onOpenChange,
  mode,
}: ExamSetupDialogProps) {
  const startMutation = useStartExamAndGo();
  const [examType, setExamType] = useState("B2");
  const [totalQuestions, setTotalQuestions] = useState(25);
  const [duration, setDuration] = useState(20);

  const isExam = mode === "EXAM";

  function handleSubmit() {
    startMutation.mutate({
      examType,
      totalQuestions,
      durationMinutes: duration,
      mode,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isExam ? "Thi thử" : "Luyện tập"}</DialogTitle>
          <DialogDescription>
            {isExam
              ? "Chấm điểm cuối bài, kết quả tính đạt/không đạt theo quy chuẩn."
              : "Xem đáp án đúng/sai và giải thích ngay sau mỗi câu."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Hạng bằng</Label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXAM_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    Hạng {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Số câu hỏi</Label>
            <Select
              value={String(totalQuestions)}
              onValueChange={(v) => setTotalQuestions(Number(v))}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_COUNTS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} câu
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Thời gian</Label>
            <Select
              value={String(duration)}
              onValueChange={(v) => setDuration(Number(v))}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXAM_DURATIONS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} phút
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={startMutation.isPending}>
            {startMutation.isPending ? "Đang tạo..." : "Bắt đầu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
