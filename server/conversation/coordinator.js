import { randomUUID } from "node:crypto";
import { createStorySession, farewellNarrative, isFarewellIntent, selectStoryReply } from "../story.js";
import {
  approveNarrative,
  fromStoryResult,
  toDirective,
  toScenePerformance,
} from "../narrative/directives.js";
import { classifyVoice } from "./voice-policy.js";
const clone = (value) => structuredClone(value);
const fault = (stage, error, retryable = true) => ({
  type: "turn.error",
  stage,
  code: error.message || String(error),
  retryable,
});
export class ConversationCoordinator {
  constructor({ config, registry, asr, llm, tts }) {
    Object.assign(this, { config, registry, asr, llm, tts });
    this.activeGenerations = 0;
  }
  send(session, message) {
    if (session.socket.readyState === 1)
      session.socket.send(
        JSON.stringify({ v: 1, sessionId: session.id, eventSequence: session.eventSequence++, ...message }),
      );
  }
  valid(session, turn) {
    return this.registry.active(session, turn.id) === turn;
  }
  async handle(session, event) {
    if (!this.registry.owns(session, event))
      return this.send(
        session,
        fault("protocol", new Error("session_mismatch"), false),
      );
    session.lastActive = Date.now();
    if (event.type === "turn.cancel") return this.cancel(session, event.turnId);
    if (event.type.startsWith("segment.")) return this.ack(session, event);
    if (session.ended)
      return this.send(session, { ...fault("conversation", new Error("conversation_ended"), false), turnId: event.turnId });
    if (this.config.mode === "aliyun" && !this.config.ready)
      return this.send(session, {
        ...fault(
          "configuration",
          new Error(`missing:${this.config.missing.join(",")}`),
          false,
        ),
        turnId: event.turnId,
      });
    if (event.type === "input.text") {
      if (!this.allowStart(session))
        return this.send(session, {
          ...fault("protocol", new Error("rate_limited")),
          turnId: event.turnId,
        });
      const turn = this.registry.begin(session, event.turnId);
      if (turn) return this.generate(session, turn, event.text);
      return;
    }
    if (event.type === "input.start") {
      if (!this.allowStart(session))
        return this.send(session, {
          ...fault("protocol", new Error("rate_limited")),
          turnId: event.turnId,
        });
      const turn = this.registry.begin(session, event.turnId);
      if (!turn) return;
      if (this.config.mode === "mock") {
        turn.mockVoice = true;
        return;
      }
      // Expose startup immediately: WebSocket callbacks are concurrent, so a
      // short push-to-talk can deliver audio/end while ASR is still opening.
      turn.asrReady = this.asr.start({
        onPartial: (text) => {
          if (!this.valid(session, turn)) return;
          const classification = classifyVoice(text);
          turn.lastPartial = text;
          turn.lastClassification = classification;
          this.send(session, { type: "transcript.partial", turnId: turn.id, text, provisional: true });
          this.send(session, { type: "voice.classification", turnId: turn.id, ...classification });
        },
      });
      try {
        const asr = await turn.asrReady;
        if (!this.valid(session, turn)) return asr.cancel?.();
        turn.asr = asr;
      } catch (error) {
        if (this.valid(session, turn))
          this.fail(session, turn, "stt", error.message);
      }
      return;
    }
    const turn = this.registry.active(session, event.turnId);
    if (!turn) return;
    if (event.type === "input.audio") {
      const bytes = Buffer.from(event.data, "base64");
      if (
        event.sequence !== turn.expectedSequence ||
        !bytes.length ||
        bytes.length > 48000 ||
        turn.audioBytes + bytes.length > this.registry.maxAudioBytes
      )
        return this.fail(
          session,
          turn,
          "stt",
          "invalid_audio_sequence_or_size",
        );
      turn.expectedSequence += 1;
      turn.audioBytes += bytes.length;
      if (!turn.mockVoice) {
        try {
          const asr = turn.asr || (await turn.asrReady);
          if (!this.valid(session, turn)) return;
          turn.asr = asr;
          asr.send(bytes);
        } catch (error) {
          if (this.valid(session, turn))
            this.fail(session, turn, "stt", error.message);
        }
      }
      return;
    }
    if (event.type === "input.end") {
      if (turn.mockVoice)
        return this.generate(session, turn, "我想知道你为什么还在等。");
      try {
        const asr = turn.asr || (await turn.asrReady);
        if (!this.valid(session, turn)) return;
        turn.asr = asr;
        const text = await Promise.race([
          asr.finish(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("asr_final_timeout")),
              this.config.asrFinalTimeoutMs,
            ),
          ),
        ]);
        if (!this.valid(session, turn)) return;
        if (!text) return this.fail(session, turn, "stt", "empty_speech");
        const classification = classifyVoice(text, { stable: true });
        this.send(session, { type: "voice.classification", turnId: turn.id, ...classification, stable: true });
        if (classification.kind === "backchannel") {
          this.send(session, { type: "transcript.final", turnId: turn.id, text, suppressed: true });
          turn.cancel("backchannel");
          return;
        }
        this.send(session, { type: "transcript.final", turnId: turn.id, text });
        return this.generate(session, turn, text);
      } catch (error) {
        if (this.valid(session, turn))
          this.fail(session, turn, "stt", error.message);
      }
    }
  }
  allowStart(session) {
    const cutoff = Date.now() - 60000;
    session.starts = session.starts.filter((time) => time > cutoff);
    if (session.starts.length >= 12) return false;
    session.starts.push(Date.now());
    return true;
  }
  cancel(session, turnId) {
    const turn = this.registry.active(session, turnId);
    if (!turn) return;
    turn.cancel("client");
    this.send(session, { type: "turn.cancelled", turnId });
  }
  fail(session, turn, stage, code) {
    turn.cancel(code);
    this.send(session, { ...fault(stage, new Error(code)), turnId: turn.id });
  }
  async generate(session, turn, text) {
    if (!this.valid(session, turn)) return;
    if (this.activeGenerations >= this.config.maxConcurrentTurns)
      return this.fail(session, turn, "llm", "server_busy");
    this.activeGenerations += 1;
    try {
      const provisionalStory = clone(session.story || createStorySession());
      let narrative;
      if (isFarewellIntent(text)) narrative = farewellNarrative(provisionalStory);
      else if (this.config.mode === "mock") {
        const beforeClues = [...provisionalStory.clues];
        const result = selectStoryReply(text, provisionalStory);
        result.beforeClues = beforeClues;
        if (result.error) throw new Error(result.error);
        narrative = fromStoryResult(result, provisionalStory);
      } else
        narrative = approveNarrative(
          await this.llm.generate({
            text,
            story: provisionalStory,
            history: session.history,
            signal: turn.controller.signal,
          }),
          provisionalStory,
        );
      if (!this.valid(session, turn)) return;
      turn.userText = text;
      turn.nextBeat = narrative.nextBeat;
      turn.endsConversation = narrative.segments.some((item) => item.endConversation);
      for (let index = 0; index < narrative.segments.length; index += 1) {
        const item = narrative.segments[index];
        const segmentId = `${turn.id}-${index}`;
        const segment = {
          ...item,
          id: segmentId,
          index,
          status: "pending",
          attemptId: randomUUID(),
          chunks: [],
          performance: toScenePerformance(item),
          directive: toDirective(item, narrative.nextBeat),
        };
        turn.pending.set(segmentId, segment);
        this.send(session, {
          type: "response.segment",
          turnId: turn.id,
          segmentId,
          index,
          text: item.text,
          directive: segment.directive,
          performance: segment.performance,
          presentation: { speaker: "mira" },
          mockAudio: this.config.mode === "mock",
        });
      }
      if (this.config.mode === "aliyun")
        for (const segment of turn.pending.values()) {
          if (
            !this.valid(session, turn) ||
            !(await this.speak(session, turn, segment))
          )
            break;
        }
    } catch (error) {
      if (this.valid(session, turn))
        this.fail(session, turn, "llm", error.message);
    } finally {
      this.activeGenerations -= 1;
    }
  }
  async speak(session, turn, segment) {
    let sequence = 0;
    let firstPacketAt;
    try {
      const task = await this.tts.synthesize({
        text: segment.text,
        onAudio: (chunk) => {
          if (!this.valid(session, turn)) return;
          if (!firstPacketAt) {
            firstPacketAt = Date.now();
            this.send(session, { type: "speech.timing", turnId: turn.id, segmentId: segment.id, stage: "first-audio-packet", elapsedMs: firstPacketAt - turn.startedAt });
          }
          segment.chunks.push(chunk);
          this.send(session, {
            type: "audio.chunk",
            turnId: turn.id,
            segmentId: segment.id,
            attemptId: segment.attemptId,
            sequence: sequence++,
            format: "pcm_s16le",
            sampleRate: 24000,
            channels: 1,
            data: chunk.toString("base64"),
          });
        },
      });
      turn.tts = task;
      await task.done;
      if (this.valid(session, turn))
        this.send(session, {
          type: "audio.end",
          turnId: turn.id,
          segmentId: segment.id,
          attemptId: segment.attemptId,
        });
      return true;
    } catch (error) {
      if (this.valid(session, turn))
        this.send(session, {
          ...fault("tts", error),
          turnId: turn.id,
          segmentId: segment.id,
          text: segment.text,
        });
      return false;
    }
  }
  async retry(session, turn, segment) {
    if (segment.status === "finished") return;
    segment.attemptId = randomUUID();
    segment.chunks = [];
    if (!(await this.speak(session, turn, segment))) return;
    for (const next of turn.pending.values()) {
      if (
        next.index > segment.index &&
        next.status === "pending" &&
        !next.chunks.length
      ) {
        if (!(await this.speak(session, turn, next))) break;
      }
    }
  }
  ack(session, event) {
    const turn = this.registry.active(session, event.turnId);
    const segment = turn?.pending.get(event.segmentId);
    if (!turn || !segment) return;
    if (event.attemptId && event.attemptId !== segment.attemptId) return;
    if (event.type === "segment.retry")
      return this.retry(session, turn, segment);
    if (event.type === "segment.started") {
      if (segment.status === "pending") segment.status = "started";
      return;
    }
    if (
      !["segment.finished", "segment.presented"].includes(event.type) ||
      segment.status === "finished"
    )
      return;
    segment.status = "finished";
    if (!turn.userCommitted) {
      session.history.push({ role: "user", content: turn.userText });
      turn.userCommitted = true;
    }
    session.history.push({ role: "assistant", content: segment.text });
    session.history = session.history.slice(-12);
    session.story.beat = turn.nextBeat || session.story.beat;
    if (segment.clue && !session.story.clues.includes(segment.clue))
      session.story.clues.push(segment.clue);
    if (
      [...turn.pending.values()].every((item) => item.status === "finished")
    ) {
      if (turn.endsConversation) {
        session.ended = true;
        this.send(session, { type: "conversation.ended", turnId: turn.id, reason: "user-departure" });
      } else this.send(session, { type: "turn.completed", turnId: turn.id });
      session.active = null;
    }
  }
}
