import { describe, expect, it, vi } from "vitest";
import { SessionRegistry } from "./session.js";
import { ConversationCoordinator } from "./coordinator.js";
const socket = () => ({
  readyState: 1,
  sent: [],
  send(value) {
    this.sent.push(JSON.parse(value));
  },
});
const event = (session, value) => ({
  v: 1,
  sessionId: session.id,
  token: session.token,
  ...value,
});
const setup = () => {
  const registry = new SessionRegistry();
  const session = registry.create(socket());
  const coordinator = new ConversationCoordinator({
    config: { mode: "mock", maxConcurrentTurns: 4 },
    registry,
    asr: {},
    llm: {},
    tts: {},
  });
  return { registry, session, coordinator };
};
describe("conversation coordination", () => {
  it("isolates cancellation and rejects stale turn output", async () => {
    const a = setup();
    const other = a.registry.create(socket());
    await a.coordinator.handle(
      a.session,
      event(a.session, { type: "input.text", turnId: 1, text: "是的" }),
    );
    await a.coordinator.handle(
      a.session,
      event(a.session, { type: "input.text", turnId: 2, text: "多谢" }),
    );
    a.coordinator.cancel(a.session, 1);
    expect(a.registry.active(a.session, 2)?.cancelled).toBe(false);
    expect(other.active).toBe(null);
  });
  it("commits a clue only after segment completion", async () => {
    const { session, coordinator } = setup();
    await coordinator.handle(
      session,
      event(session, { type: "input.text", turnId: 1, text: "照片" }),
    );
    const segment = session.socket.sent.find(
      (item) => item.type === "response.segment",
    );
    expect(segment.directive).toMatchObject({ version: 1, character: { action: "hold-camera" }, media: [], story: { clue: "camera" } });
    expect(session.story.clues).not.toContain("camera");
    coordinator.ack(
      session,
      event(session, {
        type: "segment.started",
        turnId: 1,
        segmentId: segment.segmentId,
      }),
    );
    expect(session.story.clues).not.toContain("camera");
    coordinator.ack(
      session,
      event(session, {
        type: "segment.finished",
        turnId: 1,
        segmentId: segment.segmentId,
      }),
    );
    expect(session.story.clues).toContain("camera");
  });
  it("rejects oversized audio and cancels the owning turn", async () => {
    const { session, coordinator } = setup();
    await coordinator.handle(
      session,
      event(session, {
        type: "input.start",
        turnId: 1,
        format: "pcm_s16le",
        sampleRate: 16000,
        channels: 1,
      }),
    );
    await coordinator.handle(
      session,
      event(session, {
        type: "input.audio",
        turnId: 1,
        sequence: 0,
        data: Buffer.alloc(50000).toString("base64"),
      }),
    );
    expect(session.socket.sent.at(-1)).toMatchObject({
      type: "turn.error",
      stage: "stt",
    });
  });
  it("waits for ASR startup when push-to-talk is released immediately", async () => {
    const registry = new SessionRegistry();
    const session = registry.create(socket());
    let resolveStart;
    const calls = [];
    const coordinator = new ConversationCoordinator({
      config: { mode: "aliyun", ready: true, missing: [], maxConcurrentTurns: 4, asrFinalTimeoutMs: 1000 },
      registry,
      asr: { start: vi.fn(() => new Promise((resolve) => { resolveStart = resolve; })) },
      llm: {},
      tts: {},
    });
    const start = coordinator.handle(session, event(session, { type: "input.start", turnId: 1, format: "pcm_s16le", sampleRate: 16000, channels: 1 }));
    const audio = coordinator.handle(session, event(session, { type: "input.audio", turnId: 1, sequence: 0, data: Buffer.from([1, 2]).toString("base64") }));
    const end = coordinator.handle(session, event(session, { type: "input.end", turnId: 1 }));

    resolveStart({
      send: () => calls.push("send"),
      finish: async () => { calls.push("finish"); return ""; },
      cancel() {},
    });
    await Promise.all([start, audio, end]);

    expect(calls).toEqual(["send", "finish"]);
    expect(session.socket.sent.some((item) => item.code === "asr_not_ready")).toBe(false);
  });
  it("retries only TTS and then resumes queued sentences", async () => {
    const registry = new SessionRegistry();
    const session = registry.create(socket());
    const llm = {
      generate: vi.fn().mockResolvedValue({
        segments: [
          {
            text: "第一句",
            emotion: "calm",
            action: "none",
            event: "none",
            clue: null,
          },
          {
            text: "第二句",
            emotion: "curious",
            action: "hold-camera",
            event: "none",
            clue: null,
          },
        ],
        nextBeat: "talk",
      }),
    };
    let calls = 0;
    const tts = {
      synthesize: vi.fn(async ({ onAudio }) => {
        calls += 1;
        if (calls === 1) throw new Error("tts_down");
        onAudio(Buffer.from([0, 0]));
        return { done: Promise.resolve(), cancel() {} };
      }),
    };
    const coordinator = new ConversationCoordinator({
      config: {
        mode: "aliyun",
        ready: true,
        missing: [],
        maxConcurrentTurns: 4,
      },
      registry,
      asr: {},
      llm,
      tts,
    });
    await coordinator.handle(
      session,
      event(session, { type: "input.text", turnId: 1, text: "你好" }),
    );
    const failed = session.socket.sent.find(
      (item) => item.type === "turn.error" && item.stage === "tts",
    );
    expect(failed.segmentId).toBe("1-0");
    await coordinator.handle(
      session,
      event(session, { type: "segment.retry", turnId: 1, segmentId: "1-0" }),
    );
    expect(tts.synthesize).toHaveBeenCalledTimes(3);
    expect(llm.generate).toHaveBeenCalledTimes(1);
    expect(
      session.socket.sent.filter((item) => item.type === "audio.end"),
    ).toHaveLength(2);
  });
  it("ignores stale attempt acknowledgements and cancelled story output", async () => {
    const { session, coordinator } = setup();
    await coordinator.handle(session, event(session, { type: "input.text", turnId: 1, text: "照片" }));
    const segment = session.socket.sent.find((item) => item.type === "response.segment");
    coordinator.ack(session, event(session, { type: "segment.finished", turnId: 1, segmentId: segment.segmentId, attemptId: "stale-attempt" }));
    expect(session.story.clues).not.toContain("camera");
    coordinator.cancel(session, 1);
    coordinator.ack(session, event(session, { type: "segment.finished", turnId: 1, segmentId: segment.segmentId }));
    expect(session.story.clues).not.toContain("camera");
  });
  it("ends only after the farewell is presented and rejects later input", async () => {
    const { session, coordinator } = setup();
    await coordinator.handle(session, event(session, { type: "input.text", turnId: 1, text: "再见" }));
    const segment = session.socket.sent.find((item) => item.type === "response.segment");
    expect(segment.directive).toMatchObject({ character: { action: "farewell-nod" }, story: { nextBeat: "farewell", endConversation: true, endReason: "user-departure" } });
    expect(session.ended).toBe(false);
    coordinator.ack(session, event(session, { type: "segment.finished", turnId: 1, segmentId: segment.segmentId }));
    expect(session.ended).toBe(true);
    expect(session.socket.sent.at(-1)).toMatchObject({ type: "conversation.ended", reason: "user-departure" });
    await coordinator.handle(session, event(session, { type: "input.text", turnId: 2, text: "继续聊" }));
    expect(session.socket.sent.at(-1)).toMatchObject({ type: "turn.error", code: "conversation_ended" });
  });
  it("allows new input to interrupt a farewell before completion", async () => {
    const { session, coordinator } = setup();
    await coordinator.handle(session, event(session, { type: "input.text", turnId: 1, text: "我要走了" }));
    const farewell = session.socket.sent.find((item) => item.type === "response.segment");
    await coordinator.handle(session, event(session, { type: "input.text", turnId: 2, text: "等等，我还有话说" }));
    coordinator.ack(session, event(session, { type: "segment.finished", turnId: 1, segmentId: farewell.segmentId }));
    expect(session.ended).toBe(false);
    expect(session.active?.id).toBe(2);
  });
});
