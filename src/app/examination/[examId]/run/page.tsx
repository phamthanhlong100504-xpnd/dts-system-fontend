"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Expand, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/require-auth";
import { SessionConfirmationModal, type SessionConfirmationVariant } from "@/components/session-confirmation-modal";
import { OfficialExamSessionContent } from "@/features/examination/components/official-exam-session/official-exam-session-content";
import {
  markExamQuestion, navigateExamQuestion, reportExamViolation, getExamPaper, getExamSession,
  type ExamQuestion, type SelectedAnswer, type VersionedResult,
} from "@/features/examination/examination-service";
import { examinationKeys, useExamPaper, useExamSessionInfo, useSubmitExam } from "@/features/examination/use-examination";
import { useOfficialExamDetail } from "@/features/examination/use-official-exam-detail";
import { useLicenseStore } from "@/stores/license-store";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

export default function ExamRunPage() {return <RequireAuth><ExamRunContent /></RequireAuth>;}

function selectionFromAnswer(answer?: SelectedAnswer | null): string[] {
  if (answer?.value == null || answer.value === "") return [];
  return answer.value.split(",").map((id) => id.trim()).filter(Boolean);
}
function readAnswers(questions: ExamQuestion[]) {
  const result: Record<string,string[]> = {};
  for (const q of questions) result[q.questionId] = selectionFromAnswer(q.selectedAnswer);
  return result;
}
function readMarked(questions: ExamQuestion[]) {
  return new Set(questions.filter((q) => q.display?.marked).map((q) => q.questionId));
}
function isMultiple(q: ExamQuestion) {return q.type === "MULTIPLE_CHOICE" || q.type === "MULTIPLE";}
function errorCode(error: unknown): string | undefined {
  if (error instanceof ApiError) return error.errorCode;
  return undefined;
}

