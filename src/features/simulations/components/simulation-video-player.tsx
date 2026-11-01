"use client";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Flag,
  Loader2,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  VideoOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ScenarioActions,
  SimulationScenarioPage,
} from "../simulation-learning-types";
import { mediaTime, learningStyles } from "./learning-ui";
import styles from "./simulation-practice-layout.module.css";
export function SimulationVideoPlayer({
  model,
  actions,
  onPlaybackFault,
  onPlaybackRecovered,
  layout = "standalone",
}: {
  model: SimulationScenarioPage;
  actions: ScenarioActions;
  onPlaybackFault?: () => void;
  onPlaybackRecovered?: () => void;
  layout?: "standalone" | "lesson";
}) {
  const video = useRef<HTMLVideoElement>(null),
    frame = useRef<HTMLDivElement>(null);
  const hasPlayed = useRef(false),
    responseLock = useRef(false),
    endLock = useRef(false),
    fault = useRef(false),
    waiting = useRef(false);
  const seenAttempt = useRef<string | null>(null),
    responseConfirmed = useRef(false);
  const firstSubmission = useRef<{
    mediaTimeMs: number;
    eventId: string;
  } | null>(null);
  const pendingResponse = useRef<Promise<void> | null>(null);
  const [time, setTime] = useState(0),
    [buffering, setBuffering] = useState(false),
    [paused, setPaused] = useState(true);
  const [mediaFault, setMediaFault] = useState(false),
    [starting, setStarting] = useState(false),
    [sending, setSending] = useState(false),
    [localError, setLocalError] = useState<string | null>(null),
    [canRetryResponse, setCanRetryResponse] = useState(false);
  const phase = model.phase,
    completed = phase === "completed";
  const failed = mediaFault || phase === "video-error";
  const active = (phase === "playing" || phase === "recorded") && !failed;
  const canRespond =
    phase === "playing" &&
    !model.responseRecorded &&
    !starting &&
    !buffering &&
    !paused &&
    !failed &&
    !!actions.respond;
  const current = { model, actions, canRespond };
  const latest = useRef(current);
  useEffect(() => {
    latest.current = current;
  });
  async function finish() {
    const state = latest.current;
    if (
      fault.current ||
      endLock.current ||
      !hasPlayed.current ||
      !state.actions.complete ||
      !["playing", "recorded", "response-pending"].includes(state.model.phase)
    )
      return;
    endLock.current = true;
    try {
      if (pendingResponse.current) await pendingResponse.current;
      if (
        firstSubmission.current &&
        !responseConfirmed.current &&
        !latest.current.model.responseRecorded
      )
        throw new Error("Phản ứng chưa được xác nhận.");
      await state.actions.complete();
    } catch {
      endLock.current = false;
      setLocalError(
        "Chưa xác nhận được kết quả. Hãy kiểm tra trạng thái lượt luyện.",
      );
    }
  }
  async function respond(retry = false) {
    const state = latest.current;
    const element = video.current;
    const retrying =
      retry &&
      firstSubmission.current !== null &&
      !state.model.responseRecorded;
    if (
      responseLock.current ||
      !element ||
      !state.actions.respond ||
      state.model.phase === "completed"
    )
      return;
    if (
      !retrying &&
      (fault.current ||
        waiting.current ||
        !state.canRespond ||
        element.ended ||
        element.paused ||
        element.seeking)
    )
      return;
    const measured = retrying
      ? firstSubmission.current!.mediaTimeMs
      : Math.round(element.currentTime * 1000);
    if (
      !Number.isFinite(measured) ||
      measured < 0 ||
      measured > state.model.scenario.durationMs
    )
      return;
    if (!firstSubmission.current)
      firstSubmission.current = {
        mediaTimeMs: measured,
        eventId: crypto.randomUUID(),
      };
    const submission = firstSubmission.current;
    responseLock.current = true;
    setSending(true);
    setLocalError(null);
    const promise = state.actions.respond(
      submission.mediaTimeMs,
      submission.eventId,
    );
    pendingResponse.current = promise;
    try {
      await promise;
      responseConfirmed.current = true;
      setCanRetryResponse(false);
    } catch {
      responseLock.current = false;
      setCanRetryResponse(true);
      setLocalError(
        "Chưa xác nhận được phản ứng. Thử lại sẽ gửi đúng thời điểm đã ghi nhận ban đầu.",
      );
    } finally {
      pendingResponse.current = null;
      setSending(false);
    }
    if (responseConfirmed.current && video.current?.ended && !fault.current)
      void finish();
  }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.code !== "Space" ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest(
          'input,textarea,select,button,a,[contenteditable="true"],summary',
        )
      )
        return;
      if (!latest.current.canRespond) return;
      event.preventDefault();
      void respond();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // respond uses the latest model/handlers and synchronous locks via refs.
  });
  async function start() {
    const isNewAttempt = seenAttempt.current !== model.attemptId;
    if (starting || !actions.start || (failed && !isNewAttempt)) return;
    setStarting(true);
    setLocalError(null);
    try {
      if (isNewAttempt) {
        fault.current = false;
        setMediaFault(false);
        responseConfirmed.current = false;
        setCanRetryResponse(false);
        responseLock.current = false;
        endLock.current = false;
        hasPlayed.current = false;
        firstSubmission.current = null;
        if (video.current) video.current.currentTime = 0;
      }
      await actions.start();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      seenAttempt.current = latest.current.model.attemptId;
      await video.current?.play();
    } catch {
      setLocalError("Chưa thể bắt đầu phát video. Vui lòng thử lại.");
    } finally {
      setStarting(false);
    }
  }
  async function retryVideo() {
    if (!actions.renewPlayback) return;
    setLocalError(null);
    try {
      await actions.renewPlayback();
      fault.current = false;
      hasPlayed.current = false;
      endLock.current = false;
      setMediaFault(false);
      onPlaybackRecovered?.();
      video.current?.load();
    } catch {
      setLocalError(
        "Không thể tải lại video. Lượt luyện chưa được tính hoàn thành.",
      );
    }
  }
  return (
    <div
      className={layout === "lesson" ? styles.player : undefined}
      data-simulation-player={layout === "lesson" ? "practice" : undefined}
    >
      <div
        className={cn(
          "flex min-w-0 flex-col",
          layout === "lesson" && styles.playerMain,
        )}
      >
        <div
          ref={frame}
          className={cn(
            "relative aspect-video overflow-hidden rounded-[14px] bg-[#101522] text-white",
            layout === "lesson" && styles.frame,
          )}
        >
          {model.videoUrl && (
            <video
              ref={video}
              src={model.videoUrl}
              poster={model.posterUrl ?? undefined}
              className={cn(
                "size-full object-contain",
                layout === "lesson" && styles.video,
              )}
              playsInline
              preload="metadata"
              controls={completed}
              controlsList={
                model.policy.allowFullscreen ? undefined : "nofullscreen"
              }
              onPlaying={() => {
                hasPlayed.current = true;
                waiting.current = false;
                setPaused(false);
                setBuffering(false);
              }}
              onPause={() => setPaused(true)}
              onWaiting={() => {
                waiting.current = true;
                setBuffering(true);
              }}
              onCanPlay={() => {
                waiting.current = false;
                setBuffering(false);
              }}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime * 1000)}
              onError={() => {
                fault.current = true;
                setMediaFault(true);
                onPlaybackFault?.();
                setBuffering(false);
              }}
              onEnded={() => {
                setPaused(true);
                if (!fault.current) void finish();
              }}
            />
          )}
          <span className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-24px)] truncate rounded-full bg-black/55 px-3 py-1.5 text-[14.5px] font-semibold">
            Tình huống {String(model.scenario.number).padStart(3, "0")} ·{" "}
            {completed ? "Xem lại video" : "Video mô phỏng"}
          </span>
          {completed && paused && !failed && (
            <button
              type="button"
              aria-label="Xem lại video"
              disabled={!model.videoUrl}
              onClick={() =>
                void video.current
                  ?.play()
                  .catch(() => setLocalError("Không thể phát lại video."))
              }
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#101522]/30"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-white/20">
                <RotateCcw className="size-7" />
              </span>
              <span className="text-[15.5px] font-semibold">Xem lại video</span>
              <span className="text-[14.5px] text-[#c9d2e3]">
                Chỉ quan sát, không tạo lượt chấm điểm mới
              </span>
            </button>
          )}
          {failed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#101522] px-6 text-center">
              <VideoOff className="size-9 text-[#98a2b3]" aria-hidden="true" />
              <h2 className="text-[18px] font-bold">Không thể tải video</h2>
              <p className="max-w-sm text-[15.5px] leading-5 text-[#b4bdcc]">
                Kiểm tra kết nối hoặc tải lại video để tiếp tục lượt luyện.
              </p>
              <button
                type="button"
                disabled={!actions.renewPlayback}
                onClick={() => void retryVideo()}
                className={learningStyles.primary}
              >
                <RotateCcw className="size-4" />
                Thử tải lại
              </button>
            </div>
          ) : phase === "ready" ? (
            <button
              type="button"
              aria-label="Phát video tình huống"
              disabled={!model.videoUrl || !actions.start || starting}
              onClick={() => void start()}
              className="absolute inset-0 flex items-center justify-center disabled:cursor-not-allowed"
            >
              <span className="flex size-[68px] items-center justify-center rounded-full border-[7px] border-white/15 bg-white text-[#0758d9] shadow-lg">
                <Play
                  className="ml-1 size-7"
                  fill="currentColor"
                  aria-hidden="true"
                />
              </span>
            </button>
          ) : active && paused && !buffering ? (
            <button
              type="button"
              aria-label="Tiếp tục phát video"
              onClick={() => void start()}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-white text-[#0758d9]">
                <Play className="ml-1 size-7" fill="currentColor" />
              </span>
            </button>
          ) : (
            (starting ||
              phase === "starting" ||
              phase === "completing" ||
              buffering) && (
              <div
                role="status"
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#101522]/80"
              >
                <Loader2 className="size-8 animate-spin" aria-hidden="true" />
                <p className="text-[14.5px] font-semibold">
                  {phase === "completing"
                    ? "Đang xác nhận kết quả…"
                    : buffering
                      ? "Đang tải video…"
                      : "Đang chuẩn bị phát video…"}
                </p>
              </div>
            )
          )}
          {!completed && !failed && (
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-8">
              {model.policy.allowPause && (
                <button
                  type="button"
                  aria-label={paused ? "Tiếp tục phát video" : "Tạm dừng video"}
                  disabled={!active || !model.videoUrl}
                  onClick={() => {
                    if (paused)
                      void video.current
                        ?.play()
                        .catch(() =>
                          setLocalError("Không thể tiếp tục phát video."),
                        );
                    else video.current?.pause();
                  }}
                  className="rounded p-1 focus-visible:outline-2"
                >
                  {paused ? (
                    <Play className="size-4" />
                  ) : (
                    <Pause className="size-4" />
                  )}
                </button>
              )}
              <span className="shrink-0 text-[12.5px] font-semibold">
                {mediaTime(time)} / {mediaTime(model.scenario.durationMs)}
              </span>
              {model.policy.allowSeek ? (
                <input
                  aria-label="Vị trí phát video"
                  type="range"
                  min={0}
                  max={model.scenario.durationMs}
                  step={100}
                  value={Math.min(time, model.scenario.durationMs)}
                  disabled={!active}
                  onChange={(e) => {
                    if (video.current)
                      video.current.currentTime = Number(e.target.value) / 1000;
                  }}
                  className="h-1 min-w-0 flex-1 accent-[#4284f3]"
                />
              ) : (
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full bg-[#4284f3]"
                    style={{
                      width: `${model.scenario.durationMs > 0 ? Math.min(100, (time / model.scenario.durationMs) * 100) : 0}%`,
                    }}
                  />
                </div>
              )}
              {model.policy.allowFullscreen && (
                <button
                  type="button"
                  aria-label="Toàn màn hình"
                  className="rounded p-1 focus-visible:outline-2"
                  onClick={() =>
                    void frame.current
                      ?.requestFullscreen()
                      .catch(() =>
                        setLocalError(
                          "Trình duyệt chưa cho phép toàn màn hình.",
                        ),
                      )
                  }
                >
                  <Maximize2 className="size-4" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className={layout === "lesson" ? styles.action : "mt-auto pt-3"}>
          {completed ? (
            <div
              className={cn(
                "flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-[#eef2ff] px-4 text-[14.5px] font-semibold text-[#475467]",
                styles.completedAction,
              )}
            >
              <CheckCircle2 className="size-4 text-[#0758d9]" />
              Lượt luyện đã hoàn thành.
            </div>
          ) : (
            <button
              type="button"
              disabled={!canRespond || sending || model.responseRecorded}
              onClick={() => void respond()}
              className={cn(
                "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] px-5 py-3 text-[14.5px] font-bold uppercase outline-none transition focus-visible:ring-2 focus-visible:ring-[#0758d9] focus-visible:ring-offset-2 disabled:cursor-not-allowed",
                model.responseRecorded
                  ? "bg-[#e9edfa] text-[#475467]"
                  : "bg-[#0758d9] text-white hover:bg-[#064fc3] disabled:opacity-50",
              )}
            >
              {sending || phase === "response-pending" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang xác nhận phản ứng
                </>
              ) : model.responseRecorded ? (
                <>
                  <CheckCircle2 className="size-4" />
                  Đã ghi nhận phản ứng
                </>
              ) : (
                <>
                  <Flag className="size-4" />
                  Phát hiện nguy hiểm
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <div className={cn("min-w-0", layout === "lesson" && styles.captionWrap)}>
        <p
          className={
            layout === "lesson"
              ? styles.caption
              : "mt-2 text-center text-[14.5px] font-medium leading-5 text-[#475467]"
          }
        >
          {completed
            ? "Phát lại chỉ để quan sát, không tạo lượt chấm điểm mới."
            : "Nhấn Space hoặc nút Phát hiện nguy hiểm. Mỗi lượt luyện chỉ ghi nhận phản ứng đầu tiên."}
        </p>
        {canRetryResponse && (
          <button
            type="button"
            onClick={() => void respond(true)}
            disabled={sending || model.responseRecorded}
            className={cn(learningStyles.secondary, "mt-3")}
          >
            <RotateCcw className="size-4" />
            Thử gửi lại phản ứng
          </button>
        )}
        {localError && (
          <p
            role="alert"
            className="mt-3 rounded-[9px] bg-[#fffaeb] px-3 py-2 text-[15.5px] font-medium leading-5 text-[#934d13]"
          >
            {localError}
          </p>
        )}
      </div>
    </div>
  );
}
