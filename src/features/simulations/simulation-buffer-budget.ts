/** Small cumulative playback wait only; never changes server time or media timestamps.
 * The handed-over backend tolerates 1500ms media/segment drift. Keep a lower
 * local budget, leaving margin for request/decoder delay; backend remains authoritative.
 */
export class SimulationBufferBudget {
  private spentMs = 0;
  private since: number | null = null;
  constructor(private readonly limitMs = 750) {}
  wait(now: number) {
    if (this.since === null) this.since = now;
    return Math.max(
      0,
      this.limitMs - this.spentMs - Math.max(0, now - this.since),
    );
  }
  recover(now: number) {
    if (this.since !== null) this.spentMs += Math.max(0, now - this.since);
    this.since = null;
    return this.spentMs < this.limitMs;
  }
}
/** Await actual future data before starting the server clock. An authorized seek
 * to a checkpoint happens first so the browser can request the right byte range. */
export function hasSimulationBuffer(
  video: HTMLVideoElement,
  checkpointMs: number,
) {
  if (video.readyState < 3 || !Number.isFinite(video.duration)) return false;
  if (!video.buffered.length) return video.readyState >= 4;
  const at = checkpointMs / 1000;
  const ahead = Math.min(2, Math.max(0, video.duration - at));
  for (let i = 0; i < video.buffered.length; i++) {
    if (
      video.buffered.start(i) <= at + 0.05 &&
      video.buffered.end(i) >= at + ahead - 0.05
    )
      return true;
  }
  return false;
}