function ExamRunContent() {
  const router = useRouter();
  const params = useParams<{examId:string}>();
  const search = useSearchParams();
  const qc = useQueryClient();
  const sessionId = search.get("sessionId") ?? "";
  const selectedLicense = useLicenseStore((s) => s.selectedLicense);
  const sessionQuery = useExamSessionInfo(sessionId);
  const paperQuery = useExamPaper(sessionId);
  const detailQuery = useOfficialExamDetail(params.examId, selectedLicense ?? "");
  const submit = useSubmitExam();
  const [currentIndex,setCurrentIndex] = useState(0);
  const [answers,setAnswers] = useState<Record<string,string[]>>({});
  const [flaggedQuestionIds,setFlaggedQuestionIds] = useState<Set<string>>(new Set());
  const [timerReading,setTimerReading] = useState<{key:string;remaining:number}|null>(null);
  const [confirmVariant,setConfirmVariant] = useState<SessionConfirmationVariant|null>(null);
  const [isPendingSave,setIsPendingSave] = useState(false);
  const [saveError,setSaveError] = useState<string|null>(null);
  const [fullscreenWarning,setFullscreenWarning] = useState(false);
  const [isReportingViolation,setIsReportingViolation] = useState(false);
  const hydratedRef = useRef<string|null>(null);
  const versionRef = useRef<number|null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const answerRef = useRef<Record<string,string[]>>({});
  const pendingCountRef = useRef(0);
  const saveErrorRef = useRef(false);
  const timeAnchorRef = useRef<{remaining:number;timestamp:number}|null>(null);
  const wasFullscreenRef = useRef(false);
  const submittedRef = useRef(false);
  const session = sessionQuery.data;
  const paper = paperQuery.data;
  const questions = useMemo(()=> paper?.questions ?? [],[paper?.questions]);
  const isActive = session?.status === "IN_PROGRESS";
  const refetchSession = sessionQuery.refetch;
  const refetchPaper = paperQuery.refetch;
  // Giá trị timerState chỉ hợp lệ với đúng snapshot thời gian server hiện tại.
  const timerKey = `${sessionId}:${session?.serverNow ?? ""}:${session?.version ?? ""}:${session?.remainingSeconds ?? ""}`;
  const timeLeft = timerReading?.key === timerKey
    ? timerReading.remaining
    : (session?.remainingSeconds ?? paper?.remainingSeconds ?? null);

  const refreshState = useCallback(async () => {
    if (!sessionId) return;
    try {
      const latestSession = await getExamSession(sessionId);
      versionRef.current = latestSession.version;
      qc.setQueryData(examinationKeys.session(sessionId), latestSession);
      if (latestSession.status === "IN_PROGRESS") {
        const latestPaper = await getExamPaper(sessionId);
        qc.setQueryData(examinationKeys.paper(sessionId), latestPaper);
        answerRef.current = readAnswers(latestPaper.questions);
        setAnswers({...answerRef.current});
        setFlaggedQuestionIds(readMarked(latestPaper.questions));
        setCurrentIndex(Math.max(0,(latestPaper.currentPosition || latestSession.currentPosition || 1)-1));
      }
    } catch (error) {toast.error(error instanceof Error ? error.message : "Không thể đồng bộ phiên thi.");}
  },[qc,sessionId]);

  useEffect(()=>{
    if (!session || !paper || hydratedRef.current === sessionId) return;
    hydratedRef.current = sessionId;
    versionRef.current = Math.max(session.version ?? 0,paper.version ?? 0);
    answerRef.current = readAnswers(paper.questions);
    setAnswers({...answerRef.current});
    setFlaggedQuestionIds(readMarked(paper.questions));
    setCurrentIndex(Math.max(0,(paper.currentPosition || session.currentPosition || 1)-1));
  },[paper,session,sessionId]);

  useEffect(()=>{
    if (!isActive) return;
    const remaining=Math.max(0,session?.remainingSeconds ?? paper?.remainingSeconds ?? 0);
    timeAnchorRef.current={remaining,timestamp:Date.now()};
  },[session?.serverNow,session?.remainingSeconds,session?.status,session?.version,paper?.remainingSeconds,isActive]);

  useEffect(()=>{
    if (!isActive || !timeAnchorRef.current) return;
    const timer=window.setInterval(()=>{
      const clock=timeAnchorRef.current;
      if (!clock) return;
      const seconds=Math.max(0,clock.remaining-Math.floor((Date.now()-clock.timestamp)/1000));
      setTimerReading({key:timerKey,remaining:seconds});
      if (seconds === 0) {void refetchSession();}
    },1000);
    return ()=>window.clearInterval(timer);
  },[isActive,timerKey,refetchSession]);

  useEffect(()=>{
    const onFocus=()=>{void refetchSession();if(isActive)void refetchPaper();};
    window.addEventListener("focus",onFocus);
    return ()=>window.removeEventListener("focus",onFocus);
  },[refetchSession,refetchPaper,isActive]);

  function enqueue(task:(version:number)=>Promise<VersionedResult>) {
    pendingCountRef.current++;
    setIsPendingSave(true);
    const next=saveQueueRef.current.catch(()=>undefined).then(async()=>{
      if (versionRef.current == null) throw new Error("Chưa có phiên bản session.");
      const response=await task(versionRef.current);
      if (typeof response.version !== "number") {
        const fresh=await getExamSession(sessionId);
        versionRef.current=fresh.version;
        qc.setQueryData(examinationKeys.session(sessionId),fresh);
      } else versionRef.current=response.version;
    }).catch(async(error:unknown)=>{
      saveErrorRef.current=true;
      const conflict=errorCode(error)==="VERSION_CONFLICT" || (error instanceof ApiError && error.status===409);
      setSaveError(conflict?"Phiên thi đã thay đổi ở nơi khác. Đã đồng bộ; hãy kiểm tra và chọn lại đáp án nếu cần.":(error instanceof Error?error.message:"Không lưu được thao tác."));
      await refreshState();
    }).finally(()=>{
      pendingCountRef.current=Math.max(0,pendingCountRef.current-1);
      setIsPendingSave(pendingCountRef.current>0);
    });
    saveQueueRef.current=next;
    return next;
  }

  function handleSelectAnswer(questionId:string,optionId:string) {
    if(!isActive || isPendingSave && saveErrorRef.current || timeLeft===0 || submit.isPending) return;
    const question=questions.find(q=>q.questionId===questionId);
    if(!question) return;
    const existing=answerRef.current[questionId] ?? [];
    const multiple=isMultiple(question);
    const next=multiple?(existing.includes(optionId)?existing.filter(x=>x!==optionId):[...existing,optionId]):[optionId];
    answerRef.current={...answerRef.current,[questionId]:next};
    setAnswers({...answerRef.current});
    void enqueue(async(version)=>{
      const type:SelectedAnswer["type"]=question.type==="TRUE_FALSE"?"true_false":multiple?"multiple_choice":"single_choice";
      const {saveAnswer}=await import("@/features/examination/examination-service");
      return saveAnswer(sessionId,{version,answers:[{questionId,selectedAnswer:{type,value:next.length?next.join(","):null}}]});
    });
  }
  function handleGoToQuestion(index:number) {
    if (!isActive || index<0 || index>=questions.length || timeLeft===0) return;
    setCurrentIndex(index);
    void enqueue(version=>navigateExamQuestion(sessionId,index+1,version));
  }
  function handleToggleFlag(questionId:string) {
    if(!isActive || timeLeft===0) return;
    const marked=!flaggedQuestionIds.has(questionId);
    setFlaggedQuestionIds(old=>{const next=new Set(old);if(marked)next.add(questionId);else next.delete(questionId);return next;});
    void enqueue(version=>markExamQuestion(sessionId,questionId,version,marked));
  }
  async function doSubmit() {
    if(!sessionId || submit.isPending || submittedRef.current) return;
    setConfirmVariant(null);
    await saveQueueRef.current;
    if (saveErrorRef.current) {toast.error("Có thao tác chưa lưu thành công; vui lòng kiểm tra lại trước khi nộp.");return;}
    submittedRef.current=true;
    try {await submit.mutateAsync(sessionId);} catch {submittedRef.current=false;}
  }
  const reportViolation = useCallback((eventType:"TAB_SWITCH"|"FULLSCREEN_EXIT") => {
    if (!sessionId || !isActive || isReportingViolation) return;
    const eventId=crypto.randomUUID();
    setIsReportingViolation(true);
    void reportExamViolation(sessionId,eventId,eventType).then(async(result)=>{
      if(result.status && result.status!=="IN_PROGRESS") {await refreshState();router.replace(`/examination/result/${sessionId}`);}
      else {await refetchSession();}
    }).catch((error)=>{toast.error(error instanceof Error?error.message:"Không ghi nhận được sự kiện giám sát.");}).finally(()=>setIsReportingViolation(false));
  },[sessionId,isActive,isReportingViolation,refreshState,router,refetchSession]);
  useEffect(()=>{
    if(!isActive || !session?.examRule?.preventTabSwitch) return;
    const onVisibility=()=>{if(document.hidden)reportViolation("TAB_SWITCH");};
    document.addEventListener("visibilitychange",onVisibility);
    return ()=>document.removeEventListener("visibilitychange",onVisibility);
  },[isActive,session?.examRule?.preventTabSwitch,reportViolation]);
  useEffect(()=>{
    if(!isActive || !session?.examRule?.requireFullscreen) return;
    const onFullscreen=()=>{
      const active=Boolean(document.fullscreenElement);
      if(wasFullscreenRef.current && !active) reportViolation("FULLSCREEN_EXIT");
      wasFullscreenRef.current=active;
      setFullscreenWarning(!active);
    };
    document.addEventListener("fullscreenchange",onFullscreen);
    onFullscreen();
    return ()=>document.removeEventListener("fullscreenchange",onFullscreen);
  },[isActive,session?.examRule?.requireFullscreen,reportViolation]);

  if(!sessionId || sessionId.startsWith("preview-")) return <ErrorPanel text="Không tìm thấy phiên thi hợp lệ. Vui lòng mở kỳ thi từ danh sách." onBack={()=>router.push("/examination")}/>;
  if(sessionQuery.isLoading || paperQuery.isLoading) return <div className="flex min-h-screen items-center justify-center gap-3 bg-[#f7f6fb]"><Loader2 className="size-6 animate-spin"/>Đang tải đề và phiên thi...</div>;
  if(sessionQuery.isError || !session) return <ErrorPanel text={sessionQuery.error instanceof Error?sessionQuery.error.message:"Không tải được phiên thi."} onBack={()=>router.push("/examination")}/>;
  if(session.status === "READY") return <div className="mx-auto max-w-xl p-10 text-center"><h1 className="mb-4 text-2xl font-bold">Phiên thi đã tạm dừng</h1><button type="button" className="rounded-lg bg-[#0758d9] px-5 py-3 text-white" onClick={async()=>{const {resumeExamSession}=await import("@/features/examination/examination-service");await resumeExamSession(sessionId);await refreshState();}}>Tiếp tục thi</button></div>;
  
  if (session.status !== "IN_PROGRESS")
    return (
      <div className="mx-auto max-w-xl space-y-4 p-10 text-center">
        <h1 className="text-2xl font-bold">
          {session.status === "SUBMITTED"
            ? "Bài thi đã được nộp"
            : session.status === "EXPIRED"
              ? "Thời gian làm bài đã kết thúc"
              : "Bài thi đã kết thúc"}
        </h1>

        <p className="text-sm text-[#667085]">
          {session.status === "SUBMITTED"
            ? "Bài thi của bạn đã được ghi nhận. Kết quả sẽ hiển thị khi được công bố."
            : session.status === "EXPIRED"
              ? "Thời gian làm bài đã hết. Bạn có thể kiểm tra kết quả khi được công bố."
              : "Bạn có thể kiểm tra thông tin và kết quả bài thi tại đây."}
        </p>

        <button
          className="rounded-lg bg-[#0758d9] px-5 py-3 text-white"
          onClick={() => router.push(`/examination/result/${sessionId}`)}
        >
          Xem kết quả
        </button>
      </div>
    );

  if(paperQuery.isError || !paper || !questions.length) return <ErrorPanel text="Không thể tải nội dung đề thi lúc này. Vui lòng thử lại hoặc quay lại danh sách kỳ thi." onBack={()=>router.push("/examination")}/>;

  const displayedTime=timeLeft ?? session.remainingSeconds ?? paper.remainingSeconds;
  const answeredCount=questions.filter(q=>(answers[q.questionId]?.length??0)>0).length;
  const title=detailQuery.data?.title ?? "Kỳ thi chính thức";
  return <>
    <OfficialExamSessionContent examTitle={title} questions={questions.map(q=>({...q,categoryName:q.display?.sectionTitle}))} currentIndex={Math.min(currentIndex,questions.length-1)} answers={answers} timeLeft={displayedTime} flaggedQuestionIds={flaggedQuestionIds} isSubmitting={submit.isPending || isPendingSave || displayedTime<=0} onExit={()=>setConfirmVariant("EXIT")} onSubmit={()=>{if(displayedTime>0)setConfirmVariant("SUBMIT");}} onSelectAnswer={handleSelectAnswer} onGoToQuestion={handleGoToQuestion} onToggleFlag={handleToggleFlag}/>
    {isPendingSave && <div role="status" className="fixed bottom-4 right-4 z-40 rounded-lg bg-white px-4 py-2 text-sm shadow">Đang lưu thao tác...</div>}
    {saveError && <div role="alert" className="fixed bottom-4 left-4 z-40 max-w-xl rounded-lg border border-rose-300 bg-white p-4 text-sm text-rose-700 shadow"><AlertTriangle className="mr-2 inline size-4"/>{saveError}<button className="ml-3 underline" onClick={()=>{setSaveError(null);saveErrorRef.current=false;void refreshState();}}>Đồng bộ lại</button></div>}
    <SessionConfirmationModal open={confirmVariant!==null} variant={confirmVariant??"SUBMIT"} answeredCount={answeredCount} totalQuestions={questions.length} isPending={submit.isPending || isPendingSave} onClose={()=>setConfirmVariant(null)} onConfirm={()=>{if(confirmVariant==="EXIT"){setConfirmVariant(null);router.push(`/examination/${params.examId}`);}else void doSubmit();}} />
    {session.examRule?.requireFullscreen && fullscreenWarning && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6"><div className="max-w-md rounded-2xl bg-white p-7 text-center"><Expand className="mx-auto mb-4 size-8 text-[#0758d9]"/><h2 className="text-xl font-bold">Yêu cầu toàn màn hình</h2><p className="mt-2 text-sm text-[#667085]">Quy chế thi yêu cầu chế độ toàn màn hình. Rời chế độ này có thể được ghi nhận là vi phạm.</p><button className="mt-5 rounded-lg bg-[#0758d9] px-5 py-3 text-white" onClick={()=>void document.documentElement.requestFullscreen().catch(()=>toast.error("Trình duyệt không cho phép toàn màn hình."))}>Bật toàn màn hình</button></div></div>}
  </>;
}

function ErrorPanel({text,onBack}:{text:string;onBack:()=>void}) {return <div className="flex min-h-screen items-center justify-center bg-[#f7f6fb] p-6"><div className="max-w-lg rounded-2xl border bg-white p-8 text-center"><AlertTriangle className="mx-auto size-8 text-rose-600"/><h1 className="mt-4 text-xl font-bold">Không thể mở phiên thi</h1><p className="mt-3 text-sm text-[#667085]">{text}</p><button className="mt-5 rounded-lg bg-[#0758d9] px-5 py-3 text-white" onClick={onBack}>Quay lại danh sách</button></div></div>;}
