"use client";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Flag,
  Loader2,
  Maximize2,
  Play,
  Volume2,
  VolumeX,
  RotateCcw,
  VideoOff,
} from "lucide-react";
import styles from "./simulation-exam-layout.module.css";
import { cn } from "@/lib/utils";
import {
  SimulationVideoShortcuts,
  skipReadOnlyVideo,
} from "./simulation-video-shortcuts";
import type {
  ExamPhase,
  ExamPlayback,
  ExamMediaOwner,
} from "../simulation-exam-types";
import {
  SimulationBufferBudget,
  hasSimulationBuffer,
} from "../simulation-buffer-budget";
import { learningStyles, mediaTime } from "./learning-ui";
import { SimulationFeedbackModal } from "./simulation-feedback-modal";
export function SimulationExamPlayer({
  playback,
  phase,
  position,
  total,
  recorded,
  blocked = false,
  review = false,
  onStart,
  onHeartbeat,
  heartbeatIntervalMs = 3000,
  autoStart = false,
  onRespond,
  onComplete,
  onFault,
  onRetry,
  designPreview = false,
  shortcuts,
  onSkipIntro,
  onAdvance,
}: {
  playback: ExamPlayback | null;
  phase: ExamPhase;
  position: number;
  total: number;
  recorded: boolean;
  blocked?: boolean;
  review?: boolean;
  onStart?: (owner: ExamMediaOwner) => Promise<unknown>;
  onHeartbeat?: (
    readMediaTime: () => number,
    owner: ExamMediaOwner,
  ) => Promise<unknown>;
  heartbeatIntervalMs?: number;
  autoStart?: boolean;
  onRespond?: (
    ms: number,
    eventId: string,
    owner: ExamMediaOwner,
  ) => Promise<unknown>;
  onComplete?: (ms: number, owner: ExamMediaOwner) => Promise<unknown>;
  onFault?: (owner: ExamMediaOwner) => void;
  onRetry?: () => void;
  designPreview?: boolean;
  onReviewNext?: () => void;
  shortcuts?: import("../simulation-shortcut-source").ShortcutView;
  onSkipIntro?: (ms: number, owner: ExamMediaOwner) => Promise<unknown>;
  onAdvance?: (owner: ExamMediaOwner) => Promise<unknown>;
}) {
  const video = useRef<HTMLVideoElement>(null),
    frame = useRef<HTMLDivElement>(null);
  const locks = useRef({
    response: false,
    ended: false,
    fault: false,
    waiting: false,
    played: false,
    startAck: false,
    starting: false,
    autoAttempted: false,
    shortcut: false,
    wantPlay: false,
  });
  const bufferBudget = useRef(new SimulationBufferBudget());
  const bufferTimeout = useRef<number | null>(null);
  const waitAtMs = useRef(0);
  const mediaEpoch = useRef(0);
  useEffect(() => {
    const epoch = ++mediaEpoch.current;
    return () => {
      mediaEpoch.current = epoch + 1;
      if (bufferTimeout.current !== null)
        window.clearTimeout(bufferTimeout.current);
    };
  }, [playback?.playbackEventId, playback?.position]);
  const pending = useRef<Promise<unknown> | null>(null);
  const reviewTime = useRef(0),
    reviewRenewing = useRef(false);
  const [muted, setMuted] = useState(false),
    [paused, setPaused] = useState(true),
    [buffering, setBuffering] = useState(false),
    [fault, setFault] = useState(false),
    [time, setTime] = useState(0),
    [metadata, setMetadata] = useState(false),
    [notice, setNotice] = useState<string | null>(null),
    [faultDetail, setFaultDetail] = useState<string | null>(null),
    [mediaLoadFailure, setMediaLoadFailure] = useState(false);
  const [skippedReviews, setSkippedReviews] = useState<Record<string, boolean>>(
    {},
  );
  const reviewKey = `${playback?.sessionId ?? "pending"}:${position}`;
  const failed = fault || phase === "video-error";
  const available =
    !!playback &&
    !failed &&
    !blocked &&
    !review &&
    ["playing", "recorded"].includes(phase);
  const latest = useRef({
    available,
    recorded,
    onStart,
    onRespond,
    onComplete,
    onHeartbeat,
    onFault,
    review,
    phase,
    playback,
    blocked,
    shortcuts,
  });
  useEffect(() => {
    latest.current = {
      available,
      recorded,
      onStart,
      onRespond,
      onComplete,
      onHeartbeat,
      onFault,
      review,
      phase,
      playback,
      blocked,
      shortcuts,
    };
  });
  function owner(): ExamMediaOwner | null {
    const p = latest.current.playback;
    if (p) return { position: p.position, playbackEventId: p.playbackEventId };
    const c = latest.current.shortcuts;
    return c?.enabled
      ? { position: c.position, playbackEventId: c.playbackEventId }
      : null;
  }
  function mediaFault(
    detail = "Phiên phát bị gián đoạn. Tải lại để khôi phục đồng hồ bài thi; phản ứng đã lưu được giữ nguyên.",
  ) {
    const l = locks.current;
    if (l.fault) {
      video.current?.pause();
      return;
    }
    l.fault = true;
    l.wantPlay = false;
    if (bufferTimeout.current !== null)
      window.clearTimeout(bufferTimeout.current);
    bufferTimeout.current = null;
    setFaultDetail(detail);
    l.startAck = false;
    video.current?.pause();
    setFault(true);
    setPaused(true);
    setBuffering(false);
    const context = owner();
    if (context && !latest.current.review) latest.current.onFault?.(context);
  }
  function beginBufferWait() {
    const el = video.current,
      l = locks.current;
    setBuffering(true);
    if (!l.waiting) waitAtMs.current = (el?.currentTime ?? 0) * 1000;
    l.waiting = true;
    if (
      review ||
      !l.startAck ||
      !l.played ||
      l.shortcut ||
      l.fault ||
      bufferTimeout.current !== null
    )
      return;
    const remaining = bufferBudget.current.wait(performance.now());
    if (!remaining) {
      mediaFault(
        "Video bị dừng tải quá lâu để tiếp tục chấm điểm liên tục. Tải lại tình huống để tiếp tục.",
      );
      return;
    }
    bufferTimeout.current = window.setTimeout(() => {
      bufferTimeout.current = null;
      if (locks.current.waiting && !locks.current.shortcut)
        mediaFault(
          "Video đang thiếu dữ liệu. Tải lại để khôi phục lượt phát; phản ứng đã lưu không bị thay đổi.",
        );
    }, remaining);
  }
  function recoverBuffer() {
    const l = locks.current;
    if (l.fault) return false;
    if (
      l.waiting &&
      l.played &&
      l.startAck &&
      !review &&
      !bufferBudget.current.recover(performance.now())
    ) {
      mediaFault(
        "Video bị gián đoạn vượt thời gian cho phép. Tải lại để tiếp tục với trạng thái đã lưu.",
      );
      return false;
    }
    if (bufferTimeout.current !== null)
      window.clearTimeout(bufferTimeout.current);
    bufferTimeout.current = null;
    l.waiting = false;
    setBuffering(false);
    return true;
  }
  async function finish() {
    const el = video.current,
      s = latest.current,
      l = locks.current,
      context = owner();
    if (
      s.review ||
      !context ||
      l.ended ||
      l.fault ||
      l.waiting ||
      !l.played ||
      !l.startAck ||
      l.shortcut ||
      !el ||
      !el.ended ||
      !Number.isFinite(el.duration) ||
      el.currentTime * 1000 < el.duration * 1000 - 250 ||
      Math.abs(el.duration * 1000 - (s.playback?.durationMs ?? Infinity)) > 250
    )
      return;
    l.ended = true;
    const epoch = mediaEpoch.current;
    let confirmed = false;
    try {
      if (pending.current) await pending.current;
      const n = latest.current;
      if (
        epoch !== mediaEpoch.current ||
        !n.onComplete ||
        n.blocked ||
        l.fault ||
        n.playback?.playbackEventId !== context.playbackEventId ||
        n.playback.position !== context.position ||
        !["playing", "recorded", "response-pending"].includes(n.phase)
      )
        return;
      await n.onComplete(Math.floor(el.currentTime * 1000), context);
      confirmed = true;
    } catch {
      /* Controller retains the exact failed command and presents recovery. */
    } finally {
      if (!confirmed) l.ended = false;
    }
  }
  async function respond() {
    const el = video.current,
      s = latest.current,
      l = locks.current,
      context = owner();
    if (
      !s.available ||
      !context ||
      s.recorded ||
      l.response ||
      l.fault ||
      l.waiting ||
      !l.played ||
      !l.startAck ||
      l.shortcut ||
      !el ||
      el.paused ||
      el.ended ||
      el.seeking ||
      !s.onRespond
    )
      return;
    const ms = Math.floor(el.currentTime * 1000);
    if (
      !Number.isSafeInteger(ms) ||
      ms < 0 ||
      ms > (s.playback?.durationMs ?? 0)
    )
      return;
    l.response = true;
    try {
      const promise = s.onRespond(ms, crypto.randomUUID(), context);
      pending.current = promise;
      await promise;
    } catch {
      /* The same first-response request remains available through Retry. */
    } finally {
      pending.current = null;
    }
    if (el.ended) void finish();
  }
  async function play() {
    const el = video.current,
      s = latest.current,
      l = locks.current,
      context = owner();
    if (!el || !context || s.blocked || l.starting || l.fault) return;
    if (
      !s.review &&
      (s.phase !== "ready" || document.visibilityState === "hidden")
    ) {
      mediaFault();
      return;
    }
    if (Date.parse(s.playback!.expiresAt) <= Date.now()) {
      if (!s.review) mediaFault();
      onRetry?.();
      return;
    }
    if (!metadata || el.readyState < 1) {
      l.wantPlay = true;
      setBuffering(true);
      setNotice(
        "Video đang tải. Bài thi sẽ bắt đầu phát khi dữ liệu sẵn sàng.",
      );
      return;
    }
    l.starting = true;
    const epoch = mediaEpoch.current;
    try {
      if (!s.review) {
        if (!s.onStart) throw Error("Chưa có kết nối bắt đầu video.");
        if (Math.abs(el.duration * 1000 - s.playback!.durationMs) > 250)
          throw Error("Thời lượng video không khớp.");
        const checkpoint = s.playback!.restartAtMs;
        if (el.currentTime * 1000 !== checkpoint) {
          el.currentTime = checkpoint / 1000;
          if (el.seeking)
            await new Promise<void>((resolve, reject) => {
              const timer = window.setTimeout(
                () => done(Error("Chưa khôi phục checkpoint video.")),
                10000,
              );
              const seeked = () => done();
              function done(error?: Error) {
                window.clearTimeout(timer);
                el!.removeEventListener("seeked", seeked);
                if (error) reject(error);
                else resolve();
              }
              el.addEventListener("seeked", seeked, { once: true });
            });
        }
        if (
          epoch !== mediaEpoch.current ||
          Math.abs(el.currentTime * 1000 - checkpoint) > 2
        )
          throw Error("Checkpoint video không khớp.");
        setTime(el.currentTime * 1000);
        if (!hasSimulationBuffer(el, checkpoint)) {
          l.wantPlay = true;
          setBuffering(true);
          setNotice("Đang tải dữ liệu video trước khi bắt đầu tính thời gian.");
          return;
        }
        l.wantPlay = false;
        setNotice(null);
        await s.onStart(context);
        if (epoch !== mediaEpoch.current) return;
        if (
          latest.current.playback?.playbackEventId !==
            context.playbackEventId ||
          latest.current.playback.position !== context.position
        )
          return;
        if (
          document.visibilityState === "hidden" ||
          latest.current.blocked ||
          l.fault
        ) {
          mediaFault();
          return;
        }
        l.startAck = true;
      }
      await el.play();
    } catch {
      if (epoch !== mediaEpoch.current) return;
      if (!s.review) mediaFault();
      setNotice(
        "Chưa thể phát video. Vui lòng thử tải lại để khởi động đúng lượt phát.",
      );
    } finally {
      l.starting = false;
    }
  }
  async function shortcut(kind: "skip" | "next") {
    const el = video.current,
      s = latest.current,
      l = locks.current,
      context = owner();
    const capability = s.shortcuts;
    if (
      !context ||
      s.review ||
      s.blocked ||
      l.shortcut ||
      capability?.position !== context.position ||
      capability.playbackEventId !== context.playbackEventId
    )
      return false;
    if (kind === "next") {
      // The persisted first reaction is enough for this server-authorized command;
      // a broken media decoder must not require replaying a graded reaction.
      if (!capability.next || !s.recorded || pending.current || !onAdvance)
        return false;
    } else if (
      !el ||
      l.fault ||
      !l.startAck ||
      !l.played ||
      l.waiting ||
      el.paused ||
      el.ended ||
      el.seeking ||
      !capability.skip ||
      s.recorded ||
      l.response ||
      !onSkipIntro ||
      el.currentTime >= 10
    )
      return false;
    const ms = Math.floor((el?.currentTime ?? 0) * 1000);
    l.shortcut = true;
    l.startAck = false;
    l.wantPlay = false;
    if (bufferTimeout.current !== null)
      window.clearTimeout(bufferTimeout.current);
    bufferTimeout.current = null;
    el?.pause();
    try {
      if (kind === "skip") await onSkipIntro!(ms, context);
      else await onAdvance!(context);
      return true;
    } catch (error) {
      setNotice(
        "Chưa xác nhận thao tác. Chọn Thử tải lại để kiểm tra và gửi lại đúng yêu cầu.",
      );
      throw error;
    }
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.code !== "Space" ||
        e.repeat ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        !latest.current.available ||
        latest.current.recorded
      )
        return;
      if (document.querySelector('[role="dialog"]')) return;
      if (
        e.target instanceof HTMLElement &&
        e.target.closest(
          'button,a,input,textarea,select,video,[contenteditable="true"],summary',
        )
      )
        return;
      e.preventDefault();
      void respond();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  useEffect(() => {
    if (review) return;
    const timer = window.setInterval(() => {
      const el = video.current,
        s = latest.current,
        l = locks.current,
        context = owner();
      if (
        !el ||
        !context ||
        !l.startAck ||
        l.shortcut ||
        !l.played ||
        l.fault ||
        l.waiting ||
        el.paused ||
        el.ended ||
        el.seeking
      )
        return;
      if (Date.parse(s.playback!.expiresAt) <= Date.now()) {
        mediaFault();
        return;
      }
      void s
        .onHeartbeat?.(() => Math.floor(el.currentTime * 1000), context)
        .catch(() => mediaFault());
    }, heartbeatIntervalMs);
    const visibility = () => {
      if (document.visibilityState === "hidden" && locks.current.startAck)
        mediaFault();
    };
    const offline = () => {
      if (locks.current.startAck) mediaFault();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("offline", offline);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("offline", offline);
    };
    // Each nonce owns exactly one timer/listener set; callbacks read current refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    review,
    playback?.playbackEventId,
    playback?.position,
    heartbeatIntervalMs,
  ]);
  useEffect(() => {
    if (
      (blocked || (!review && phase === "video-error")) &&
      video.current &&
      !video.current.paused
    ) {
      if (!review) mediaFault();
      else video.current.pause();
    }
  });
  useEffect(() => {
    if (recorded && video.current?.ended) void finish();
  });
  useEffect(() => {
    if (
      autoStart &&
      metadata &&
      playback &&
      phase === "ready" &&
      !locks.current.autoAttempted
    ) {
      locks.current.autoAttempted = true;
      void play();
    }
  });
  const darkMessage = failed
    ? mediaLoadFailure
      ? "Chưa tải được video tình huống"
      : "Phiên phát video cần khôi phục"
    : ["transition", "starting", "restarting"].includes(phase)
      ? `Đang chuẩn bị tình huống ${String(position).padStart(2, "0")} / ${total}`
      : null;
  return (
    <div
      className={styles.player}
      data-simulation-player={review ? "review" : "exam"}
    >
      <div
        ref={frame}
        className={cn(
          "relative aspect-video overflow-hidden rounded-[14px] bg-[#172235] text-white",
          styles.playerFrame,
        )}
      >
        {playback && !designPreview && (
          <video
            ref={video}
            src={playback.videoUrl}
            className={cn("size-full object-contain", styles.video)}
            playsInline
            preload={review ? "metadata" : "auto"}
            controls={review}
            onLoadStart={() => {
              if (review) {
                reviewRenewing.current = true;
                locks.current.fault = false;
                setFault(false);
                setMediaLoadFailure(false);
                setMetadata(false);
              }
            }}
            onLoadedMetadata={(e) => {
              const el = e.currentTarget;
              if (
                !Number.isFinite(el.duration) ||
                Math.abs(el.duration * 1000 - playback.durationMs) > 250
              ) {
                mediaFault(
                  "Thời lượng video không khớp dữ liệu bài thi. Tải lại; nếu lặp lại cần kiểm tra nguồn video.",
                );
                return;
              }
              if (review && reviewTime.current > 0)
                el.currentTime = Math.min(reviewTime.current, el.duration);
              reviewRenewing.current = false;
              setMetadata(true);
              setBuffering(false);
            }}
            onPlaying={() => {
              if (!review && !locks.current.startAck) {
                mediaFault();
                return;
              }
              if (!recoverBuffer()) return;
              locks.current.played = true;
              setPaused(false);
            }}
            onPause={(e) => {
              setPaused(true);
              if (
                !review &&
                locks.current.startAck &&
                locks.current.played &&
                !e.currentTarget.ended
              )
                mediaFault();
            }}
            onWaiting={beginBufferWait}
            onStalled={() => {
              // Download stalled can occur while the current buffered video keeps playing.
              // Only an actual playback wait consumes the bounded continuity budget.
              if (locks.current.waiting) beginBufferWait();
            }}
            onCanPlay={() => {
              if (!locks.current.played || review) recoverBuffer();
              if (locks.current.wantPlay && phase === "ready") void play();
            }}
            onProgress={() => {
              if (
                locks.current.wantPlay &&
                phase === "ready" &&
                video.current &&
                hasSimulationBuffer(video.current, playback.restartAtMs)
              )
                void play();
            }}
            onTimeUpdate={(e) => {
              const el = e.currentTarget;
              setTime(el.currentTime * 1000);
              if (
                locks.current.waiting &&
                !el.paused &&
                el.readyState >= 3 &&
                el.currentTime * 1000 > waitAtMs.current
              )
                recoverBuffer();
              if (review && !reviewRenewing.current && el.readyState >= 1)
                reviewTime.current = el.currentTime;
            }}
            onSeeking={() => {
              if (!review && locks.current.startAck) mediaFault();
            }}
            onRateChange={(e) => {
              if (!review && e.currentTarget.playbackRate !== 1) mediaFault();
            }}
            onError={() => {
              setMediaLoadFailure(true);
              const code = video.current?.error?.code;
              mediaFault(
                code === 3
                  ? "Trình duyệt không giải mã được video này. Thử tải lại; nếu tiếp tục xảy ra cần kiểm tra file video."
                  : code === 4
                    ? "Nguồn video chưa phát được trên trình duyệt. Thử tải lại để lấy đường dẫn mới."
                    : "Chưa tải được dữ liệu video. Kiểm tra kết nối và thử tải lại.",
              );
            }}
            onEnded={() => {
              setPaused(true);
              if (!review && recoverBuffer()) void finish();
            }}
          />
        )}
        {review && playback && !failed && (
          <SimulationVideoShortcuts
            mediaKey={reviewKey}
            skipDisabled={!metadata}
            onSkip={
              time < 10000 &&
              playback.durationMs > 10000 &&
              !skippedReviews[reviewKey]
                ? () => {
                    const measured = skipReadOnlyVideo(video.current);
                    if (measured !== null) {
                      setTime(measured);
                      reviewTime.current = measured / 1000;
                      setSkippedReviews((old) => ({
                        ...old,
                        [reviewKey]: true,
                      }));
                    }
                    return measured !== null;
                  }
                : undefined
            }
            disabled={blocked}
          />
        )}
        {!review &&
          shortcuts?.enabled &&
          shortcuts.position === position &&
          (!playback ||
            shortcuts.playbackEventId === playback.playbackEventId) &&
          [
            "ready",
            "playing",
            "recorded",
            "video-error",
            "response-pending",
            "response-error",
            "completion-error",
          ].includes(phase) && (
            <SimulationVideoShortcuts
              mediaKey={`${reviewKey}:${shortcuts.playbackEventId}`}
              onSkip={
                !recorded &&
                time < 10000 &&
                shortcuts.startAtMs < 10000 &&
                onSkipIntro
                  ? () => shortcut("skip")
                  : undefined
              }
              skipDisabled={
                !playback || !shortcuts.skip || failed || buffering || paused
              }
              skipTitle={
                shortcuts.skipReason === "ALREADY_USED"
                  ? "Bạn đã bỏ qua phần đầu ở tình huống này."
                  : shortcuts.skipReason === "SCORING_BEFORE_INTRO_END"
                    ? "Tình huống có thời điểm nguy hiểm trong 10 giây đầu."
                    : "Bỏ qua phần đầu khi video đang phát và được cho phép."
              }
              onNext={
                onAdvance
                  ? async () => {
                      if (!(await shortcut("next")))
                        throw Error("Phản ứng chưa được xác nhận.");
                    }
                  : undefined
              }
              nextDisabled={
                !recorded || !shortcuts.next || phase === "response-pending"
              }
              nextTitle={
                !recorded
                  ? "Nhấn Phát hiện nguy hiểm và đợi xác nhận để chuyển tiếp."
                  : "Chốt điểm phản ứng đã lưu và chuyển tình huống."
              }
              disabled={blocked}
            />
          )}
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1.5 text-[14px] font-semibold">
          Tình huống {String(position).padStart(2, "0")} / {total}
          {review ? " · Xem lại" : ""}
        </span>
        {darkMessage ? (
          <div
            role={failed ? "alert" : "status"}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#172235] px-6 text-center"
          >
            {failed ? (
              <VideoOff className="size-9 text-[#c8d0df]" />
            ) : (
              <Loader2 className="size-9 animate-spin" />
            )}
            <h2 className="text-[20px] font-bold">{darkMessage}</h2>
            <p className="max-w-[430px] text-[15.5px] leading-6 text-[#d0d8e6]">
              {failed
                ? (faultDetail ??
                  "Phiên phát cần khôi phục. Phản ứng đã lưu được giữ nguyên; bạn có thể chuyển tiếp khi nút Tiếp theo sẵn sàng.")
                : "Bài thi tiếp tục khi video sẵn sàng."}
            </p>
            {failed && (
              <button
                type="button"
                className={learningStyles.primary}
                onClick={onRetry}
                disabled={!onRetry}
              >
                <RotateCcw className="size-4" />
                Thử tải lại
              </button>
            )}
          </div>
        ) : designPreview ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <Play className="size-12 text-[#a9c6f6]" />
            <p className="text-[18px] font-semibold">
              {review ? "Khung video xem lại" : "Khung video tình huống"}
            </p>
            <p className="text-[14.5px] text-[#d0d8e6]">
              Bản duyệt bố cục · Video thật lấy từ backend
            </p>
          </div>
        ) : paused && !buffering && !blocked && playback ? (
          <button
            type="button"
            aria-label={review ? "Phát video xem lại" : "Phát video bài thi"}
            className="absolute inset-0 flex items-center justify-center"
            onClick={() => void play()}
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-white text-[#0758d9]">
              <Play className="ml-1 size-7" fill="currentColor" />
            </span>
          </button>
        ) : buffering ? (
          <div
            role="status"
            aria-label="Đang tải video"
            className="absolute inset-0 flex items-center justify-center bg-black/40"
          >
            <Loader2 className="size-9 animate-spin" />
          </div>
        ) : null}
        {!review && !darkMessage && (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
            <button
              type="button"
              aria-label="Phát video bài thi"
              className="rounded p-1 focus-visible:outline-2"
              disabled={!playback || blocked || failed || !paused}
              onClick={() => {
                if (paused) void play();
              }}
            >
              <Play className="size-4" />
            </button>
            <span className="text-[13px] font-medium">
              {mediaTime(time)} / {mediaTime(playback?.durationMs ?? 0)}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full bg-[#6b9cf5]"
                style={{
                  width: `${playback ? Math.min(100, (time / playback.durationMs) * 100) : 0}%`,
                }}
              />
            </div>
            <button
              type="button"
              aria-label={muted ? "Bật âm thanh video" : "Tắt âm thanh video"}
              className="rounded p-1 focus-visible:outline-2"
              disabled={!playback}
              onClick={() => {
                if (video.current) {
                  video.current.muted = !video.current.muted;
                  setMuted(video.current.muted);
                }
              }}
            >
              {muted ? (
                <VolumeX className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
            </button>
            <button
              type="button"
              aria-label="Toàn màn hình video"
              className="rounded p-1"
              onClick={() =>
                void frame.current
                  ?.requestFullscreen()
                  .catch(() => setNotice("Chưa thể mở video toàn màn hình."))
              }
            >
              <Maximize2 className="size-4" />
            </button>
          </div>
        )}
      </div>
      {!review && (
        <button
          type="button"
          disabled={
            !available ||
            recorded ||
            paused ||
            buffering ||
            phase === "response-pending" ||
            designPreview
          }
          onClick={() => void respond()}
          data-preview-active={
            designPreview && phase === "playing" && !failed && !blocked
          }
          className={cn(
            learningStyles.primary,
            "min-h-12 w-full uppercase disabled:bg-[#e9edfa] disabled:text-[#475467] disabled:opacity-100",
            styles.detectButton,
          )}
        >
          {phase === "response-pending" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : recorded ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <Flag className="size-4" />
          )}
          {phase === "response-pending"
            ? "Đang xác nhận phản ứng"
            : recorded
              ? "Đã ghi nhận phản ứng"
              : phase === "transition"
                ? "Đang chuẩn bị tình huống tiếp theo"
                : "Phát hiện nguy hiểm"}
        </button>
      )}
      <p className={cn(styles.caption, review && styles.reviewCaption)}>
        {review
          ? "Chế độ xem lại: phát video không thay đổi kết quả đã ghi nhận."
          : "Nhấn Space hoặc bấm nút khi phát hiện nguy hiểm."}
      </p>
      <SimulationFeedbackModal
        key={notice ?? "no-notice"}
        message={notice}
        onDismiss={() => setNotice(null)}
      />
    </div>
  );
}
