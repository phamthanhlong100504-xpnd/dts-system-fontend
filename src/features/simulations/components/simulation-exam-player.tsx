"use client";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Flag,
  Loader2,
  Maximize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  VideoOff,
} from "lucide-react";
import styles from "./simulation-exam-layout.module.css";
import { cn } from "@/lib/utils";
import type { ExamPhase, ExamPlayback } from "../simulation-exam-types";
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
  onRespond,
  onComplete,
  onFault,
  onRetry,
  designPreview = false,
}: {
  playback: ExamPlayback | null;
  phase: ExamPhase;
  position: number;
  total: number;
  recorded: boolean;
  blocked?: boolean;
  review?: boolean;
  onRespond?: (ms: number, eventId: string) => Promise<void>;
  onComplete?: () => Promise<void>;
  onFault?: () => void;
  onRetry?: () => void;
  designPreview?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null),
    frame = useRef<HTMLDivElement>(null);
  const locks = useRef({
    response: false,
    ended: false,
    fault: false,
    waiting: false,
    played: false,
    maxTime: 0,
  });
  const pending = useRef<Promise<void> | null>(null);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(true),
    [buffering, setBuffering] = useState(false),
    [fault, setFault] = useState(false),
    [time, setTime] = useState(0),
    [notice, setNotice] = useState<string | null>(null);
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
    onRespond,
    onComplete,
    review,
    phase,
  });
  useEffect(() => {
    latest.current = {
      available,
      recorded,
      onRespond,
      onComplete,
      review,
      phase,
    };
  });
  async function finish() {
    const el = video.current,
      s = latest.current,
      l = locks.current;
    if (
      s.review ||
      l.ended ||
      l.fault ||
      !l.played ||
      !el ||
      !el.ended ||
      el.currentTime * 1000 < (playback?.durationMs ?? Infinity) - 300
    )
      return;
    l.ended = true;
    try {
      if (pending.current) await pending.current;
      const n = latest.current;
      if (
        !n.onComplete ||
        !["playing", "recorded", "response-pending"].includes(n.phase)
      )
        return;
      await n.onComplete();
    } finally {
      l.ended = false;
    }
  }
  async function respond() {
    const el = video.current,
      l = locks.current,
      s = latest.current;
    if (
      !s.available ||
      s.recorded ||
      l.response ||
      l.fault ||
      l.waiting ||
      !el ||
      el.paused ||
      el.ended ||
      el.seeking ||
      !s.onRespond
    )
      return;
    const ms = Math.round(el.currentTime * 1000);
    if (!Number.isSafeInteger(ms) || ms < 0 || ms > (playback?.durationMs ?? 0))
      return;
    l.response = true;
    try {
      const promise = s.onRespond(ms, crypto.randomUUID());
      pending.current = promise;
      await promise;
    } finally {
      pending.current = null;
    }
    if (el.ended) void finish();
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
          'button,a,input,textarea,select,[contenteditable="true"],summary',
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
    if (blocked) video.current?.pause();
  }, [blocked]);
  useEffect(() => {
    if (recorded && video.current?.ended) void finish();
  });
  async function play() {
    try {
      await video.current?.play();
    } catch {
      setNotice(
        "Chưa thể phát video. Vui lòng bấm phát lại hoặc kiểm tra kết nối.",
      );
    }
  }
  const darkMessage = failed
    ? "Không thể tải video tình huống"
    : phase === "transition"
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
            key={playback.videoUrl}
            ref={video}
            src={playback.videoUrl}
            className={cn("size-full object-contain", styles.video)}
            playsInline
            preload="metadata"
            controls={review}
            onPlaying={() => {
              locks.current.played = true;
              locks.current.waiting = false;
              setPaused(false);
              setBuffering(false);
            }}
            onPause={() => setPaused(true)}
            onWaiting={() => {
              locks.current.waiting = true;
              setBuffering(true);
            }}
            onCanPlay={() => {
              locks.current.waiting = false;
              setBuffering(false);
            }}
            onTimeUpdate={(e) => {
              const el = e.currentTarget;
              if (!el.seeking)
                locks.current.maxTime = Math.max(
                  locks.current.maxTime,
                  el.currentTime,
                );
              setTime(el.currentTime * 1000);
            }}
            onSeeking={(e) => {
              if (
                !review &&
                e.currentTarget.currentTime > locks.current.maxTime + 0.5
              )
                e.currentTarget.currentTime = locks.current.maxTime;
            }}
            onError={() => {
              locks.current.fault = true;
              setFault(true);
              setBuffering(false);
              onFault?.();
            }}
            onEnded={() => {
              setPaused(true);
              if (!review) void finish();
            }}
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
                ? "Video chưa tải được. Kiểm tra kết nối và thử lại để tiếp tục bài thi."
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
              aria-label={paused ? "Tiếp tục phát video" : "Tạm dừng video"}
              className="rounded p-1 focus-visible:outline-2"
              disabled={!playback || blocked || failed}
              onClick={() => {
                if (paused) void play();
                else video.current?.pause();
              }}
            >
              {paused ? (
                <Play className="size-4" />
              ) : (
                <Pause className="size-4" />
              )}
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
