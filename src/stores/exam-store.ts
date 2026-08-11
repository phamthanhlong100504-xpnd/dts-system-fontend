import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCallback, useSyncExternalStore } from "react";
import type {
  ExamMode,
  ExamSessionResponse,
  Question,
} from "@/features/practice/practice-service";

/** Feedback đúng/sai cho 1 câu ở PRACTICE mode */
export interface AnswerFeedback {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

interface ExamState {
  examId: string | null;
  mode: ExamMode | null;
  examType: string;
  totalQuestions: number;
  durationMinutes: number;
  expiresAt: string | null;
  startedAt: string | null;
  status: "IN_PROGRESS" | "COMPLETED" | "TIMEOUT" | null;
  questions: Question[];
  /** key = String(questionId), value = "A"|"B"|"C"|"D" */
  answers: Record<string, string>;
  /** PRACTICE mode: feedback theo câu */
  feedback: Record<string, AnswerFeedback>;
  currentIndex: number;

  startSession: (session: ExamSessionResponse) => void;
  setAnswer: (questionId: number, label: string) => void;
  setFeedback: (questionId: number, fb: AnswerFeedback) => void;
  setCurrentIndex: (index: number) => void;
  clear: () => void;
}

/**
 * Chỉ các trường DỮ LIỆU (KHÔNG chứa action).
 * `clear()` chỉ reset phần này — tránh ghi đè action bằng no-op
 * (bug cũ: `set({...initialState})` biến startSession/setAnswer/... thành no-op,
 * làm hỏng store cho tới khi reload trang).
 */
function createInitialData() {
  return {
    examId: null,
    mode: null,
    examType: "",
    totalQuestions: 0,
    durationMinutes: 0,
    expiresAt: null,
    startedAt: null,
    status: null,
    questions: [],
    answers: {},
    feedback: {},
    currentIndex: 0,
  };
}

const initialState: ExamState = {
  ...createInitialData(),
  startSession: () => {},
  setAnswer: () => {},
  setFeedback: () => {},
  setCurrentIndex: () => {},
  clear: () => {},
};

/**
 * Trạng thái bài thi/luyện tập đang làm — persist để refresh/resume không mất.
 * `skipHydration: true` + rehydrate thủ công trong Providers (giống auth-store),
 * tránh hydration mismatch SSR.
 */
export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      ...initialState,
      startSession: (session) =>
        set({
          examId: session.examId ?? null,
          mode: session.mode ?? null,
          examType: session.examType ?? "",
          totalQuestions: session.totalQuestions ?? 0,
          durationMinutes: session.durationMinutes ?? 0,
          expiresAt: session.expiresAt ?? null,
          startedAt: session.startedAt ?? null,
          status: (session.status as ExamState["status"]) ?? "IN_PROGRESS",
          questions: session.questions ?? [],
          answers: {},
          feedback: {},
          currentIndex: 0,
        }),
      setAnswer: (questionId, label) =>
        set((s) => ({
          answers: { ...s.answers, [String(questionId)]: label },
        })),
      setFeedback: (questionId, fb) =>
        set((s) => ({
          feedback: { ...s.feedback, [String(questionId)]: fb },
        })),
      setCurrentIndex: (index) => set({ currentIndex: index }),
      clear: () => set(createInitialData()),
    }),
    {
      name: "dts-exam",
      skipHydration: true,
      partialize: (s) => ({
        examId: s.examId,
        mode: s.mode,
        examType: s.examType,
        totalQuestions: s.totalQuestions,
        durationMinutes: s.durationMinutes,
        expiresAt: s.expiresAt,
        startedAt: s.startedAt,
        status: s.status,
        questions: s.questions,
        answers: s.answers,
        feedback: s.feedback,
        currentIndex: s.currentIndex,
      }),
    }
  )
);

/** true khi store đã hydrate xong từ localStorage (chỉ có trên client). */
export function useHasExamHydrated(): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => useExamStore.persist.onFinishHydration(onChange),
    []
  );
  return useSyncExternalStore(
    subscribe,
    () => useExamStore.persist.hasHydrated(),
    () => false
  );
}
