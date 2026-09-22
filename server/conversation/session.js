import { randomUUID } from "node:crypto";
import { createStorySession } from "../story.js";

export class SessionRegistry {
  constructor({
    ttlMs = 1800000,
    maxAudioBytes = 960000,
    now = Date.now,
  } = {}) {
    this.sessions = new Map();
    this.ttlMs = ttlMs;
    this.maxAudioBytes = maxAudioBytes;
    this.now = now;
  }
  create(socket) {
    const session = {
      id: randomUUID(),
      token: `${randomUUID()}${randomUUID()}`,
      socket,
      active: null,
      story: createStorySession(),
      history: [],
      lastActive: this.now(),
      starts: [],
      ended: false,
      eventSequence: 0,
    };
    this.sessions.set(session.id, session);
    return session;
  }
  resume(id, token, socket) {
    const session = this.sessions.get(id);
    if (!session || session.token !== token || session.lastActive < this.now() - this.ttlMs) return null;
    session.socket = socket;
    session.lastActive = this.now();
    return session;
  }
  owns(session, event) {
    return (
      this.sessions.get(event.sessionId) === session &&
      event.token === session.token
    );
  }
  begin(session, turnId) {
    if (session.active && turnId <= session.active.id) return null;
    session.active?.cancel("superseded");
    const controller = new AbortController();
    const turn = {
      id: turnId,
      controller,
      cancelled: false,
      audioBytes: 0,
      expectedSequence: 0,
      pending: new Map(),
      startedAt: this.now(),
      cancel(reason = "cancelled") {
        if (this.cancelled) return;
        this.cancelled = true;
        controller.abort(reason);
        this.asr?.cancel?.();
        this.tts?.cancel?.();
      },
    };
    session.active = turn;
    session.lastActive = this.now();
    return turn;
  }
  active(session, turnId) {
    return session.active?.id === turnId && !session.active.cancelled
      ? session.active
      : null;
  }
  remove(session) {
    session.active?.cancel("disconnect");
    this.sessions.delete(session.id);
  }
  disconnect(session) {
    if (this.sessions.get(session.id) === session) {
      session.socket = null;
      session.lastActive = this.now();
    }
  }
  sweep() {
    const cutoff = this.now() - this.ttlMs;
    for (const session of this.sessions.values())
      if (session.lastActive < cutoff) this.remove(session);
  }
}
