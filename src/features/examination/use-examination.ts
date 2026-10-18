"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import {
  getAvailableExams, getExamPaper, getExamResult, getExamReview, getExamSession,
  saveAnswer, startExamSession, submitExam,
  type StartExamSessionRequest, type SubmitAnswerPayload,
} from "./examination-service";

export const examinationKeys = {
  availableExams: ["examination", "available-exams"] as const,
  session: (id: string) => ["examination", "session", id] as const,
  paper: (id: string) => ["examination", "paper", id] as const,
  result: (id: string) => ["examination", "result", id] as const,
  review: (id: string) => ["examination", "review", id] as const,
};

export function useAvailableExams() { return useQuery({queryKey: examinationKeys.availableExams, queryFn:getAvailableExams}); }
export function useStartExamSessionAndGo() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartExamSessionRequest) => startExamSession(payload),
    onSuccess: (session) => {
      const sessionId = session.sessionId || session.id;
      if (!sessionId) {toast.error("Backend không trả sessionId.");return;}
      void qc.invalidateQueries({queryKey:["examination","official-exams"]});
      router.push(`/examination/${session.examId}/run?sessionId=${encodeURIComponent(sessionId)}`);
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Không thể bắt đầu bài thi"),
  });
}
export function useExamSessionInfo(id: string) {
  return useQuery({queryKey: examinationKeys.session(id), queryFn:()=>getExamSession(id),enabled:!!id,retry:false,refetchOnWindowFocus:true,refetchInterval:15000});
}
export function useExamPaper(id: string) {
  return useQuery({queryKey: examinationKeys.paper(id),queryFn:()=>getExamPaper(id),enabled:!!id,retry:false,refetchOnWindowFocus:true});
}
export function useSaveAnswer() {
  return useMutation({mutationFn:({sessionId,payload}:{sessionId:string;payload:SubmitAnswerPayload})=>saveAnswer(sessionId,payload)});
}
export function useSubmitExam() {
  const router=useRouter();const qc=useQueryClient();
  return useMutation({
    mutationFn:submitExam,
    onSuccess:(_,sessionId)=>{void qc.invalidateQueries({queryKey:["examination","official-exams"]});void qc.invalidateQueries({queryKey:examinationKeys.session(sessionId)});toast.success("Đã nộp bài thi thành công!");router.push(`/examination/result/${encodeURIComponent(sessionId)}`);},
    onError:(error)=>toast.error(error instanceof ApiError?error.message:"Nộp bài thất bại"),
  });
}
export function useExamResultData(id:string) {return useQuery({queryKey:examinationKeys.result(id),queryFn:()=>getExamResult(id),enabled:!!id,retry:false,refetchOnWindowFocus:true});}
export function useExamReview(id:string) {return useQuery({queryKey:examinationKeys.review(id),queryFn:()=>getExamReview(id),enabled:!!id,retry:false});}
