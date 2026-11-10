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
import {
  SimulationVideoShortcuts,
  skipReadOnlyVideo,
} from "./simulation-video-shortcuts";
import type {
  SimulationInterruptReason,
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
  const shortcutTransition = useRef(false);
  const skipRequest = useRef<{ ms: number; nonce: string | null } | null>(null);
  const refreshedNonce = useRef<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
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
  const interrupting = useRef<Promise<void> | null>(null);
  const lastHeartbeat = useRef(0);
  const heartbeatPending = useRef(false);
  const replayPosition = useRef(0);
  const restoreReplay = useRef<number | null>(null);
  const [time, setTime] = useState(0),
    [buffering, setBuffering] = useState(false),
    [paused, setPaused] = useState(true),
    [replayMetadata, setReplayMetadata] = useState(false);
  const [skippedReplays, setSkippedReplays] = useState<Record<string, boolean>>(
    {},
  );
  const replayKey = `${model.attemptId ?? model.scenario.id}:${model.scenario.id}`;
  const [mediaFault, setMediaFault] = useState(false),
    [starting, setStarting] = useState(false),
    [sending, setSending] = useState(false),
    [localError, setLocalError] = useState<string | null>(null),
    [canRetryResponse, setCanRetryResponse] = useState(false);
  const phase = model.phase,
    completed = phase === "completed";
  const failed =
    mediaFault || phase === "video-error" || !!model.replayUnavailable;
  const active = (phase === "playing" || phase === "recorded") && !failed;
  const canRespond =
    phase === "playing" &&
    !model.readOnly &&
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
  async function interrupt(reason: SimulationInterruptReason) {
    if (
      shortcutTransition.current ||
      latest.current.model.readOnly ||
      latest.current.model.phase === "completed" ||
      interrupting.current
    )
      return;
    fault.current = true;
    video.current?.pause();
    setMediaFault(true);
    onPlaybackFault?.();
    if (!latest.current.actions.interrupt) return;
    const work = latest.current.actions.interrupt(reason);
    interrupting.current = work;
    try {
      await work;
    } catch {
      setLocalError(
        "Kết nối bị gián đoạn. Hãy kiểm tra và tải lại lượt luyện trước khi tiếp tục.",
      );
    } finally {
      interrupting.current = null;
    }
  }
  useEffect(() => {
    const elementAtMount = video.current;
    const tick = window.setInterval(() => {
      const state = latest.current;
      const element = video.current;
      if (
        !element ||
        state.model.readOnly ||
        !state.actions.heartbeat ||
        element.paused ||
        element.ended ||
        element.seeking ||
        fault.current ||
        shortcutTransition.current ||
        waiting.current ||
        heartbeatPending.current ||
        !["playing", "recorded", "response-pending"].includes(state.model.phase)
      )
        return;
      if (
        Date.now() - lastHeartbeat.current <
        (state.model.policy.heartbeatIntervalMs ?? 3000)
      )
        return;
      heartbeatPending.current = true;
      lastHeartbeat.current = Date.now();
      void state.actions
        .heartbeat(Math.floor(element.currentTime * 1000))
        .catch(() => {
          if (
            !shortcutTransition.current &&
            latest.current.model.playbackEventId === state.model.playbackEventId
          )
            return interrupt("NETWORK");
        })
        .finally(() => {
          heartbeatPending.current = false;
        });
    }, 500);
    const offline = () => {
      void interrupt("NETWORK");
    };
    const hidden = () => {
      if (
        document.visibilityState === "hidden" &&
        hasPlayed.current &&
        !video.current?.ended
      )
        void interrupt("PAUSED");
    };
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.clearInterval(tick);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", hidden);
      elementAtMount?.pause();
    };
    // Event bridge uses current model/actions from refs, without restarting the media clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function finish() {
    const state = latest.current;
    if (
      state.model.readOnly ||
      shortcutTransition.current ||
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
      const element = video.current;
      if (!element?.ended || !Number.isFinite(element.currentTime))
        throw new Error("Video chưa kết thúc.");
      await state.actions.complete(Math.floor(element.currentTime * 1000));
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
      state.model.readOnly ||
      state.model.phase === "completed"
    )
      return;
    if (
      !retrying &&
      (fault.current ||
        shortcutTransition.current ||
        waiting.current ||
        !state.canRespond ||
        element.ended ||
        element.paused ||
        element.seeking)
    )
      return;
    const measured = retrying
      ? firstSubmission.current!.mediaTimeMs
      : Math.floor(element.currentTime * 1000);
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
          'input,textarea,select,button,a,video,[contenteditable="true"],summary,[role="dialog"]',
        )
      )
        return;
      if (
        document.querySelector('[role="dialog"][data-state="open"]') ||
        !latest.current.canRespond
      )
        return;
      event.preventDefault();
      void respond();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // respond uses the latest model/handlers and synchronous locks via refs.
  });
  async function start() {
    const { model, actions } = latest.current;
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
      }
      const element = video.current;
      if (!element) throw new Error("Chưa có URL video từ backend.");
      if (element.readyState < 1)
        await new Promise<void>((resolve, reject) => {
          const timer = window.setTimeout(
            () => done(new Error("Video chưa tải metadata.")),
            15000,
          );
          const loaded = () => done();
          const error = () => done(new Error("Không thể tải metadata video."));
          function done(reason?: Error) {
            window.clearTimeout(timer);
            element!.removeEventListener("loadedmetadata", loaded);
            element!.removeEventListener("error", error);
            if (reason) reject(reason);
            else resolve();
          }
          element.addEventListener("loadedmetadata", loaded, { once: true });
          element.addEventListener("error", error, { once: true });
        });
      if (
        !Number.isFinite(element.duration) ||
        Math.abs(element.duration * 1000 - model.scenario.durationMs) > 1500
      )
        throw new Error("Thời lượng video không khớp backend.");
      const resume = latest.current.model.resumeAtMs ?? 0;
      element.currentTime = resume / 1000;
      if (element.seeking)
        await new Promise<void>((resolve, reject) => {
          const timer = window.setTimeout(() => {
            element.removeEventListener("seeked", done);
            reject(new Error("Chưa thể khôi phục video."));
          }, 10000);
          function done() {
            window.clearTimeout(timer);
            resolve();
          }
          element.addEventListener("seeked", done, { once: true });
        });
      if (!alive.current || Math.abs(element.currentTime * 1000 - resume) > 2)
        throw Error("Chưa xác nhận đúng checkpoint video.");
      await actions.start(Math.floor(element.currentTime * 1000));
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      if (!alive.current || latest.current.model.attemptId !== model.attemptId)
        return;
      seenAttempt.current = latest.current.model.attemptId;
      await video.current?.play();
    } catch {
      if (!alive.current) return;
      shortcutTransition.current = false;
      skipRequest.current = null;
      await interrupt("PAUSED");
      setLocalError("Chưa thể bắt đầu phát video. Vui lòng thử lại.");
    } finally {
      setStarting(false);
    }
  }
  async function skipIntro() {
    const state = latest.current,
      el = video.current;
    if (
      !el ||
      !state.actions.skipIntro ||
      state.model.readOnly ||
      state.model.responseRecorded ||
      firstSubmission.current
    )
      return false;
    if (!skipRequest.current) {
      if (
        !state.model.shortcuts?.skip ||
        el.paused ||
        el.ended ||
        el.seeking ||
        waiting.current ||
        fault.current ||
        !hasPlayed.current ||
        el.currentTime >= 10
      )
        return false;
      skipRequest.current = {
        ms: Math.floor(el.currentTime * 1000),
        nonce: state.model.playbackEventId,
      };
    }
    shortcutTransition.current = true;
    el.pause();
    try {
      await state.actions.skipIntro(skipRequest.current.ms);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      if (!alive.current) return true;
      const next = latest.current.model;
      if (next.phase === "completed") {
        shortcutTransition.current = false;
        skipRequest.current = null;
        return true;
      }
      if (
        next.playbackEventId === skipRequest.current.nonce ||
        next.resumeAtMs !== 10000 ||
        next.phase !== "ready"
      )
        throw Error("Chưa xác nhận checkpoint mới.");
      video.current?.load();
      await start();
      return true;
    } catch (error) {
      setLocalError(
        "Chưa xác nhận được thao tác. Bấm Bỏ qua 10s để thử lại đúng yêu cầu đã gửi.",
      );
      throw error;
    }
  }
  async function playReplay() {
    if (starting) return;
    setStarting(true);
    setLocalError(null);
    try {
      const state = latest.current.model;
      if (
        !state.videoUrl ||
        state.replayUnavailable ||
        (state.playbackExpiresAt &&
          Date.parse(state.playbackExpiresAt) <= Date.now() + 2000)
      )
        await retryVideo();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const element = video.current;
      if (
        !element ||
        !latest.current.model.videoUrl ||
        latest.current.model.replayUnavailable
      )
        throw new Error("Video xem lại chưa sẵn sàng.");
      if (element.readyState < 1)
        await new Promise<void>((resolve, reject) => {
          const timer = window.setTimeout(
            () => done(new Error("Chưa tải được video xem lại.")),
            15000,
          );
          const loaded = () => done();
          const error = () => done(new Error("Không thể tải video xem lại."));
          function done(reason?: Error) {
            window.clearTimeout(timer);
            element!.removeEventListener("loadedmetadata", loaded);
            element!.removeEventListener("error", error);
            if (reason) reject(reason);
            else resolve();
          }
          element.addEventListener("loadedmetadata", loaded, { once: true });
          element.addEventListener("error", error, { once: true });
        });
      if (restoreReplay.current !== null) {
        element.currentTime = Math.min(
          restoreReplay.current / 1000,
          element.duration,
        );
        restoreReplay.current = null;
      }
      if (element.ended || element.currentTime >= element.duration - 0.05)
        element.currentTime = 0;
      await element.play();
    } catch {
      setLocalError(
        "Không thể phát lại video. Hãy thử tải lại video; kết quả đã lưu vẫn được giữ nguyên.",
      );
    } finally {
      setStarting(false);
    }
  }
  async function retryVideo() {
    if (!actions.renewPlayback) return;
    setLocalError(null);
    try {
      if (interrupting.current) await interrupting.current;
      const savedPosition = completed
        ? video.current && video.current.readyState > 0
          ? video.current.currentTime * 1000
          : replayPosition.current
        : null;
      await actions.renewPlayback();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      if (
        completed &&
        (latest.current.model.replayUnavailable ||
          !latest.current.model.videoUrl)
      )
        throw new Error("Chưa thể cấp video xem lại.");
      restoreReplay.current = savedPosition;
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
                if (
                  shortcutTransition.current &&
                  latest.current.model.playbackEventId ===
                    skipRequest.current?.nonce
                )
                  return;
                shortcutTransition.current = false;
                skipRequest.current = null;
                hasPlayed.current = true;
                const live = latest.current;
                if (
                  !live.model.readOnly &&
                  live.model.playbackEventId &&
                  refreshedNonce.current !== live.model.playbackEventId
                ) {
                  refreshedNonce.current = live.model.playbackEventId;
                  void live.actions
                    .refreshShortcuts?.()
                    .catch(() =>
                      setLocalError(
                        "Chưa tải được trạng thái thao tác video. Vui lòng tải lại lượt phát.",
                      ),
                    );
                }
                lastHeartbeat.current = Date.now();
                waiting.current = false;
                setPaused(false);
                setBuffering(false);
              }}
              onPause={(e) => {
                setPaused(true);
                if (
                  !e.currentTarget.ended &&
                  hasPlayed.current &&
                  !fault.current &&
                  !shortcutTransition.current &&
                  !completed
                )
                  void interrupt("PAUSED");
              }}
              onSeeking={() => {
                if (
                  active &&
                  hasPlayed.current &&
                  !starting &&
                  !shortcutTransition.current
                )
                  void interrupt("SEEK");
              }}
              onRateChange={(e) => {
                if (!completed && e.currentTarget.playbackRate !== 1) {
                  e.currentTarget.playbackRate = 1;
                  void interrupt("SEEK");
                }
              }}
              onWaiting={() => {
                waiting.current = true;
                setBuffering(true);
                if (
                  hasPlayed.current &&
                  !completed &&
                  !shortcutTransition.current
                )
                  void interrupt("NETWORK");
              }}
              onCanPlay={() => {
                waiting.current = false;
                setBuffering(false);
              }}
              onLoadStart={() => setReplayMetadata(false)}
              onLoadedMetadata={(e) => {
                setReplayMetadata(
                  e.currentTarget.readyState >= 1 &&
                    Number.isFinite(e.currentTarget.duration),
                );
                if (completed && restoreReplay.current !== null) {
                  const target = Math.min(
                    restoreReplay.current / 1000,
                    e.currentTarget.duration,
                  );
                  if (Number.isFinite(target)) {
                    e.currentTarget.currentTime = target;
                    setTime(target * 1000);
                  }
                  restoreReplay.current = null;
                }
              }}
              onTimeUpdate={(e) => {
                const measured = e.currentTarget.currentTime * 1000;
                setTime(measured);
                if (completed) replayPosition.current = measured;
              }}
              onError={() => {
                fault.current = true;
                setMediaFault(true);
                onPlaybackFault?.();
                if (!completed) void interrupt("VIDEO_ERROR");
                setBuffering(false);
              }}
              onEnded={() => {
                setPaused(true);
                if (!completed && !fault.current) void finish();
              }}
            />
          )}
          {!completed &&
            !model.readOnly &&
            !model.responseRecorded &&
            model.shortcuts?.skip &&
            !failed &&
            time < 10000 &&
            actions.skipIntro && (
              <SimulationVideoShortcuts
                mediaKey={replayKey}
                onSkip={skipIntro}
                skipDisabled={
                  starting ||
                  buffering ||
                  sending ||
                  (!skipRequest.current && paused)
                }
              />
            )}
          {completed &&
            model.policy.allowSeek &&
            !failed &&
            model.videoUrl &&
            model.scenario.durationMs > 10000 && (
              <SimulationVideoShortcuts
                mediaKey={replayKey}
                skipDisabled={!replayMetadata}
                onSkip={
                  time < 10000 && !skippedReplays[replayKey]
                    ? () => {
                        const measured = skipReadOnlyVideo(video.current);
                        if (measured !== null) {
                          setTime(measured);
                          replayPosition.current = measured;
                          setSkippedReplays((old) => ({
                            ...old,
                            [replayKey]: true,
                          }));
                        }
                        return measured !== null;
                      }
                    : undefined
                }
              />
            )}
          <span
            title={`Tình huống ${String(model.scenario.number).padStart(3, "0")} · ${model.scenario.title}`}
            className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-24px)] truncate rounded-full bg-black/55 px-3 py-1.5 text-[14.5px] font-semibold"
          >
            {`Tình huống ${String(model.scenario.number).padStart(3, "0")} · ${model.scenario.title}`}
          </span>
          {completed && paused && !failed && (
            <button
              type="button"
              aria-label="Xem lại video"
              disabled={starting}
              onClick={() => void playReplay()}
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
                {completed
                  ? "Kiểm tra kết nối hoặc tải lại video xem lại. Kết quả đã lưu được giữ nguyên."
                  : "Kiểm tra kết nối hoặc tải lại video để tiếp tục lượt luyện."}
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
                    if (paused) void start();
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
        {(localError || model.replayError) && (
          <p
            role="alert"
            className="mt-3 rounded-[9px] bg-[#fffaeb] px-3 py-2 text-[15.5px] font-medium leading-5 text-[#934d13]"
          >
            {localError ?? model.replayError}
          </p>
        )}
      </div>
    </div>
  );
}
