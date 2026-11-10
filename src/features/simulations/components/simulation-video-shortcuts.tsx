"use client";
import { useRef, useState } from "react";
import { FastForward, ArrowRight } from "lucide-react";
import styles from "./simulation-video-shortcuts.module.css";
/** Presentation only. A scored seek/advance must be authorized and acknowledged by backend. */
export function SimulationVideoShortcuts({
  mediaKey,
  onSkip,
  onNext,
  disabled = false,
  skipDisabled = false,
  nextDisabled = false,
  skipTitle,
  nextTitle,
}: {
  mediaKey: string;
  onSkip?: () => boolean | Promise<boolean>;
  onNext?: () => void | Promise<void>;
  disabled?: boolean;
  skipDisabled?: boolean;
  nextDisabled?: boolean;
  skipTitle?: string;
  nextTitle?: string;
}) {
  const [skipUsed, setSkipUsed] = useState<Record<string, boolean>>({});
  const [nextUsed, setNextUsed] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const showSkip = !!onSkip && !skipUsed[mediaKey];
  const showNext = !!onNext && !nextUsed[mediaKey];
  async function skip() {
    if (lock.current || disabled || skipDisabled || !showSkip || !onSkip)
      return;
    lock.current = true;
    setBusy(true);
    setError(null);
    const key = mediaKey;
    try {
      if (await onSkip()) setSkipUsed((old) => ({ ...old, [key]: true }));
    } catch {
      setError("Chưa thực hiện được thao tác. Vui lòng thử lại.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function next() {
    if (lock.current || disabled || nextDisabled || !showNext || !onNext)
      return;
    lock.current = true;
    setBusy(true);
    setError(null);
    const key = mediaKey;
    try {
      await onNext();
      setNextUsed((old) => ({ ...old, [key]: true }));
    } catch {
      setError("Chưa thực hiện được thao tác. Vui lòng thử lại.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (!showSkip && !showNext) return null;
  return (
    <div className={styles.shortcuts} aria-label="Thao tác nhanh video">
      {showSkip && (
        <button
          type="button"
          className={styles.button}
          disabled={disabled || skipDisabled || busy}
          onClick={() => void skip()}
          title={skipTitle}
          aria-label="Bỏ qua 10 giây"
        >
          <FastForward className="size-4" aria-hidden="true" />
          Bỏ qua 10s
        </button>
      )}
      {showNext && (
        <button
          type="button"
          className={styles.button}
          disabled={disabled || nextDisabled || busy}
          title={nextTitle}
          onClick={() => void next()}
        >
          <span>Tiếp theo</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      )}
      {error && (
        <span role="alert" className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
/** Uses the original media clock. Never offsets saved reactions or invents an ended event. */
export function skipReadOnlyVideo(video: HTMLVideoElement | null) {
  if (
    !video ||
    video.readyState < 1 ||
    !Number.isFinite(video.duration) ||
    !Number.isFinite(video.currentTime) ||
    video.currentTime < 0 ||
    video.duration <= 10 ||
    video.currentTime >= 10
  )
    return null;
  const target = 10;
  video.currentTime = target;
  return target * 1000;
}
