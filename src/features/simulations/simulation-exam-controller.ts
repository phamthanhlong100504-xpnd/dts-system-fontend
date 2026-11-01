import type { SimulationScope } from "./simulation-learning-types";
import type { SimulationExamSource } from "./simulation-exam-source";
import type {
  ExamCommand,
  ExamPhase,
  ExamSession,
  ExamWorkspaceState,
} from "./simulation-exam-types";
import {
  validateExamPlayback,
  sameExamOrigin,
  sameExamPolicy,
  validateExamSession,
} from "./simulation-exam-validation";
/** No timers, persistence, scoring, or optimistic advancement. Every transition is acknowledged. */
export class SimulationExamController {
  state: ExamWorkspaceState = { status: "loading" };
  private listeners = new Set<() => void>();
  private disposed = false;
  private locked = false;
  private lastSession: ExamSession | null = null;
  private pendingReaction: ExamCommand | null = null;
  private requests = new Map<string, ExamCommand>();
  constructor(
    private source: SimulationExamSource,
    private scope: SimulationScope,
    private id: string,
  ) {}
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  snapshot = () => this.state;
  dispose() {
    this.disposed = true;
    this.listeners.clear();
  }
  private emit(state: ExamWorkspaceState) {
    if (this.disposed) return;
    this.state = state;
    this.listeners.forEach((fn) => fn());
  }
  private phase(phase: ExamPhase, busy = false) {
    if (this.state.status === "ready")
      this.emit({ ...this.state, data: { ...this.state.data, phase, busy } });
  }
  private async adopt(session: ExamSession) {
    validateExamSession(session, this.scope, this.id);
    if (this.disposed) return;
    const previous = this.state.status === "ready" ? this.state.data : null;
    if (this.lastSession && !validTransition(this.lastSession, session))
      throw Error("Snapshot phiên thi thay đổi.");
    if (
      this.lastSession &&
      this.lastSession.currentPosition !== session.currentPosition
    )
      this.pendingReaction = null;
    this.lastSession = session;
    if (session.status !== "IN_PROGRESS") {
      this.emit({
        status: "ready",
        data: {
          session,
          playback: null,
          phase:
            session.status === "READY_TO_SUBMIT" ? "finalizing" : "playing",
          busy: this.locked,
        },
      });
      return;
    }
    const same = previous?.playback?.position === session.currentPosition;
    if (same && previous.playback) {
      this.emit({
        status: "ready",
        data: {
          session,
          playback: {
            ...previous.playback,
            responseRecorded: session.responseRecorded,
          },
          phase: session.responseRecorded ? "recorded" : "playing",
          busy: this.locked,
        },
      });
      return;
    }
    this.emit({
      status: "ready",
      data: { session, playback: null, phase: "transition", busy: true },
    });
    try {
      const playback = await this.source.playback(this.scope, this.id);
      validateExamPlayback(playback, session);
      this.emit({
        status: "ready",
        data: {
          session,
          playback,
          phase: session.responseRecorded ? "recorded" : "playing",
          busy: this.locked,
        },
      });
    } catch {
      this.emit({
        status: "ready",
        data: { session, playback: null, phase: "video-error", busy: false },
      });
    }
  }
  private unlock() {
    this.locked = false;
    if (this.state.status === "ready")
      this.emit({ ...this.state, data: { ...this.state.data, busy: false } });
  }
  async load() {
    if (this.locked) return;
    this.locked = true;
    try {
      await this.adopt(await this.source.session(this.scope, this.id));
    } catch {
      this.emit({
        status: "error",
        message:
          "Không thể tải phiên thi. Bài thi và phản ứng đã lưu được giữ nguyên.",
      });
    } finally {
      this.unlock();
    }
  }
  private request(
    kind: ExamCommand["kind"],
    mediaTimeMs?: number,
    eventId?: string,
  ) {
    if (this.state.status !== "ready") throw Error("Phiên chưa sẵn sàng.");
    const { session: s, playback: p } = this.state.data;
    const key = `${s.sessionId}:${s.currentPosition}:${kind}`;
    let request = this.requests.get(key);
    if (!request) {
      request = {
        kind,
        sessionId: s.sessionId,
        position: s.currentPosition,
        playbackEventId: p?.playbackEventId ?? null,
        eventId: eventId ?? crypto.randomUUID(),
        ...(mediaTimeMs === undefined ? {} : { mediaTimeMs }),
      };
      this.requests.set(key, request);
    }
    return request;
  }
  async respond(mediaTimeMs: number, eventId: string) {
    if (this.locked || this.state.status !== "ready") return;
    const { session: s, playback: p, phase } = this.state.data;
    if (
      s.status !== "IN_PROGRESS" ||
      s.responseRecorded ||
      !p ||
      !["playing", "response-error"].includes(phase)
    )
      return;
    if (
      !Number.isSafeInteger(mediaTimeMs) ||
      mediaTimeMs < 0 ||
      mediaTimeMs > p.durationMs
    )
      return;
    this.pendingReaction =
      this.pendingReaction ?? this.request("REACTION", mediaTimeMs, eventId);
    await this.send(this.pendingReaction, "response-pending", "response-error");
  }
  async complete() {
    if (this.locked || this.state.status !== "ready") return;
    const { session: s, playback: p, phase } = this.state.data;
    if (
      s.status !== "IN_PROGRESS" ||
      !p ||
      !["playing", "recorded", "completion-error"].includes(phase) ||
      (this.pendingReaction && !s.responseRecorded)
    )
      return;
    await this.send(
      this.request("COMPLETE_CURRENT"),
      "transition",
      "completion-error",
    );
  }
  async submit() {
    if (
      this.state.status !== "ready" ||
      this.state.data.session.status !== "READY_TO_SUBMIT"
    )
      return;
    await this.send(this.request("SUBMIT"), "finalizing", "submission-error");
  }
  async cancel() {
    if (
      this.state.status !== "ready" ||
      !["IN_PROGRESS", "READY_TO_SUBMIT"].includes(
        this.state.data.session.status,
      )
    )
      return;
    await this.send(
      this.request("CANCEL"),
      this.state.data.phase,
      this.state.data.phase,
      true,
    );
  }
  private async send(
    command: ExamCommand,
    pending: ExamPhase,
    error: ExamPhase,
    rethrow = false,
  ) {
    if (this.locked || this.disposed) return;
    this.locked = true;
    this.phase(pending, true);
    const before =
      this.state.status === "ready" ? this.state.data.session : null;
    let failure = false;
    try {
      const next = await this.source.command(this.scope, command);
      validateExamSession(next, this.scope, this.id);
      this.validateAck(command, next, before);
      await this.adopt(next);
    } catch {
      // A lost response is uncertain. Read the server before exposing any retry.
      try {
        const next = await this.source.session(this.scope, this.id);
        validateExamSession(next, this.scope, this.id);
        this.validateAck(command, next, before);
        await this.adopt(next);
      } catch {
        this.phase(error, false);
        failure = true;
      }
    } finally {
      this.unlock();
    }
    if (failure && rethrow)
      throw Error(
        "Chưa thể hủy bài thi. Phiên hiện tại được giữ nguyên; vui lòng thử lại.",
      );
  }
  private validateAck(
    c: ExamCommand,
    s: ExamSession,
    before: ExamSession | null,
  ) {
    if (
      !before ||
      s.bankVersion !== before.bankVersion ||
      !sameSnapshot(s, before)
    )
      throw Error("Snapshot thay đổi.");
    if (
      c.kind === "REACTION" &&
      (s.currentPosition !== c.position ||
        !s.responseRecorded ||
        s.status !== "IN_PROGRESS")
    )
      throw Error("Chưa xác nhận phản ứng.");
    if (
      c.kind === "COMPLETE_CURRENT" &&
      (s.completedScenarios !== before.completedScenarios + 1 ||
        s.status !== (c.position === 10 ? "READY_TO_SUBMIT" : "IN_PROGRESS"))
    )
      throw Error("Chưa xác nhận hoàn thành.");
    if (c.kind === "SUBMIT" && s.status !== "COMPLETED")
      throw Error("Chưa xác nhận bài thi.");
    if (c.kind === "CANCEL" && s.status !== "CANCELLED")
      throw Error("Chưa hủy bài.");
  }
  async retry() {
    if (this.locked || this.state.status !== "ready") return;
    const phase = this.state.data.phase;
    if (phase === "response-error" && this.pendingReaction) {
      await this.send(
        this.pendingReaction,
        "response-pending",
        "response-error",
      );
      return;
    }
    if (phase === "completion-error") {
      await this.complete();
      return;
    }
    if (phase === "submission-error" || phase === "finalizing") {
      await this.load();
      if (
        this.state.status === "ready" &&
        this.state.data.session.status === "READY_TO_SUBMIT"
      )
        await this.submit();
      return;
    }
    await this.renewPlayback();
  }
  async renewPlayback() {
    if (
      this.locked ||
      this.state.status !== "ready" ||
      this.state.data.session.status !== "IN_PROGRESS"
    )
      return;
    this.locked = true;
    const session = this.state.data.session;
    this.emit({
      status: "ready",
      data: { session, playback: null, phase: "transition", busy: true },
    });
    try {
      const next = await this.source.session(this.scope, this.id);
      validateExamSession(next, this.scope, this.id);
      if (this.lastSession && !validTransition(this.lastSession, next))
        throw Error("Snapshot hoặc phản ứng đã lưu thay đổi.");
      if (
        next.currentPosition !== session.currentPosition ||
        next.status !== "IN_PROGRESS"
      ) {
        await this.adopt(next);
        return;
      }
      const playback = await this.source.playback(this.scope, this.id);
      validateExamPlayback(playback, next);
      this.lastSession = next;
      this.emit({
        status: "ready",
        data: {
          session: next,
          playback,
          phase: next.responseRecorded ? "recorded" : "playing",
          busy: this.locked,
        },
      });
    } catch {
      this.phase("video-error");
    } finally {
      this.unlock();
    }
  }
  mediaFault() {
    if (this.state.status === "ready" && !this.state.data.busy)
      this.phase("video-error");
  }
}

function sameSnapshot(a: ExamSession, b: ExamSession) {
  return (
    sameExamOrigin(a, b) &&
    a.bankVersion === b.bankVersion &&
    sameExamPolicy(a.policy, b.policy)
  );
}

function validTransition(a: ExamSession, b: ExamSession) {
  if (!sameSnapshot(a, b) || b.completedScenarios < a.completedScenarios)
    return false;
  if (
    a.currentPosition === b.currentPosition &&
    a.responseRecorded &&
    !b.responseRecorded &&
    b.status === "IN_PROGRESS"
  )
    return false;
  if (["COMPLETED", "CANCELLED"].includes(a.status) && a.status !== b.status)
    return false;
  return true;
}
